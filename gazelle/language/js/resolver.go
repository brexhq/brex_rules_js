package js

import (
	"errors"
	"fmt"
	"path"
	"strings"

	"github.com/bazelbuild/bazel-gazelle/config"
	"github.com/bazelbuild/bazel-gazelle/label"
	"github.com/bazelbuild/bazel-gazelle/resolve"
	"github.com/bazelbuild/bazel-gazelle/rule"
)

var SkipImportError = errors.New("std import")

type Import struct {
	FromPackage string
	Import      string
}

type resolveFn func(imp Import, from label.Label) (label.Label, bool, error)

type Resolver struct {
	c              *config.Config
	cfg            *Config
	ix             *resolve.RuleIndex
	lang           string
	defaultImports []string
}

func NewResolver(c *config.Config, ix *resolve.RuleIndex, lang string, defaultImports []string) *Resolver {
	return &Resolver{
		c:              c,
		cfg:            GetConfig(c),
		ix:             ix,
		lang:           lang,
		defaultImports: defaultImports,
	}
}

func (r *Resolver) ResolveNpm(imp Import, from label.Label) (label.Label, bool, error) {
	if !isPossibleNpmDependency(imp.Import) {
		return label.NoLabel, false, nil
	}

	s := strings.SplitN(imp.Import, "/", 3)
	pkg := s[0]

	if pkg == r.cfg.WorkspaceName {
		return label.NoLabel, false, nil
	}

	if strings.HasPrefix(imp.Import, "@") {
		pkg += "/" + s[1]
	}

	_, found := r.cfg.NpmPackageIndex[pkg]

	if !found && !r.cfg.AllowNpmGuessing {
		return label.NoLabel, false, nil
	}

	return label.New(r.cfg.NpmWorkspaceName, pkg, path.Base(pkg)), true, nil
}

func (r *Resolver) ResolveWildcard(imp Import, from label.Label) (label.Label, bool, error) {
	wild := path.Join(path.Dir(imp.Import), "*")

	return r.ResolveWithIndex(Import{
		Import:      wild,
		FromPackage: imp.FromPackage,
	}, from)
}

func (r *Resolver) ResolveDefaultImport(imp Import, from label.Label) (label.Label, bool, error) {
	for _, def := range r.defaultImports {
		l, found, err := r.ResolveWithIndex(Import{
			Import:      path.Join(imp.Import, def),
			FromPackage: imp.FromPackage,
		}, from)

		if err != nil {
			return label.NoLabel, false, err
		}

		if found {
			return l, true, nil
		}
	}

	return label.NoLabel, false, nil
}

func (r *Resolver) ResolveOverride(imp Import, from label.Label) (label.Label, bool, error) {
	l, found := resolve.FindRuleWithOverride(r.c, resolve.ImportSpec{Lang: "proto", Imp: imp.Import}, LanguageName)

	if !found {
		return label.NoLabel, false, nil
	}

	return l, true, nil
}

func (r *Resolver) ResolveWithIndex(imp Import, from label.Label) (label.Label, bool, error) {
	res := resolve.ImportSpec{
		Lang: r.lang,
		Imp:  strings.ToLower(imp.Import),
	}

	matches := r.ix.FindRulesByImport(res, LanguageName)

	if len(matches) == 0 {
		return label.NoLabel, false, nil
	}

	if len(matches) > 1 {
		return label.NoLabel, false, fmt.Errorf("multiple rules (%s and %s) may be imported with %q from %s", matches[0].Label, matches[1].Label, imp, from)
	}

	if matches[0].IsSelfImport(from) {
		return label.NoLabel, false, SkipImportError
	}

	return matches[0].Label, true, nil
}

// normaliseImports ensures that relative imports or alias imports can all resolve to the same file
func normaliseImports(imp Import) Import {
	result := imp.Import

	if HasAnyPrefix(result, "./", "../") || MatchesAny(result, ".", "..") {
		result = path.Join(imp.FromPackage, result)
	}

	return Import{
		Import:      result,
		FromPackage: imp.FromPackage,
	}
}

func isPossibleNpmDependency(imp string) bool {
	return !HasAnyPrefix(imp, "./", "/", "../", "~/", "@/", "~~/") && !MatchesAny(imp, ".", "..")
}

func buildPackageName(cfg *Config, rel string, r *rule.Rule) string {
	packageName := ""

	if r != nil {
		if r.Kind() == "ts_library" {
			packageName = r.AttrString("module_name")
		} else {
			packageName = r.AttrString("module_name")
		}
	}

	if packageName == "" {
		packageName = cfg.Package
	}

	if packageName == "" {
		packageName = cfg.WorkspacePath(rel)
	}

	return packageName
}

func resolveOrFail(imp Import, from label.Label, resolvers ...resolveFn) (label.Label, error) {
	l, found, err := tryResolve(imp, from, resolvers...)

	if err != nil {
		return label.NoLabel, err
	}

	if !found {
		return label.NoLabel, fmt.Errorf("Import %v for %s not found.\n", imp, from.Abs(from.Repo, from.Pkg).String())
	}

	return l, nil
}

func tryResolve(imp Import, from label.Label, resolvers ...resolveFn) (label.Label, bool, error) {
	for _, r := range resolvers {
		l, found, err := r(imp, from)

		if err != nil {
			return label.NoLabel, false, err
		}

		if found {
			return l, true, nil
		}
	}

	return label.NoLabel, false, nil
}
