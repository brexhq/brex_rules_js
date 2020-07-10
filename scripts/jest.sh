#!/bin/bash

function usage() {
  echo "Runs Jest tests for Bazel projects"
  echo
  echo "Usage: "
  echo "$0 [bazel targets] -- [bazel options]"
  echo
}

# Parse CLI options
while getopts "h" OPTION; do
  case ${OPTION} in
  h)
    usage
    exit 0
    ;;
  *)
    usage
    exit 10
    ;;
  esac
done

# Remove parsed args from arglist
shift $((OPTIND - 1))

exec bazel test \
  --build_tests_only \
  --test_tag_filters jest_test \
  --test_output=errors \
  "$@"
