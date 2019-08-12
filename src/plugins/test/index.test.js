/* global describe, test, expect, generateId, afterAll, TMP_PATH, global, afterEach */

import Plugin from '../plugin'
import makePlugins, {
  packageNameSuffix,
  isPluginPackage,
  packageNameToPluginName,
  pluginNameToPackageName,
  packageNameToPath as _packageNameToPath,
  pluginNameToPath
} from '../index'
import path from 'path'
import Logger from '../../logger'
import makePreferences from '../../preferences'
import makeStorages from '../../storages'
import fs from 'fs'
import { promisify } from 'util'
import rimraf from 'rimraf'
import {
  makePluginPackage as _makePluginPackage,
  makePackageJsonTemplate,
  makeJSTemplate,
  kebabCaseToCamelCase
} from './helpers'
import EventEmitter from 'events'
import * as helpers from '../../helpers'
import PluginStorages from '../pluginStorages'
import PluginPreferences from '../pluginPreferences'
import PluginLogger from '../pluginLogger'

// Reset Object class to ES spec instead jest customized class
Object.defineProperty(global, 'Object', {
  value: Object.getPrototypeOf(Object.getPrototypeOf(EventEmitter.constructor)).constructor
})

// Reset global require function
Object.defineProperty(global, 'require', {
  value: require
})

const makePluginPackage = _makePluginPackage.bind(null, TMP_PATH)
const packageNameToPath = _packageNameToPath.bind(null, TMP_PATH)
const core = Object.create(null)
const preferencesStorageName = generateId()
const temporaryPluginPaths = []

// let pluginsPreference

describe('packageNameSuffix exported property', () => {
  test('Must be string that contains "-' + Plugin.name.toLowerCase() + '"', () => {
    expect(packageNameSuffix).toBe('-' + Plugin.name.toLowerCase())
  })
})

describe('isPluginPackage exported method', () => {
  test('Must return false when packageName parameter doesnt contain ' + `"${packageNameSuffix}"`, () => {
    const PACKAGE_NAME = 'wrong-package-name'

    expect(isPluginPackage(PACKAGE_NAME)).toBe(false)
  })

  test('Must return true when packageName parameter contains ' + `"${packageNameSuffix}"`, () => {
    const PACKAGE_NAME = 'package-name' + packageNameSuffix

    expect(isPluginPackage(PACKAGE_NAME)).toBe(true)
  })
})

describe('packageNameToPluginName exported method', () => {
  test('Must remove ' + `"${packageNameSuffix}" ` + 'from package name', () => {
    const PLUGIN_NAME = 'test'
    const PACKAGE_NAME = PLUGIN_NAME + packageNameSuffix

    expect(packageNameToPluginName(PACKAGE_NAME)).toBe(PLUGIN_NAME)
  })
})

describe('pluginNameToPackageName exported method', () => {
  test('Must append ' + `"${packageNameSuffix}" ` + 'to plugin name', () => {
    const PLUGIN_NAME = 'test'
    const PACKAGE_NAME = PLUGIN_NAME + packageNameSuffix

    expect(pluginNameToPackageName(PLUGIN_NAME)).toBe(PACKAGE_NAME)
  })
})

describe('packageNameToPath exported method', () => {
  test('Must append _path parameter to package name', () => {
    const PATH = '/home/test'
    const PACKAGE_NAME = 'test' + packageNameSuffix

    expect(_packageNameToPath(PATH, PACKAGE_NAME)).toBe(path.join(PATH, PACKAGE_NAME))
  })
})

describe('pluginNameToPath exported method', () => {
  test('Must append _path parameter to plugin name', () => {
    const PATH = '/home/test'
    const PLUGIN_NAME = 'test'
    const PACKAGE_NAME = 'test' + packageNameSuffix

    expect(pluginNameToPath(PATH, PLUGIN_NAME)).toBe(path.join(PATH, PACKAGE_NAME))
  })
})

