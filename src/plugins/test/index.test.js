/* global describe, test, expect, generateId, afterAll, TMP_PATH, global, afterEach, process, jest */

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
  kebabCaseToCamelCase,
  functionToExpressionString
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
const globalPluginProperty = '__PLUGIN__'
const getGlobalPlugin = () => global[globalPluginProperty]

let pluginsPreference

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
    })

    test('Must make path directory recursive', async () => {
      const _path = path.join(
        TMP_PATH,
        'makePlugins.' + generateId(),
        generateId()
      )

      try {
        await core.preferences.remove('plugins')
      } catch (error) {}

      makePlugins.call(core, { path: _path })

      let isPathDirectory = false

      try {
        isPathDirectory = (await promisify(fs.stat)(_path)).isDirectory()
      } catch (error) {}

      expect(isPathDirectory).toBe(true)

      await promisify(rimraf)(path.join(_path, '..'))
      await core.preferences.remove('plugins')
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
    })
  })
})

describe('constructor', () => {
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

    pluginsPreference = core.preferences.get('plugins')
  })
})

describe('Properties', () => {
  describe('path', () => {
    test('Default value must be ' + TMP_PATH, () => {
      expect(core.plugins.path).toBe(TMP_PATH)
    })

    test('Must ignore non string/null value types', () => {
      core.plugins.path = 123

      expect(core.plugins.path).toBe(TMP_PATH)

      core.plugins.path = undefined

      expect(core.plugins.path).toBe(TMP_PATH)

      core.plugins.path = false

      expect(core.plugins.path).toBe(TMP_PATH)
    })

    test('Must write/read string values into/from preference', () => {
      const CWD = process.cwd()

      core.plugins.path = CWD

      expect(pluginsPreference.body.path).toBe(CWD)

      expect(core.plugins.path).toBe(CWD)

      core.plugins.path = TMP_PATH
    })

    test('Must reset to its default value when setted to null', () => {
      core.plugins.path = process.cwd()
      core.plugins.path = null

      expect(pluginsPreference.body.path)
        .toBe(pluginsPreference.defaults.path)

      expect(core.plugins.path)
        .toBe(pluginsPreference.defaults.path)
    })
  })
})

