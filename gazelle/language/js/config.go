package js

import (
	"flag"
	"fmt"
	"path"

	"github.com/bazelbuild/bazel-gazelle/config"
	"github.com/bazelbuild/bazel-gazelle/label"
	"github.com/bazelbuild/bazel-gazelle/language/proto"
	"github.com/bazelbuild/bazel-gazelle/rule"
)

type PackageMode string
type Compiler string

const directiveNpm = "npm_workspace"
const directiveJestConfig = "jest_config"
const directiveWorkspace = "workspace"
const directiveEslintEnabled = "eslint_enabled"
const directiveEslintConfig = "eslint_config"
const directiveNpmPackage = "npm_package"
const directiveTsConfig = "ts_config"
const directiveBabelConfig = "babel_config"
const directivePackageMode = "js_package_mode"
const directivePackage = "js_package"
const directiveCompiler = "js_compiler"

const (
	_                     PackageMode = ""
	PackageModeIndividual             = "individual"
	PackageModeUnified                = "unified"
)

const (
	_                 Compiler = ""
	CompilerTsLibrary          = "ts_library"
	CompilerBabel              = "babel"
)

type Config struct {
	WorkspaceName string

	Package     string
	PackageMode PackageMode
	Compiler    Compiler

	NpmWorkspaceName string
	NpmPackage       label.Label
	NpmPackageFile   string
	AllowNpmGuessing bool

	TsConfig    label.Label
	BabelConfig label.Label
	JestConfig  label.Label

	EslintEnabled bool
	EslintConfig  label.Label

	ApolloEnabled bool
	ApolloSchema  label.Label

	WebpackAssets []string

	NpmPackageIndex map[string]*rule.Rule
}

func GetConfig(c *config.Config) *Config {
	js := c.Exts[LanguageName]

	if js == nil {
		return nil
	}

	return js.(*Config)
}

func SetConfig(c *config.Config, cfg *Config) {
	c.Exts[LanguageName] = cfg
}

func GetProtoMode(c *config.Config) proto.Mode {
	if pc := proto.GetProtoConfig(c); pc != nil {
		return pc.Mode
	} else {
		return proto.DisableGlobalMode
	}
}

func (c *Config) WorkspacePath(p string) string {
	if c.WorkspaceName == "" {
		return p
	}

	return path.Join(c.WorkspaceName, p)
}

func (c *Config) NpmPath(p string) string {
	return fmt.Sprintf("@%s//%s", c.NpmWorkspaceName, p)
}

func (c *Config) IsCode(path string) bool {
	return HasAnySuffix(path, CodeExtensions...)
}

func (c *Config) IsAsset(path string) bool {
	return HasAnySuffix(path, c.WebpackAssets...)
}

// Cloning is important so we can maintain a hierarchical
// configuration.
func (c *Config) Clone() *Config {
	cc := *c
	cc.WebpackAssets = append(make([]string, 0), cc.WebpackAssets...)
	return &cc
}

// RegisterFlags registers command-line flags used by the extension. This
// method is called once with the root configuration when Gazelle
// starts. RegisterFlags may set an initial values in Config.Exts. When flags
// are set, they should modify these values.
func (s *JSLanguage) RegisterFlags(fs *flag.FlagSet, cmd string, c *config.Config) {
	js := &Config{
		NpmWorkspaceName: "npm",
		AllowNpmGuessing: false,
		PackageMode:      PackageModeIndividual,
		Compiler:         CompilerTsLibrary,
		NpmPackageIndex:  map[string]*rule.Rule{},
	}

	if cmd == "update-repos" {
		fs.StringVar(&js.NpmPackageFile, "package-json", "", "filter imported packages using package.json")
	}

	SetConfig(c, js)
}

// CheckFlags validates the configuration after command line flags are parsed.
// This is called once with the root configuration when Gazelle starts.
// CheckFlags may set default values in flags or make implied changes.
func (s *JSLanguage) CheckFlags(fs *flag.FlagSet, c *config.Config) error {
	cfg := GetConfig(c)

	for _, r := range c.Repos {
		if r.Kind() == "npm_package_index" {
			cfg.NpmPackageIndex[r.AttrString("module_name")] = r
		}
	}

	return nil
}

// KnownDirectives returns a list of directive keys that this Configurer can
// interpret. Gazelle prints errors for directives that are not recognized by
// any Configurer.
func (s *JSLanguage) KnownDirectives() []string {
	return []string{
		directiveNpm,
		directiveJestConfig,
		directiveWorkspace,
		directiveEslintEnabled,
		directiveEslintConfig,
		directiveNpmPackage,
		directiveTsConfig,
		directiveBabelConfig,
		directivePackageMode,
		directivePackage,
		directiveCompiler,
	}
}

// Configure modifies the configuration using directives and other information
// extracted from a build file. Configure is called in each directory.
//
// c is the configuration for the current directory. It starts out as a copy
// of the configuration for the parent directory.
//
// rel is the slash-separated relative path from the repository root to
// the current directory. It is "" for the root directory itself.
//
// f is the build file for the current directory or nil if there is no
// existing build file.
func (s *JSLanguage) Configure(c *config.Config, rel string, f *rule.File) {
	cfg := GetConfig(c).Clone()
	SetConfig(c, cfg)

	if cfg.Package != "" {
		cfg.Package = fmt.Sprintf("%s/%s", cfg.Package, path.Base(rel))
	}

	if f == nil {
		return
	}

	for _, d := range f.Directives {
		switch d.Key {
		case directiveNpm:
			cfg.NpmWorkspaceName = d.Value
		case directiveJestConfig:
			cfg.JestConfig = resolveRelativeLabel(d.Value, f)
		case directiveWorkspace:
			cfg.WorkspaceName = d.Value
		case directiveEslintEnabled:
			cfg.EslintEnabled = d.Value == "yes"
		case directiveEslintConfig:
			cfg.EslintConfig = resolveRelativeLabel(d.Value, f)
		case directiveNpmPackage:
			cfg.NpmPackage = resolveRelativeLabel(d.Value, f)
		case directiveTsConfig:
			cfg.TsConfig = resolveRelativeLabel(d.Value, f)
		case directiveBabelConfig:
			cfg.BabelConfig = resolveRelativeLabel(d.Value, f)
		case directivePackage:
			cfg.Package = d.Value
		case directivePackageMode:
			if d.Value != PackageModeUnified && d.Value != PackageModeIndividual {
				panic("invalid js_package_mode: " + d.Value)
			}

			cfg.PackageMode = PackageMode(d.Value)
		case directiveCompiler:
			if d.Value != CompilerTsLibrary && d.Value != CompilerBabel {
				panic("invalid js_compiler: " + d.Value)
			}

			cfg.Compiler = Compiler(d.Value)
		}
	}
}

func resolveRelativeLabel(s string, f *rule.File) label.Label {
	lbl, err := label.Parse(s)

	if err != nil {
		panic(err)
	}

	if lbl.Relative {
		lbl = label.New("", f.Pkg, lbl.Name)
	}

	return lbl
}