describe('makePlugins', () => {
  describe('Errors', () => {
    test('Must throw error when configs parameter is not object', () => {
      const ERROR = 'configs parameter must be object'

      expect(() => makePlugins('wrong')).toThrow(ERROR)
    })

    test('Must throw error when configs.path property is not string', () => {
      const ERROR = 'configs.path must be string'

      expect(() => makePlugins({ path: 123 })).toThrow(ERROR)
    })

    afterAll(() => {
      core.logger = new Logger(TMP_PATH)
      core.storages = makeStorages.call(core, { path: TMP_PATH })
      core.preferences = makePreferences.call(core, { name: preferencesStorageName })
    })
  })

  describe('Success', () => {
    test('Must initialize preference with default values', () => {
      makePlugins.call(core, { path: TMP_PATH })

      const preference = core.preferences.get('plugins')

      expect(preference.body).toEqual(expect.objectContaining({
        path: TMP_PATH
      }))

      core.preferences.removeSync(preference)
    })

    test('Must make path directory recursive', async () => {
      const _path = path.join(
        TMP_PATH,
        'makePlugins.' + generateId(),
        generateId()
      )

      makePlugins.call(core, { path: _path })

      let isPathDirectory = false

      try {
        isPathDirectory = (await promisify(fs.stat)(_path)).isDirectory()
      } catch (error) {}

      expect(isPathDirectory).toBe(true)

      await promisify(rimraf)(path.join(_path, '..'))

      core.preferences.removeSync('plugins')
    })

    test('Must return connections module without error', () => {
      const plugins = makePlugins.call(core, { path: TMP_PATH })

      expect(plugins).toEqual(expect.objectContaining({
        add: expect.any(Function),
        get: expect.any(Function),
        remove: expect.any(Function),
        reload: expect.any(Function),
        has: expect.any(Function),
        path: TMP_PATH
      }))
      expect(plugins + '').toBe('[object Plugins]')

      core.preferences.removeSync('plugins')
    })
  })
})

describe('constructor', () => {
  const globalPluginProperty = '__PLUGIN__'
  const getGlobalPlugin = () => global[globalPluginProperty]

  test('Must add pre-installed plugins without error', () => {
    for (let counter = 1; counter <= 3; counter++) {
      const packageJson = makePackageJsonTemplate()
      const pluginName = packageNameToPluginName(packageJson.name)
      const indexJS = makeJSTemplate(pluginName)
      const indexJSCache = indexJS.toString()

      // Set Plugin class to global object
      indexJS.toString = () => indexJSCache
        .replace("'<CUSTOM>'", 'global[\'' + globalPluginProperty + '\'] = result[`${pluginName}Plugin`]') // eslint-disable-line no-template-curly-in-string

      makePluginPackage(packageJson.name, {
        'package.json': packageJson,
        'index.js': indexJS
      })

      makePlugins.call(core, { path: TMP_PATH })

      const _Plugin = getGlobalPlugin()

      expect(_Plugin.name).toBe(kebabCaseToCamelCase(packageJson.name))
      expect(helpers.object.inheritOf.call(_Plugin, Plugin)).toBe(true)

      temporaryPluginPaths.push(packageJson.name)
    }
  })
})

