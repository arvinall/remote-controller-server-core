/* global global, process, console */

/**
 * @module plugins
 */

/**
 * An object that hold plugin package data
 *
 * @typedef {object} module:plugins.PluginPackage
 *
 * @property {module:plugins/plugin} Plugin Exported Plugin class
 * @property {string} name
 * @property {object} package Same as package.json config file
 * @property {module:plugins/pluginPreferences} pluginPreferences
 * @property {module:plugins/pluginStorages} pluginStorages
 * @property {module:plugins/pluginLogger} pluginLogger
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
import PluginStorages from './pluginStorages'
import PluginLogger from './pluginLogger'

/**
 * makePlugins creates plugins module
 *
 * @param {object} [configs={}]
 * @param {string} [configs.path="path.join(process.cwd(), 'plugins')"] Default plugins directory address
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

  const preferences = this.preferences
  const preference = (defaults => {
    const NAME = 'plugins'
    let preference

    try {
      preference = preferences.add(NAME, defaults)
    } catch (error) {
      if (error.message === `${NAME} is already exist`) {
        try {
          preference = preferences.get(NAME)
        } catch (error) {
          throw error
        }
      } else throw error
    }

    try {
      Object.defineProperty(preference, 'defaults', { value: defaults })
    } catch (error) {}

    return preference
  })(Object.freeze({
    path: configs.path
  }))

  configs.path = preference.body.path

  try {
    fs.mkdirSync(configs.path, { recursive: true })
  } catch (error) {
    if (error.code !== 'EEXIST') throw error
  }

  const _packageNameToPath = (...parameters) => packageNameToPath(configs.path, ...parameters)
  const _pluginNameToPath = (...parameters) => pluginNameToPath(configs.path, ...parameters)
  const storages = this.storages
  const logger = this.logger

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
     * A list that holds plugins
     *
     * @type {Object<string, module:plugins.PluginPackage>}
     */
    #pluginsList = {}
    /**
     * A list that holds reloaded plugins
     *
     * @type {Object<string, module:plugins.PluginPackage>}
     */
    #reloadedPluginPackagesCahce = {}

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

      const pluginPackage = Object.create({
        get [logSymbol] () {
          const self = this

          return {
            pluginPackage: {
              name: self.name,
              plugin: self.Plugin.name,
              package: {
                name: self.package.name,
                version: self.package.version,
                description: self.package.description,
                main: self.package.main
              }
            }
          }
        }
      })

      // Read package.json config file
      pluginPackage.package = global.require(path.join(pluginPath, 'package.json'))

      const Error = makeClassLoggable(global.Error, logObject)
        .assignLogObject({
          method: '#add',
          ...this[logSymbol],
          package: pluginPackage.package
        })

      if (!isPluginPackage(pluginPackage.package.name)) {
        throw new Error('Plugin package name must ends with \'-' + Plugin.name.toLowerCase() + '\', ' + pluginPackage.package.name)
      }

      pluginPackage.name = packageNameToPluginName(pluginPackage.package.name)

      // Load module
      let setup = global.require(pluginPath)

      if (setup.__esModule) setup = setup.default

      if (typeof setup !== 'function') {
        throw new TypeError('Default exported value is not function, ' + pluginPackage.package.name)
          .setLogObject(pluginPackage.package)
      }

      // Setup
      pluginPackage.pluginPreferences = new PluginPreferences({
        name: pluginPackage.package.name,
        preferences
      })
      pluginPackage.pluginStorages = new PluginStorages({
        name: pluginPackage.package.name,
        storages
      })
      pluginPackage.pluginLogger = new PluginLogger({
        name: pluginPackage.name,
        logger
      })

      const result = setup({
        Plugin,
        pluginPreferences: pluginPackage.pluginPreferences,
        pluginStorages: pluginPackage.pluginStorages,
        pluginLogger: pluginPackage.pluginLogger
      })

      if (!result ||
        !result.Plugin ||
        !helpers.object.inheritOf.call(result.Plugin, Plugin)) {
        throw new TypeError('Returned value has no any \'' + Plugin.name + '\' key that extends \'' + Plugin.name + '\' class, ' + pluginPackage.package.name)
          .setLogObject(pluginPackage.package)
      }

      // Set string tag
      helpers.decorator.setStringTag()(result.Plugin)

      pluginPackage.Plugin = result.Plugin

      // Add to list
      this.#pluginsList[pluginPackage.name] = pluginPackage

      return pluginPackage
    }

    /**
     * Remove plugin from list and ram
     *
     * @param {string} pluginPath
     * @param {boolean} removeData Remove it's preference all storages
     */
    #remove = (pluginPath, removeData = false) => {
      if (typeof pluginPath !== 'string') throw new TypeError('pluginPath parameter is required and must be string')
      else if (typeof removeData !== 'boolean') throw new TypeError('removeData parameter must be boolean')

      let pluginName = pluginPath.split('/')

      pluginName = packageNameToPluginName(pluginName[pluginName.length - 1])

      const packageName = pluginNameToPackageName(pluginName)
      const pluginPackage = this.#pluginsList[pluginName]

      // Remove module from ram
      delete global.require.cache[global.require.resolve(pluginPath)]
      // Remove package from ram
      delete global.require.cache[global.require.resolve(path.join(pluginPath, 'package.json'))]
      // Remove pluginPackage from list
      delete this.#pluginsList[pluginName]

      if (removeData) {
        try {
          pluginPackage.pluginPreferences.removeSync()
        } catch (error) {}

        for (const file of fs.readdirSync(pluginPackage.pluginStorages.path)) {
          if (!file.startsWith(packageName + '.') || !file.endsWith('.json')) continue

          const storageName = file
            .split(packageName + '.')[1]
            .split('.json')[0]

          try {
            pluginPackage.pluginStorages.removeSync(storageName)
          } catch (error) {}
        }
      }
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
          try {
            this.#add(_packageNameToPath(file.name))
          } catch (error) {
            logger.error(logObject, {
              pluginName: packageNameToPluginName(file.name),
              path: this.path
            }, error)

            console.error(error)
          }
        }
      }
    }

    /**
     * Download, Read, setup and add plugin to the list
     *
     * @param {string} pluginName
     *
     * @emits module:plugins~Plugins#event:added
     *
     * @throws Will throw an error if target plugin is already exist
     *
     * @async
     * @return {Promise<(module:plugins.PluginPackage|Error)>}
     * * Rejection
     *  * Will reject an error if plugin package's name hasn't "-plugin" suffix
     *  * Will reject an typeError if plugin package's default exported value doesn't function
     *  * Will reject an typeError if plugin package's default exported return value doesn't contain a class that implements the {@link module:plugins/plugin} as Plugin key
     */
    add (pluginName) {
      const Error = makeClassLoggable(global.Error, logObject)
        .assignLogObject({ method: 'add' })

      if (typeof pluginName !== 'string') throw new TypeError('pluginName parameter is required and must be string')
      else if (this.get(pluginName)) throw new Error(`${pluginName} is already exist`)

      return (async () => {
        const pluginPackage = this.#add(_pluginNameToPath(pluginName))

        /**
         * New plugin added event
         *
         * @event module:plugins~Plugins#event:added
         *
         * @type {module:plugins.PluginPackage}
         */
        this.emit('added', pluginPackage)

        return pluginPackage
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
     * @param {boolean} removeData Remove it's preference all storages
     *
     * @emits module:plugins~Plugins#event:removed
     *
     * @throws Will throw an error if target plugin is not exist in list
     *
     * @async
     * @return {Promise<(void|Error)>}
     */
    remove (pluginPackage, removeData = false) {
      const Error = makeClassLoggable(global.Error, logObject)
        .assignLogObject({ method: 'remove' })

      if (!pluginPackage ||
        (typeof pluginPackage !== 'string' &&
          typeof pluginPackage.name !== 'string')) throw new TypeError('pluginPackage parameter is required and must be PluginPackage/string')
      else if (typeof removeData !== 'boolean') throw new TypeError('removeData parameter must be boolean')

      const pluginName = pluginPackage.name || pluginPackage

      pluginPackage = this.get(pluginName)

      if (!pluginPackage) throw new Error(`${pluginName} is not exist in list`)

      const pluginPath = _pluginNameToPath(pluginName)

      return (async () => {
        // Remove cache from disk
        await promisify(rimraf)(pluginPath)

        // Remove cache from ram
        this.#remove(pluginPath, removeData)

        /**
         * New plugin removed event
         *
         * @event module:plugins~Plugins#event:removed
         *
         * @type {module:plugins.PluginPackage}
         */
        this.emit('removed', pluginPackage)
      })()
    }

    /**
     * Reload (read, setup, cache) plugin
     *
     * @param {(module:plugins.PluginPackage|string)} pluginPackage
     *
     * @emits module:plugins~Plugins#event:reloaded
     *
     * @return {module:plugins.PluginPackage}
     */
    reload (pluginPackage) {
      if (!pluginPackage ||
        (typeof pluginPackage !== 'string' &&
          typeof pluginPackage.name !== 'string')) throw new TypeError('pluginPackage parameter is required and must be PluginPackage/string')

      const pluginName = pluginPackage.name || pluginPackage
      const pluginPath = _pluginNameToPath(pluginName)

      this.#reloadedPluginPackagesCahce[pluginName] =
        pluginPackage = this.#reloadedPluginPackagesCahce[pluginName] || this.get(pluginName)

      // Remove cache from ram
      this.#remove(pluginPath)

      // Read and setup plugin again
      const newPluginPackage = this.#add(pluginPath)
      // Copy previous pluginPackage objects
      const oldPluginPackage = Object
        .assign(Object.create(Object.getPrototypeOf(pluginPackage)), pluginPackage)

      // Update previous cached pluginPackage objects
      Object.assign(pluginPackage, newPluginPackage)

      /**
       * @summary Plugin reloaded event
       * @description Old PluginPackage pass as first parameter, and new PluginPackage pass as second parameter
       *
       * @event module:plugins~Plugins#event:reloaded
       *
       * @type {module:plugins.PluginPackage}
       */
      this.emit('reloaded', oldPluginPackage, newPluginPackage)

      return newPluginPackage
    }

    /**
     * Check Plugin is already exist
     *
     * @param {string} pluginName Plugin's name to check
     *
     * @return {boolean}
     */
    has (pluginName) {
      return this.#pluginsList.hasOwnProperty(pluginName)
    }

    /**
     * @summary Plugins directory path
     * @description To reset to default value set it to `null` <br>
     * Default: path property in configs parameter of {@link module:plugins|makePlugins}
     *
     * @type {string}
     */
    get path () {
      return configs.path
    }

    set path (value) {
      if (typeof value === 'string' ||
        value === null) {
        preference.updateSync(body => {
          if (value !== null) {
            body.path = value
          } else body.path = preference.defaults.path

          return body
        })

        try {
          fs.mkdirSync(preference.body.path, { recursive: true })
        } catch (error) {
          if (error.code !== 'EEXIST') throw error
        }

        configs.path = preference.body.path
      }
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

  const plugins = new Plugins()

    // Logging
  ;(() => {
    plugins.on('added', pluginPackage => logger
      .info('makePlugins', {
        module: 'plugins',
        event: 'added'
      }, pluginPackage))

    plugins.on('removed', pluginPackage => logger
      .info('makePlugins', {
        module: 'plugins',
        event: 'removed'
      }, pluginPackage))

    plugins.on('reloaded', (oldPluginPackage, newPluginPackage) => logger
      .info('makePlugins', {
        module: 'plugins',
        event: 'reloaded'
      }, {
        oldPluginPackage: oldPluginPackage[logSymbol].pluginPackage,
        newPluginPackage: newPluginPackage[logSymbol].pluginPackage
      }))
  })()

  return plugins
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
  return pluginName + packageNameSuffix
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
export * as pluginStorages from './pluginStorages'
export PluginLogger from './pluginLogger'
