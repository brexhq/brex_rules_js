package js

import (
	"strings"
)

func HasAnySuffix(str string, suffixes ...string) bool {
	for _, s := range suffixes {
		if strings.HasSuffix(str, s) {
			return true
		}
	}

	return false
}

func HasAnyPrefix(str string, suffixes ...string) bool {
	for _, s := range suffixes {
		if strings.HasPrefix(str, s) {
			return true
		}
	}

	return false
}

func MatchesAny(str string, strs ...string) bool {
	for _, s := range strs {
		if str == s {
			return true
		}
	}

	return false
}
