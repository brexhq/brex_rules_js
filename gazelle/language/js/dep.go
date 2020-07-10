package js

import (
	"encoding/json"
	. "fmt"
	"io/ioutil"

	"github.com/bazelbuild/bazel-gazelle/language"
	"github.com/bazelbuild/bazel-gazelle/rule"
)

type npmPackageJson struct {
	DevDependencies map[string]string `json:"devDependencies"`
	Dependencies    map[string]string `json:"dependencies"`
}

type npmPackageLock struct {
	Name            string                       `json:"name"`
	Version         string                       `json:"version"`
	LockfileVersion int                          `json:"lockfileVersion"`
	Dependencies    map[string]NpmPackageDepInfo `json:"dependencies"`
}

type NpmPackageDepInfo struct {
	Version   string            `json:"version"`
	Resolved  string            `json:"resolved"`
	Integrity string            `json:"integrity"`
	Requires  map[string]string `json:"requires"`
	Optional  bool              `json:"optional"`
	DevOnly   bool              `json:"dev"`
}

func importReposFromNpm(rl *JSLanguage, args language.ImportReposArgs) language.ImportReposResult {
	data, err := ioutil.ReadFile(args.Path)

	if err != nil {
		return language.ImportReposResult{Error: err}
	}

	var file npmPackageLock

	if err := json.Unmarshal(data, &file); err != nil {
		return language.ImportReposResult{Error: err}
	}

	if file.LockfileVersion != 1 {
		err := Errorf("package-lock version %d is not supported", file.LockfileVersion)
		return language.ImportReposResult{Error: err}
	}

	return importDeps(args, file.Dependencies)
}

func importReposFromYarn(l *JSLanguage, args language.ImportReposArgs) language.ImportReposResult {
	deps, err := l.inspect.InspectYarn(args.Path)

	if err != nil {
		return language.ImportReposResult{Error: err}
	}

	return importDeps(args, deps)
}

func importDeps(args language.ImportReposArgs, deps map[string]NpmPackageDepInfo) language.ImportReposResult {
	cfg := GetConfig(args.Config)
	gen := make([]*rule.Rule, 0, len(deps))

	for name, dep := range deps {
		r := rule.NewRule("npm_package_index", cfg.NpmPath(name))

		r.SetAttr("module_name", name)
		r.SetAttr("version", dep.Version)
		r.SetAttr("resolved", dep.Resolved)
		// TODO: If this was to actually download files,
		// we would have to download the file using the declared integrity
		// and store its sha256 sum so the repository declaration follows Bazel standards.
		// We have to do this as integrity supports more than just sha256.
		r.SetAttr("integrity", dep.Integrity)
		r.SetAttr("optional", dep.Optional)
		r.SetAttr("dev_only", dep.DevOnly)

		gen = append(gen, r)
	}

	return language.ImportReposResult{Gen: gen}
}

func filterWithPackageJson(rules []*rule.Rule, packageFile string) ([]*rule.Rule, error) {
	data, err := ioutil.ReadFile(packageFile)

	if err != nil {
		return nil, err
	}

	var file npmPackageJson

	if err := json.Unmarshal(data, &file); err != nil {
		return nil, err
	}

	filtered := make([]*rule.Rule, 0, len(rules))

	for _, r := range rules {
		name := r.AttrString("module_name")
		_, found := file.Dependencies[name]
		_, foundDev := file.DevDependencies[name]

		if !found && !foundDev {
			continue
		}

		if foundDev && !found {
			r.SetAttr("dev_only", true)
		}

		filtered = append(filtered, r)
	}

	return filtered, nil
}
