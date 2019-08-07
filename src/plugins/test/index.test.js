/* global describe, test, expect, generateId, afterAll, TMP_PATH */

import Plugin from '../plugin'
import makePlugins, {
  packageNameSuffix,
  isPluginPackage,
  packageNameToPluginName,
  pluginNameToPackageName,
  packageNameToPath,
  pluginNameToPath
} from '../index'
import path from 'path'
import Logger from '../../logger'
import makePreferences from '../../preferences'
import makeStorages from '../../storages'
import fs from 'fs'
import { promisify } from 'util'
import rimraf from 'rimraf'

const core = Object.create(null)
const preferencesStorageName = generateId()

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

    expect(packageNameToPath(PATH, PACKAGE_NAME)).toBe(path.join(PATH, PACKAGE_NAME))
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

afterAll(async () => core.storages.remove(preferencesStorageName))
