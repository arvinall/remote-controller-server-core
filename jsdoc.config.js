
module.exports = {
  source: {
    include: [
      'src',
      'src/storages',
      'src/preferences'
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
    destination: './docs'
  }
}
