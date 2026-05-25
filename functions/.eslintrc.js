module.exports = {
  env: {
    es6: true,
    node: true,
  },
  parserOptions: {
    "ecmaVersion": 2020,
  },
  extends: [
    "eslint:recommended",
    "google",
  ],
  rules: {
    "no-restricted-globals": ["error", "name", "length"],
    "prefer-arrow-callback": "error",
    "object-curly-spacing": "off",
    "no-trailing-spaces": "off",
    "max-len": ["off"],
    "quotes": ["off"],
    "indent": ["off"],
    "require-jsdoc": "off",
    "jsdoc/require-jsdoc": "off",
    "camelcase": "off",
  },
  overrides: [
    {
      files: ["**/*.spec.*"],
      env: {
        mocha: true,
      },
      rules: {},
    },
  ],
  globals: {},
};
