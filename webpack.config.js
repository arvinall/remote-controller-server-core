
const path = require('path')
const pkg = require('./package')

const NAME = pkg.name.replace('@', '').replace('/', '-')
const MODE = process.env.NODE_ENV
const CONTEXT = path.resolve(__dirname, 'src')
const ENTRY = './main.js'
const OUTPUT_PATH = path.resolve(__dirname, 'build')
const OUTPUT_FILENAME = NAME + (MODE === 'production' ? '.min' : '') + '.js'
const OUTPUT_LIBRARY = NAME
const OUTPUT_LIBRARYTARGET = 'umd'
const OUTPUT_UMDNAMEDDEFINE = true
const STATS_COLORS = true
const EXCLUDE = [/node_modules/]
const MAXASSETSIZE = 2500000
const MAXENTRYPOINTSIZE = 2500000
const MODULE = {
  rules: [
    {
      test: /\.js$/,
      exclude: EXCLUDE,
      use: [
        'babel-loader',
        'eslint-loader'
      ]
    }
  ]
}
const CONFIG = {
  production: {
    context: CONTEXT,
    entry: ENTRY,
    mode: 'production',
    target: 'node',
    output: {
      path: OUTPUT_PATH,
      filename: OUTPUT_FILENAME,
      library: OUTPUT_LIBRARY,
      libraryTarget: OUTPUT_LIBRARYTARGET,
      umdNamedDefine: OUTPUT_UMDNAMEDDEFINE
    },
    performance: {
      hints: 'error',
      maxAssetSize: MAXASSETSIZE,
      maxEntrypointSize: MAXENTRYPOINTSIZE
    },
    stats: {
      colors: STATS_COLORS
    },
    module: MODULE,
    resolve: {
      alias: {
        /*
        uws pkg is deprecated
        this line is a temporary solution
        */
        uws: 'ws'
      }
    }
  }
}

CONFIG.development = Object.create(null)

Object.assign(CONFIG.development, CONFIG.production, {
  mode: 'development',
  devtool: 'eval',
  watch: true,
  watchOptions: {
    ignored: EXCLUDE
  }
})

CONFIG.development.performance.hints = 'warning'
CONFIG.development.output.devtoolModuleFilenameTemplate = info => {
  let context = CONTEXT.split('/')
  context = context[context.length - 1]

  return path.join(context, info.resourcePath)
}

module.exports = CONFIG[MODE] || CONFIG.production
