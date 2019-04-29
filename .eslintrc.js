
module.exports = {
  extends: 'eslint-config-standard',
  parser: 'babel-eslint',
  plugins: [
    'eslint-plugin-babel'
  ],
  env: {
    node: true
  },
  rules: {
    'generator-star-spacing': 'off',
    'yield-star-spacing': 'off'
  },
  overrides: [
    {
      files: ['**/*.test.js'],
      env: {
        jest: true
      }
    }
  ]
}
