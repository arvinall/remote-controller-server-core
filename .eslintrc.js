
module.exports = {
  extends: 'eslint-config-standard',
  parser: 'babel-eslint',
  plugins: [
    'eslint-plugin-babel'
  ],
  rules: {
    // Needed for some Engine.io dynamic module loading
    'import/no-duplicates': 'off'
  },
  env: {
    node: true
  },
  overrides: [
    {
      files: ['*.test.js'],
      env: {
        jest: true
      }
    }
  ]
}
