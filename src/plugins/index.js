/* global global, process */

/**
 * @module plugins
 */

import EventEmitter from 'events'
import * as helpers from '../helpers'
import { makeClassLoggable } from '../logger'
import path from 'path'
import fs from 'fs'
import Plugin from './plugin'

/**
 * makePlugins creates plugins module
 *
 * @return {module:plugins}
 */
export default function makePlugins (configs = Object.create(null)) {
  // Error classes
  const logObject = {
    scope: 'makePlugins',
    event: undefined,
    module: undefined
  }
  const Error = makeClassLoggable(global.Error, logObject)
  const TypeError = makeClassLoggable(global.TypeError, logObject)

  if (typeof configs !== 'object') throw new TypeError('configs parameter must be object')

  // Set default configs
  configs = Object.assign({
    path: path.join(process.cwd(), 'plugins')
  }, configs)

  if (typeof configs.path !== 'string') throw new TypeError('configs.path must be string')

  try {
    fs.mkdirSync(configs.path, { recursive: true })
  } catch (error) {
    if (error.code !== 'EEXIST') throw error
  }

  logObject.module = 'plugins'

  Error.setLogObject(logObject)
  TypeError.setLogObject(logObject)

  /**
   * Plugins module download, install and load plugins
   *
   * @memberOf module:plugins
   * @inner
   *
   * @mixes module:remote-controller-server-core~external:EventEmitter
   */
  class Plugins extends EventEmitter {
    /**
     * A list that hold plugins
     *
     * @type {Object}
     */
    #pluginsList = {}

    /**
     * Read, setup and add plugin to the list
     *
     * @param {string} pluginPath
     */
    #add = (pluginPath) => {
      const pluginPackage = {}

      // Read package.json config file
      pluginPackage.package = global.require(path.join(pluginPath, 'package.json'))

      if (!pluginPackage.package.name.endsWith('-' + Plugin.name.toLowerCase())) {
        throw new Error('Plugin package name must ends with \'-' + Plugin.name.toLowerCase() + '\', ' + pluginPackage.package.name)
          .setLogObject(pluginPackage.package)
      }

      // Load module
      let setup = global.require(pluginPath)

      if (setup.__esModule) setup = setup.default

      if (typeof setup !== 'function') {
        throw new TypeError('Default exported value is not function, ' + pluginPackage.package.name)
          .setLogObject(pluginPackage.package)
      }

      // Setup
      const result = setup({ Plugin })

      if (!result ||
        !result.Plugin ||
        Object.getPrototypeOf(result.Plugin) !== Plugin) {
        throw new TypeError('Returned value has no any \'' + Plugin.name + '\' key that extends \'' + Plugin.name + '\' class, ' + pluginPackage.package.name)
          .setLogObject(pluginPackage.package)
      }

      pluginPackage.Plugin = result.Plugin

      pluginPackage.name = result.Plugin.name.split(Plugin.name)[0].toLowerCase()

      this.#pluginsList[pluginPackage.name] = pluginPackage
    }

    /**
     * Load installed plugins
     */
    constructor () {
      super()

      // Load installed plugins
      for (const file of fs.readdirSync(configs.path, { withFileTypes: true })) {
        if (file.isDirectory() &&
          file.name.endsWith('-' + Plugin.name.toLowerCase())) {
          this.#add(path.join(configs.path, file.name))
        }
      }
    }
  }

  // Set string tag
  helpers.decorator.setStringTag()

  return new Plugins()
}

export Plugin from './plugin'