describe('add Method', () => {
  test('Must throw error when pluginName parameter is not string', () => {
    const ERROR = 'pluginName parameter is required and must be string'

    expect(core.plugins.add.bind(core.plugins, 123)).toThrow(ERROR)
    expect(core.plugins.add.bind(core.plugins, [ 'wrong' ])).toThrow(ERROR)
  })

  test('Must reject an error if plugin package\'s name hasn\'t "' + packageNameSuffix + '" suffix', async () => {
    expect.assertions(1)

    const pluginName = generateId().toLowerCase()
    const packageJson = makePackageJsonTemplate({
      name: pluginName
    })
    const packageName = pluginNameToPackageName(pluginName)

    makePluginPackage(packageName, { 'package.json': packageJson })

    const ERROR = 'Plugin package name must ends with \'-' + Plugin.name.toLowerCase() + '\', ' + packageJson.name

    try {
      await core.plugins.add(pluginName)
    } catch (error) {
      expect(error.message).toBe(ERROR)
    }

    temporaryPluginPaths.push(packageName)
  })

  test('Must reject an error if plugin package\'s default exported value doesn\'t function', async () => {
    expect.assertions(1)

    const packageJson = makePackageJsonTemplate()
    const pluginName = packageNameToPluginName(packageJson.name)

    function indexJS () {
      module.exports = 'wrong'
    }

    makePluginPackage(packageJson.name, {
      'package.json': packageJson,
      'index.js': indexJS
    })

    const ERROR = 'Default exported value is not function, ' + packageJson.name

    try {
      await core.plugins.add(pluginName)
    } catch (error) {
      expect(error.message).toBe(ERROR)
    }

    temporaryPluginPaths.push(packageJson.name)
  })

  test('Must reject an error if plugin package\'s default exported return value doesn\'t contain a class that implements the Plugin as Plugin key', async () => {
    expect.assertions(1)

    const packageJson = makePackageJsonTemplate()
    const pluginName = packageNameToPluginName(packageJson.name)
    const indexJS = makeJSTemplate(pluginName)
    const indexJSCache = indexJS.toString()

    indexJS.toString = () => indexJSCache
      .replace("'<CUSTOM>'", 'result[`${pluginName}Plugin`] = class {}') // eslint-disable-line no-template-curly-in-string

    makePluginPackage(packageJson.name, {
      'package.json': packageJson,
      'index.js': indexJS
    })

    const ERROR = 'Returned value has no any \'' + Plugin.name + '\' key that extends \'' + Plugin.name + '\' class, ' + packageJson.name

    try {
      await core.plugins.add(pluginName)
    } catch (error) {
      expect(error.message).toBe(ERROR)
    }

    temporaryPluginPaths.push(packageJson.name)
  })

  describe('Success', () => {
    test('Must resolve PluginPackage', async () => {
      expect.assertions(3)

      const packageJson = makePackageJsonTemplate()
      const pluginName = packageNameToPluginName(packageJson.name)
      const indexJS = makeJSTemplate(pluginName)

      makePluginPackage(packageJson.name, {
        'package.json': packageJson,
        'index.js': indexJS
      })

      const pluginPackage = await core.plugins.add(pluginName)

      expect(pluginPackage).toEqual(expect.objectContaining({
        name: pluginName,
        package: packageJson,
        pluginPreferences: expect.any(PluginPreferences),
        pluginStorages: expect.any(PluginStorages),
        pluginLogger: expect.any(PluginLogger)
      }))

      expect(helpers.object.inheritOf.call(pluginPackage.Plugin, Plugin)).toBe(true)
      expect(new (pluginPackage.Plugin)() + '').toBe(`[object ${kebabCaseToCamelCase(packageJson.name)}]`)

      temporaryPluginPaths.push(packageJson.name)
    })

    test('Must pass "<pluginModules>" modules to plugin\'s setup function'
      .replace('"<pluginModules>"', [ 'PluginStorages', 'PluginPreferences', 'PluginLogger' ]
        .join(', ')), async () => {
      expect.assertions(1)

      const packageJson = makePackageJsonTemplate()
      const pluginName = packageNameToPluginName(packageJson.name)
      const indexJS = makeJSTemplate(pluginName)
      const indexJSCache = indexJS.toString()

      indexJS.toString = () => indexJSCache.replace("'<CUSTOM>'", functionToExpressionString(
        /* eslint-disable */() => {
          // Set static methods on plugin
          Object.assign(result[`${pluginName}Plugin`], {
            testModules (
              {
                PluginStorages,
                PluginPreferences,
                PluginLogger
              }
              ) {
              return ( pluginStorages instanceof PluginStorages &&
                pluginPreferences instanceof PluginPreferences &&
                pluginLogger instanceof PluginLogger )
            }
          })
        }/* eslint-enable */
      ))

      makePluginPackage(packageJson.name, {
        'package.json': packageJson,
        'index.js': indexJS
      })

      const { Plugin: { testModules } } = await core.plugins.add(pluginName)

      expect(testModules({
        PluginStorages,
        PluginPreferences,
        PluginLogger
      })).toBe(true)

      temporaryPluginPaths.push(packageJson.name)
    })
  })

  test('Must throw error when target plugin is already exist', async () => {
    expect.assertions(1)

    const packageJson = makePackageJsonTemplate()
    const pluginName = packageNameToPluginName(packageJson.name)
    const indexJS = makeJSTemplate(pluginName)

    makePluginPackage(packageJson.name, {
      'package.json': packageJson,
      'index.js': indexJS
    })

    await core.plugins.add(pluginName)

    const ERROR = `${pluginName} is already exist`

    try {
      await core.plugins.add(pluginName)
    } catch (error) {
      expect(error.message).toBe(ERROR)
    }

    temporaryPluginPaths.push(packageJson.name)
  })
})

