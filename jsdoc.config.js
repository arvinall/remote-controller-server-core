
module.exports = {
  source: {
    include: [
      'src',
      'src/storages',
      'src/preferences',
      'src/passport',
      'src/engine',
      'src/connections',
      'src/plugins'
    ],
    exclude: [
      'node_modules'
    ],
    includePattern: '.+\\.js(doc|x)?$',
    excludePattern: '(^|\\/|\\\\)_'
  },
  plugins: [
    'node_modules/jsdoc-babel',
    'plugins/markdown'
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
