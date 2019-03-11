
module.exports = {
  presets: [
    [ '@babel/preset-env', { modules: false } ]
  ],
  plugins: [
    '@babel/plugin-syntax-dynamic-import',
    '@babel/plugin-proposal-class-properties',
    '@babel/plugin-proposal-private-methods',
    '@babel/plugin-proposal-export-default-from'
  ],
  env: {
    test: {
      presets: [
        // Enable ES module system for jest
        [ '@babel/preset-env', { modules: 'auto' } ]
      ]
    }
  }
}