describe('get Method', () => {
  test('Must throw error when pluginName parameter is not string', () => {
    const ERROR = 'pluginName parameter must be string'
    const plugins = makePlugins.call(core, { path: TMP_PATH })

    expect(plugins.get.bind(plugins, 123)).toThrow(ERROR)
    expect(plugins.get.bind(plugins, [ 'wrong' ])).toThrow(ERROR)
  })

  describe('Success', () => {
    afterEach(async () => {
      for (const packageName of temporaryPluginPaths) {
        await promisify(rimraf)(packageNameToPath(packageName))
      }
    })

    test('Must return undefined when pluginName is not exist', async () => {
      expect.assertions(1)

      const plugins = makePlugins.call(core, { path: TMP_PATH })

      expect(plugins.get('wrong')).toBeUndefined()
    })

    test('Must return pluginPackage by pluginName', async () => {
      expect.assertions(1)

      const globalPluginProperty = '__PLUGIN__'
      const getGlobalPlugin = () => global[globalPluginProperty]
      const packageJson = makePackageJsonTemplate()
      const pluginName = packageNameToPluginName(packageJson.name)
      const indexJS = makeJSTemplate(pluginName)
      const indexJSCache = indexJS.toString()

      // Set Plugin class to global object
      indexJS.toString = () => indexJSCache
        .replace("'<CUSTOM>'", 'global[\'' + globalPluginProperty + '\'] = result[`${pluginName}Plugin`]') // eslint-disable-line no-template-curly-in-string

      makePluginPackage(packageJson.name, {
        'package.json': packageJson,
        'index.js': indexJS
      })

      const plugins = makePlugins.call(core, { path: TMP_PATH })
      const _Plugin = getGlobalPlugin()

      expect(plugins.get(pluginName)).toEqual({
        Plugin: _Plugin,
        name: pluginName,
        package: packageJson,
        pluginPreferences: expect.any(PluginPreferences),
        pluginStorages: expect.any(PluginStorages),
        pluginLogger: expect.any(PluginLogger)
      })

      temporaryPluginPaths.push(packageJson.name)
    })

    test('Must return an iterable object without any key and length prototype property', () => {
      const plugins = makePlugins.call(core, { path: TMP_PATH })
      const pluginsList = plugins.get()

      expect(Object.keys(pluginsList).length).toBe(0)
      expect(pluginsList.length).toBe(0)
      expect(pluginsList[Symbol.iterator]).toBe(helpers.object.iterateOverValues)
    })

    test('Must return plugins', async () => {
      const PLUGINS_LENGTH = 3

      expect.assertions(PLUGINS_LENGTH + 2)

      const globalPluginProperty = '__PLUGIN__'
      const getGlobalPlugin = () => global[globalPluginProperty]

      global[globalPluginProperty] = {}

      for (let counter = 0; counter < PLUGINS_LENGTH; counter++) {
        const packageJson = makePackageJsonTemplate()
        const pluginName = packageNameToPluginName(packageJson.name)
        const indexJS = makeJSTemplate(pluginName)
        const indexJSCache = indexJS.toString()

        getGlobalPlugin()[pluginName] = {
          Plugin: undefined,
          name: pluginName,
          package: packageJson
        }

        // Set Plugin class to global object
        indexJS.toString = () => indexJSCache
          .replace("'<CUSTOM>'", 'global[\'' +
            globalPluginProperty +
            '\'][\'' + pluginName + '\'].Plugin = result[`${pluginName}Plugin`]') // eslint-disable-line no-template-curly-in-string

        makePluginPackage(packageJson.name, {
          'package.json': packageJson,
          'index.js': indexJS
        })

        temporaryPluginPaths.push(packageJson.name)
      }

      const plugins = makePlugins.call(core, { path: TMP_PATH })
      const pluginsList = plugins.get()

      expect(pluginsList.length).toBe(PLUGINS_LENGTH)
      expect(Object.keys(pluginsList).length).toBe(PLUGINS_LENGTH)

      for (const pluginPackage of pluginsList) {
        expect(pluginPackage).toEqual(expect.objectContaining(getGlobalPlugin()[pluginPackage.name]))
      }
    })
  })

  afterAll(() => {
    core.plugins = makePlugins.call(core, { path: TMP_PATH })

    // pluginsPreference = core.preferences.get('plugins')
  })
})

afterAll(async () => {
  await core.storages.remove(preferencesStorageName)

  for (const packageName of temporaryPluginPaths) {
    await promisify(rimraf)(packageNameToPath(packageName))
  }
})
