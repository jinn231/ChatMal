/** @type {import('eslint').Linter.Config} */
module.exports = {
  parserOptions: {
    project: "./tsconfig.json"
  },
  extends: [
    "@remix-run/eslint-config",
    "@remix-run/eslint-config/node",
    "plugin:deprecation/recommended"
  ],
  rules: {
    "@typescript-eslint/explicit-function-return-type": [
      "warn",
      { allowExpressions: true }
    ],
    "@typescript-eslint/no-unnecessary-type-assertion": "warn",
    "import/consistent-type-specifier-style": ["warn", "prefer-inline"],
    "import/no-duplicates": ["warn", { "prefer-inline": true }],
    "import/order": [
      "warn",
      {
        groups: [
          ["builtin", "external", "internal"],
          "parent",
          "sibling",
          "index"
        ],
        alphabetize: { order: "asc", orderImportKind: "asc" }
      }
    ],
    "deprecation/deprecation": "warn"
  }
};
