
module.exports = {
  extends: 'eslint-config-standard',
  parser: 'babel-eslint',
  plugins: [
    'eslint-plugin-babel'
  ],
  env: {
    node: true
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
