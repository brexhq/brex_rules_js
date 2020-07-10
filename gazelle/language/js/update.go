package js

import (
	"path/filepath"

	"github.com/bazelbuild/bazel-gazelle/language"
	"github.com/bazelbuild/bazel-gazelle/rule"
)

var repoImportFuncs = map[string]func(*JSLanguage, language.ImportReposArgs) language.ImportReposResult{
	"package-lock.json": importReposFromNpm,
	"yarn.lock":         importReposFromYarn,
}

func (s *JSLanguage) CanImport(path string) bool {
	return repoImportFuncs[filepath.Base(path)] != nil
}

func (s *JSLanguage) ImportRepos(args language.ImportReposArgs) language.ImportReposResult {
	cfg := GetConfig(args.Config)
	res := repoImportFuncs[filepath.Base(args.Path)](s, args)

	if cfg.NpmPackageFile != "" {
		filtered, err := filterWithPackageJson(res.Gen, cfg.NpmPackageFile)

		if err != nil {
			return language.ImportReposResult{Error: err}
		}

		res.Gen = filtered
	}

	if args.Prune {
		genNamesSet := make(map[string]bool)
		for _, r := range res.Gen {
			genNamesSet[r.Name()] = true
		}
		for _, r := range args.Config.Repos {
			if name := r.Name(); r.Kind() == "npm_repository_index" && !genNamesSet[name] {
				res.Empty = append(res.Empty, rule.NewRule("npm_repository_index", name))
			}
		}
	}

	return res
}