describe('remove Method', () => {
  describe('Errors', () => {
    test('Must throw error when pluginPackage parameter is not PluginPackage/string', () => {
      const ERROR = 'pluginPackage parameter is required and must be PluginPackage/string'

      expect(core.plugins.remove.bind(core.plugins)).toThrow(ERROR)
      expect(core.plugins.remove.bind(core.plugins, 123)).toThrow(ERROR)
    })

    test('Must throw error when removeData parameter is not boolean', () => {
      const ERROR = 'removeData parameter must be boolean'

      expect(core.plugins.remove.bind(core.plugins, 'wrong', 123)).toThrow(ERROR)
      expect(core.plugins.remove.bind(core.plugins, 'wrong', [ 'wrong' ])).toThrow(ERROR)
    })

    test('Must throw error when target plugin is not exist in list', () => {
      const pluginName = 'wrong'
      const ERROR = `${pluginName} is not exist in list`

      expect(core.plugins.remove.bind(core.plugins, pluginName)).toThrow(ERROR)
    })
  })

  describe('Success', () => {
    test.each([ [ 'string' ], [ 'PluginPackage' ] ])(
      'Must remove plugin package directory from disk and list with %s',
      async type => {
        expect.assertions(3)

        const packageJson = makePackageJsonTemplate()
        const pluginName = packageNameToPluginName(packageJson.name)
        const packagePath = packageNameToPath(packageJson.name)

        makePluginPackage(packageJson.name, {
          'package.json': packageJson,
          'index.js': makeJSTemplate(pluginName)
        })

        const pluginPackage = await core.plugins.add(pluginName)

        expect(await promisify(fs.access)(packagePath, fs.constants.F_OK)).toBeUndefined()

        if (type === 'string') await core.plugins.remove(pluginName)
        else await core.plugins.remove(pluginPackage)

        await expect(promisify(fs.access)(packagePath, fs.constants.F_OK)).rejects.toThrow()
        expect(core.plugins.get(pluginName)).toBeUndefined()
      }
    )

    test('Must remove plugin\'s preference and storages when removeData parameter setted to true', async () => {
      const storagesSize = 3

      expect.assertions(2 + storagesSize * 2)

      const packageJson = makePackageJsonTemplate()
      const pluginName = packageNameToPluginName(packageJson.name)
      const indexJS = makeJSTemplate(pluginName)
      const indexJSCache = indexJS.toString()

      indexJS.toString = () => indexJSCache.replace("'<CUSTOM>'", functionToExpressionString(
        /* eslint-disable */() => {
          // Set static method on plugin class
          Object.assign(result[`${pluginName}Plugin`], {
            init (storageNames = []) {
              pluginPreferences.add()

              for (const storageName of storageNames) {
                pluginStorages.add(storageName)
              }
            }
          })
        }/* eslint-enable */
      ))

      makePluginPackage(packageJson.name, {
        'package.json': packageJson,
        'index.js': indexJS
      })

      const {
        Plugin: { init },
        pluginPreferences,
        pluginStorages
      } = await core.plugins.add(pluginName)
      const storageNames = []

      for (let counter = 1; counter <= storagesSize; counter++) {
        storageNames.push(generateId().toLowerCase())
      }

      // Initial preference and storages
      init(storageNames)

      expect(pluginPreferences.get.bind(pluginPreferences)).not.toThrow()
      for (const storageName of storageNames) {
        expect(pluginStorages.get.bind(pluginStorages, storageName)).not.toThrow()
      }

      await core.plugins.remove(pluginName, true)

      expect(pluginPreferences.get.bind(pluginPreferences)).toThrow()
      for (const storageName of storageNames) {
        expect(pluginStorages.get.bind(pluginStorages, storageName)).toThrow()
      }
    })
  })
})

describe('reload Method', () => {
  test('Must throw error when pluginPackage parameter is not PluginPackage/string', () => {
    const ERROR = 'pluginPackage parameter is required and must be PluginPackage/string'

    expect(core.plugins.reload.bind(core.plugins)).toThrow(ERROR)
    expect(core.plugins.reload.bind(core.plugins, 123)).toThrow(ERROR)
  })

  test.each([ [ 'string' ], [ 'PluginPackage' ] ])(
    'Must reload plugin and create new PluginPackage and update previous pluginPackage %s',
    async type => {
      expect.assertions(4)

      const packageJson = makePackageJsonTemplate()
      const pluginName = packageNameToPluginName(packageJson.name)
      const indexJS = makeJSTemplate(pluginName)

      makePluginPackage(packageJson.name, {
        'package.json': packageJson,
        'index.js': indexJS
      })

      const pluginPackage = await core.plugins.add(pluginName)

      // Update plugin package's version
      packageJson.version = '0.0.2'
      makePluginPackage(packageJson.name, {
        'package.json': packageJson,
        'index.js': indexJS
      })

      let newPluginPackage

      // Reset jest module registry
      jest.resetModules()

      if (type === 'string') newPluginPackage = core.plugins.reload(pluginName)
      else newPluginPackage = core.plugins.reload(pluginPackage)

      expect(newPluginPackage).not.toBe(pluginPackage)
      expect(newPluginPackage).toBe(core.plugins.get(pluginName))
      expect(newPluginPackage.package.version).toBe(packageJson.version)
      expect(pluginPackage.package.version).toBe(packageJson.version)

      temporaryPluginPaths.push(packageJson.name)
    }
  )
})

afterAll(async () => {
  await core.storages.remove(preferencesStorageName)

  for (const packageName of temporaryPluginPaths) {
    await promisify(rimraf)(packageNameToPath(packageName))
  }
})
