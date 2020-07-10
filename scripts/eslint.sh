#!/bin/bash

ARGS=""

function usage() {
  echo "Runs ESLint for Bazel projects"
  echo
  echo "Usage: "
  echo "$0 [-f] [bazel targets] -- [bazel options]"
  echo
  echo -e "  -f\t\t\tAttempt to fix errors"
  echo
}

# Parse CLI options
while getopts "fh" OPTION; do
  case ${OPTION} in
  f)
    # Disable sandbox so we can write back
    ARGS="${ARGS} --test_arg=--fix --spawn_strategy=local"
    ;;
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
  --test_tag_filters eslint_test \
  --test_output=errors \
  $ARGS "$@"
