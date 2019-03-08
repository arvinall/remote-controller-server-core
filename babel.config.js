
module.exports = {
  presets: [
    [ '@babel/preset-env', { modules: false } ]
  ],
  plugins: [
    [ '@babel/plugin-transform-runtime', {
      corejs: false,
      helpers: true,
      regenerator: true,
      useESModules: false
    } ],
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
