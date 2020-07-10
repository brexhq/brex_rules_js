#!/usr/bin/env bash

# --- begin runfiles.bash initialization v2 ---
# Copy-pasted from the Bazel Bash runfiles library v2.
set -uo pipefail
f=bazel_tools/tools/bash/runfiles/runfiles.bash
source "${RUNFILES_DIR:-/dev/null}/$f" 2>/dev/null ||
  source "$(grep -sm1 "^$f " "${RUNFILES_MANIFEST_FILE:-/dev/null}" | cut -f2- -d' ')" 2>/dev/null ||
  source "$0.runfiles/$f" 2>/dev/null ||
  source "$(grep -sm1 "^$f " "$0.runfiles_manifest" | cut -f2- -d' ')" 2>/dev/null ||
  source "$(grep -sm1 "^$f " "$0.exe.runfiles_manifest" | cut -f2- -d' ')" 2>/dev/null ||
  {
    echo >&2 "ERROR: cannot find $f"
    exit 1
  }
f=
set -e
# --- end runfiles.bash initialization v2 ---

STATUS_FILE=$(rlocation "__TMPL_STATUS")
DIFF_FILE=$(rlocation "__TMPL_DIFF")

# Copy fix diff file if not empty, can later be collected by another script
if [[ -s "$DIFF_FILE" ]]; then
  NAME=$(sha256sum "${DIFF_FILE}" | cut -d' ' -f1)
  cp "${DIFF_FILE}" "${TEST_UNDECLARED_OUTPUTS_DIR}/${NAME}.diff"
fi

if [[ -s "${STATUS_FILE}" ]]; then
  cat "${STATUS_FILE}"

  # Bazel expects exit code 3 meanings tests failed but completed normally
  exit 3
fi
