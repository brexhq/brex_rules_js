package js

import "path"

type CodeLanguage string

const (
	_                  CodeLanguage = ""
	UnknownLanguage                 = "unknown"
	TypescriptLanguage              = "typescript"
	JavascriptLanguage              = "javascript"
)

var (
	TestExtensions = []string{
		".test.js",
		".test.ts",
		".test.jsx",
		".test.tsx",
		".spec.js",
		".spec.ts",
		".spec.tsx",
		".spec.jsx",
	}

	TsExtensions = []string{
		".ts",
		".tsx",
	}

	JsExtensions = []string{
		".js",
		".jsx",
	}

	CodeExtensions = []string{
		".ts",
		".tsx",
		".js",
		".jsx",
	}

	IgnoredExtensions = []string{
		".config.js",
		".config.ts",
	}
)

type FileInfo struct {
	Path, Name string

	Language CodeLanguage
	IsTest   bool

	Imports       []string
}

func GuessLanguage(filename string) CodeLanguage {
	if HasAnySuffix(filename, TsExtensions...) {
		return TypescriptLanguage
	}

	if HasAnySuffix(filename, JsExtensions...) {
		return JavascriptLanguage
	}

	return UnknownLanguage
}

func BuildFileInfo(filename string, imports []string) *FileInfo {
	return &FileInfo{
		Path:     path.Dir(filename),
		Name:     path.Base(filename),
		Language: GuessLanguage(filename),
		IsTest:   HasAnySuffix(filename, TestExtensions...),
		Imports:  imports,
	}
}
