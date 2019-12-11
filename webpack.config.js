
const path = require('path')
const webpack = require('webpack')

const isDevelopment = process.env.NODE_ENV === 'development'
const EXCLUDE = [ /node_modules/ ]
const CONFIG = {
  context: path.resolve(__dirname, 'src'),
  entry: './main.js',
  mode: 'development',
  target: 'node',
  devtool: 'eval',
  watch: isDevelopment,
  watchOptions: { ignored: EXCLUDE },
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: 'index.js',
    libraryTarget: 'umd'
  },
  stats: { colors: true },
  performance: {
    hints: isDevelopment ? 'warning' : 'error',
    maxAssetSize: 2500000,
    maxEntrypointSize: 2500000
  },
  module: {
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
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(isDevelopment ? 'development' : 'production')
    })
  ]
}

// Clear source maps links
CONFIG.output.devtoolModuleFilenameTemplate = info => (
  path.join(CONFIG.context.split('/').slice(-1)[0], info.resourcePath)
)

module.exports = CONFIG
