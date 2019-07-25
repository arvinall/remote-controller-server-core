/* global global, process */

/**
 * @module plugins
 */

/**
 * An object that hold plugin package data
 *
 * @typedef {object} module:plugins.PluginPackage
 * @property {module:plugins/plugin} Plugin Exported Plugin class
 * @property {string} name
 * @property {object} package Same as package.json config file
 * @property {module:plugins/pluginPreferences} pluginPreferences
 */

import EventEmitter from 'events'
import * as helpers from '../helpers'
import {
  makeClassLoggable,
  logSymbol
} from '../logger'
import path from 'path'
import fs from 'fs'
import Plugin from './plugin'
import { promisify } from 'util'
import rimraf from 'rimraf'
import PluginPreferences from './pluginPreferences'

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
  const preferences = this.preferences

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
     *
     * @return module:plugins.PluginPackage
     */
    #add = pluginPath => {
      if (typeof pluginPath !== 'string') throw new TypeError('pluginPath parameter is required and must be string')

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

      pluginPackage.pluginPreferences = new PluginPreferences({
        name: pluginPackage.package.name,
        preferences
      })

      // Setup
      const result = setup({
        Plugin,
        pluginPreferences: pluginPackage.pluginPreferences
      })

      if (!result ||
        !result.Plugin ||
        !helpers.object.inheritOf.call(result.Plugin, Plugin)) {
        throw new TypeError('Returned value has no any \'' + Plugin.name + '\' key that extends \'' + Plugin.name + '\' class, ' + pluginPackage.package.name)
          .setLogObject(pluginPackage.package)
      }

      pluginPackage.Plugin = result.Plugin

      pluginPackage.name = packageNameToPluginName(pluginPackage.package.name)

      this.#pluginsList[pluginPackage.name] = pluginPackage

      return pluginPackage
    }

    /**
     * Remove plugin from list and ram
     *
     * @param {string} pluginPath
     */
    #remove = pluginPath => {
      if (typeof pluginPath !== 'string') throw new TypeError('pluginPath parameter is required and must be string')

      let pluginName = pluginPath.split('/')

      pluginName = packageNameToPluginName(pluginName[pluginName.length - 1])

      // Remove module from ram
      delete global.require.cache[global.require.resolve(pluginPath)]
      // Remove package from ram
      delete global.require.cache[global.require.resolve(path.join(pluginPath, 'package.json'))]
      // Remove pluginPackage from list
      delete this.#pluginsList[pluginName]
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
     * @return {Promise<(module:plugins.PluginPackage|Error)>}
     * * Rejection
     *  * Will throw an error if plugin package's name hasn't "-plugin" suffix
     *  * Will throw an typeError if plugin package's default exported value doesn't function
     *  * Will throw an typeError if plugin package's default exported return value doesn't contain a class that implements the {@link module:plugins/plugin} as Plugin key
     */
    add (pluginName) {
      const Error = makeClassLoggable(global.Error, logObject)
        .assignLogObject({ method: 'add' })

      if (typeof pluginName !== 'string') throw new TypeError('pluginName parameter is required and must be string')
      else if (this.get(pluginName)) throw new Error(`${pluginName} is already exist`)

      return (async () => {
        return this.#add(_pluginNameToPath(pluginName))
      })()
    }

    /**
     * @summary Get specific plugin package or all plugins list
     * @description
     * When call this method without pluginName parameter, returned object is iterable (over values) <br>
     * `Object.values({@link module:plugins~Plugins#get|plugins.get()})[Symbol.iterator]`
     * is same as
     * `{@link module:plugins~Plugins#get|plugins.get()}[Symbol.iterator]`
     *
     * @param  {string} [pluginName]
     *
     * @return {(module:plugins.PluginPackage|object<string, module:plugins.PluginPackage>)}
     */
    get (pluginName) {
      if (pluginName !== undefined &&
        typeof pluginName !== 'string') throw new TypeError('pluginName parameter must be string')

      if (pluginName) return this.#pluginsList[pluginName]

      const pluginsListPrototype = {
        length: 0,
        [Symbol.iterator]: helpers.object.iterateOverValues
      }
      const pluginsList = Object.create(pluginsListPrototype)

      for (const [ key, value ] of Object.entries(this.#pluginsList)) {
        pluginsList[key] = value

        pluginsListPrototype.length++
      }

      return pluginsList
    }

    /**
     * Remove plugin from list and ram and remove plugin package from disk and user account
     *
     * @param {(module:plugins.PluginPackage|string)} pluginPackage
     *
     * @async
     * @return {Promise<(void|Error)>}
     */
    remove (pluginPackage) {
      const Error = makeClassLoggable(global.Error, logObject)
        .assignLogObject({ method: 'remove' })

      if (!pluginPackage ||
        (typeof pluginPackage !== 'string' &&
          typeof pluginPackage.name !== 'string')) throw new TypeError('pluginPackage parameter is required and must be PluginPackage/string')

      const pluginName = pluginPackage.name || pluginPackage

      if (!this.get(pluginName)) throw new Error(`${pluginName} is not exist in list`)

      const pluginPath = _pluginNameToPath(pluginName)

      return (async () => {
        // Remove cache from disk
        await promisify(rimraf)(pluginPath)

        // Remove cache from ram
        this.#remove(pluginPath)
      })()
    }

    /**
     * Reload (read, setup, cache) plugin
     *
     * @param {(module:plugins.PluginPackage|string)} pluginPackage
     *
     * @return {module:plugins.PluginPackage}
     */
    reload (pluginPackage) {
      if (!pluginPackage ||
        (typeof pluginPackage !== 'string' &&
          typeof pluginPackage.name !== 'string')) throw new TypeError('pluginPackage parameter is required and must be PluginPackage/string')

      const pluginName = pluginPackage.name || pluginPackage
      const pluginPath = _pluginNameToPath(pluginName)

      // Remove cache from ram
      this.#remove(pluginPath)

      // Read and setup plugin again
      return this.#add(pluginPath)
    }

    /**
     * Return plugins's path
     *
     * @return {string}
     */
    get path () {
      return configs.path
    }

    get [logSymbol] () {
      return {
        plugins: {
          path: configs.path
        }
      }
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
export PluginPreferences from './pluginPreferences'
