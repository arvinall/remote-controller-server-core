/* global generateId */

import {
  packageNameToPath,
  pluginNameToPackageName
} from '../index'
import fs from 'fs'
import path from 'path'

/**
 * @summary Make directory with files
 * @description All values serialize to string and functions wrapped by IIFE
 *
 * @param {string} _path Directory path
 * @param {string} packageName Directory name
 * @param {object<string, *>} files File names and contents
 *
 * @return {object<string, string>}
 */
export function makePluginPackage (_path, packageName, files = Object.create(null)) {
  _path = packageNameToPath(_path, packageName)

  let hasAnyFile = false

  // Serialize
  for (const key in files) {
    if (!Object.prototype.hasOwnProperty.call(files, key)) continue

    if (!hasAnyFile) hasAnyFile = true

    const property = files[key]

    if (typeof property === 'object' && property !== null) {
      files[key] = JSON.stringify(property, undefined, 2)
    } else {
      files[key] = String(property)

      if (typeof property === 'function') {
        files[key] = `;(${files[key]})()`
      }
    }
  }

  if (!hasAnyFile) return

  // Make package directory
  fs.mkdirSync(_path, { recursive: true })

  // Write files
  for (const key in files) {
    if (!Object.prototype.hasOwnProperty.call(files, key)) continue

    fs.writeFileSync(path.join(_path, key), files[key])
  }

  return files
}

/**
 * Make simple package.json file template
 *
 * @param {object} [override]
 *
 * @return {object}
 */
export function makePackageJsonTemplate (override = Object.create(null)) {
  return Object.assign({
    name: pluginNameToPackageName(generateId().toLowerCase()),
    version: '0.0.1',
    main: 'index.js',
    scripts: {
      test: 'echo "Error: no test specified" && exit 1'
    },
    author: 'Arvinall <arvinall021@gmail.com>',
    license: 'ISC'
  }, override)
}

export function makeJSTemplate (pluginName) {
  // Convert pluginName format to camelcase
  pluginName = kebabCaseToCamelCase(pluginName)

  const template = () => {
    const pluginName = '<pluginName>'

    module.exports = {
      [`setup${pluginName}Plugin`]: function setupTestPlugin ({ Plugin }) {
        const result = {
          [`${pluginName}Plugin`]: class extends Plugin {}
        }

        // eslint-disable-next-line no-unused-expressions
        '<CUSTOM>'

        return { Plugin: result[`${pluginName}Plugin`] }
      }
    }

    module.exports = module.exports[`setup${pluginName}Plugin`]
  }

  template.toString = () => Function.prototype.toString.call(template)
    .replace('<pluginName>', pluginName)

  return template
}

/**
 * Convert kebab-case string format to CamelCase
 *
 * @param {string} value
 *
 * @return {string}
 */
export function kebabCaseToCamelCase (value) {
  value = value.split('-')

  for (const i in value) {
    if (!value.hasOwnProperty(i)) continue

    value[i] = value[i].slice(0, 1).toUpperCase() + value[i].slice(1).toLowerCase()
  }

  value = value.join('')

  return value
}
