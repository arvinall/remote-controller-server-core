
module.exports = {
  source: {
    include: [
      'src',
      'src/storages',
      'src/preferences',
      'src/engine',
      'src/connections'
    ],
    exclude: [
      'node_modules'
    ],
    includePattern: '.+\\.js(doc|x)?$',
    excludePattern: '(^|\\/|\\\\)_'
  },
  plugins: [
    'node_modules/jsdoc-babel'
  ],
  tags: {
    allowUnknownTags: false,
    dictionaries: ['jsdoc']
  },
  opts: {
    destination: './docs',
    template: 'node_modules/minami'
  }
}
