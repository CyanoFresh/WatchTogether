module.exports = {
  'env': {
    'node': true,
    'es6': true,
  },
  'extends': 'eslint:recommended',
  'parserOptions': {
    'ecmaVersion': 6,
  },
  'rules': {
    'indent': [
      'error',
      2,
    ],
    // "linebreak-style": [
    //     "error",
    //     "windows"
    // ],
    'quotes': [
      'error',
      'single',
    ],
    'semi': [
      'error',
      'always',
    ],
    'no-console': 'off',
  },
};