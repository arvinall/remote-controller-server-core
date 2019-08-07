/* global describe, test, expect */

import Plugin from '../plugin'
import {
  packageNameSuffix,
  isPluginPackage,
  packageNameToPluginName,
  pluginNameToPackageName,
  packageNameToPath,
  pluginNameToPath
} from '../index'
import path from 'path'

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
