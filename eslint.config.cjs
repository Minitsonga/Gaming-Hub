const tseslint = require("typescript-eslint");

module.exports = [
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      "**/.next/**",
      "**/coverage/**"
    ]
  },

  ...tseslint.configs.recommended,

  {
    files: ["backend/**/*.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off"
    }
  }
];
