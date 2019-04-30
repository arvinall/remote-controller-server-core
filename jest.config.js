
const path = require('path')

const mainTestDir = path.resolve(__dirname, 'src', 'test')

module.exports = {
  testEnvironment: 'node',
  globalSetup: path.resolve(mainTestDir, 'setup.js'),
  globalTeardown: path.resolve(mainTestDir, 'teardown.js'),
  setupFiles: [
    path.resolve(mainTestDir, 'globalHelpers.js')
  ]
}
