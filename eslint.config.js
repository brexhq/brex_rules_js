module.exports = {
  extends: [
    "plugin:prettier/recommended",
    "prettier/@typescript-eslint",
  ],
  env: {
    node: true,
    jest: true,
  },
  plugins: ["prettier"],
  rules: {
    "prettier/prettier": ["error", {
      arrowParens: "always",
      bracketSpacing: true,
      endOfLine: "auto",
      jsxBracketSameLine: false,
      jsxSingleQuote: false,
      printWidth: 80,
      proseWrap: "always",
      quoteProps: "as-needed",
      semi: true,
      singleQuote: false,
      tabWidth: 2,
      trailingComma: "all",
      useTabs: false
    }],
    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        args: "after-used",
        argsIgnorePattern: "^_",
        ignoreRestSiblings: true,
      },
    ],
    "no-restricted-syntax": [
      "error",
      {
        selector: "LabeledStatement",
        message: "Labels are a form of GOTO; using them makes code confusing and hard to maintain and understand.",
      },
      {
        selector: "WithStatement",
        message: "`with` is disallowed in strict mode because it makes code impossible to predict and optimize.",
      },
    ],
    "no-unused-vars": ["off"],
    "no-console": ["off"],
    "no-underscore-dangle": ["off"],
    "no-plusplus": ["off"],
    "no-param-reassign": ["off"],
    "no-return-assign": ["error", "except-parens"],
    "no-use-before-define": ["error", "nofunc"],
    "sort-imports": [
      "error",
      {
        ignoreCase: false,
        ignoreDeclarationSort: true,
        ignoreMemberSort: false,
        memberSyntaxSortOrder: ["none", "single", "all", "multiple"],
      },
    ],
    "import/prefer-default-export": ["off"],
    "import/no-named-as-default": ["off"],
    "import/extensions": ["off"],
    "camelcase": ["off"],
  },
};
