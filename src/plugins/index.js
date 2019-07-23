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
 * @return {module:plugins~Plugins}
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

  const _packageNameToPath = packageNameToPath.bind(null, configs.path)
  const _pluginNameToPath = pluginNameToPath.bind(null, configs.path)

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
     *
     * @throws Will throw an error if plugin package's name hasn't "-plugin" suffix
     * @throws Will throw an typeError if plugin package's default exported value doesn't function
     * @throws Will throw an typeError if plugin package's default exported return value doesn't contain a class that implements the {@link module:plugins/plugin} as Plugin key
     */
    #add = (pluginPath) => {
      const pluginPackage = {}

      // Read package.json config file
      pluginPackage.package = global.require(path.join(pluginPath, 'package.json'))

      if (!isPluginPackage(pluginPackage.package.name)) {
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
        !helpers.object.inheritOf.call(result.Plugin, Plugin)) {
        throw new TypeError('Returned value has no any \'' + Plugin.name + '\' key that extends \'' + Plugin.name + '\' class, ' + pluginPackage.package.name)
          .setLogObject(pluginPackage.package)
      }

      pluginPackage.Plugin = result.Plugin

      pluginPackage.name = packageNameToPluginName(pluginPackage.package.name)

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
          isPluginPackage(file.name)) {
          this.#add(_packageNameToPath(file.name))
        }
      }
    }

    /**
     * Download, Read, setup and add plugin to the list
     *
     * @param {string} pluginName
     *
     * @async
     * @return {Promise<(void|Error)>}
     * * Rejection
     *  * Will throw an error if plugin package's name hasn't "-plugin" suffix
     *  * Will throw an typeError if plugin package's default exported value doesn't function
     *  * Will throw an typeError if plugin package's default exported return value doesn't contain a class that implements the {@link module:plugins/plugin} as Plugin key
     */
    add (pluginName) {
      if (typeof pluginName !== 'string') throw new TypeError('pluginName parameter is required and must be string')

      return (async () => {
        return this.#add(_pluginNameToPath(pluginName))
      })()
    }
  }

  // Set string tag
  helpers.decorator.setStringTag()(Plugins)

  return new Plugins()
}

export const packageNameSuffix = '-' + Plugin.name.toLowerCase()

/**
 * @param {string} packageName
 *
 * @return {boolean}
 */
export function isPluginPackage (packageName) {
  return packageName.endsWith(packageNameSuffix)
}

/**
 * @param {string} packageName
 *
 * @return {string}
 */
export function packageNameToPluginName (packageName) {
  return packageName.split(packageNameSuffix)[0]
}

/**
 * @param {string} pluginName
 *
 * @return {string}
 */
export function pluginNameToPackageName (pluginName) {
  return pluginName + '-' + Plugin.name.toLowerCase()
}

/**
 * @param {string} _path
 * @param {string} packageName
 *
 * @return {string}
 */
export function packageNameToPath (_path, packageName) {
  return path.join(_path, packageName)
}

/**
 * @param {string} path
 * @param {string} pluginName
 *
 * @return {string}
 */
export function pluginNameToPath (path, pluginName) {
  return packageNameToPath(path, pluginNameToPackageName(pluginName))
}

export Plugin from './plugin'
