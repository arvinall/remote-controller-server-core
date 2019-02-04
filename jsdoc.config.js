
module.exports = {
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
