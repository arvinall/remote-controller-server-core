/* global global */

/**
 * @module plugins/pluginPreferences
 */

import {
  makeClassLoggable,
  logSymbol
} from '../logger'
import * as helpers from '../helpers'

// Error classes
const logObject = {
  scope: 'pluginPreferences',
  class: 'PluginPreferences',
  event: undefined,
  module: undefined
}
const TypeError = makeClassLoggable(global.TypeError, logObject)

/**
 * Create a wrapper around preferences module to use in plugins
 *
 * @see module:preferences~Preferences
 */
export default class PluginPreferences {
  /**
   * @type {string}
   */
  #name
  /**
   * @type {module:preferences~Preferences}
   */
  #preferences

  /**
   * @param {object} configs
   * @param {string} configs.name Name that use for create Preference instance
   * @param {module:preferences~Preferences} configs.preferences
   */
  constructor (configs) {
    if (typeof configs !== 'object') throw new TypeError('configs parameter is required and must be object')
    else if (typeof configs.name !== 'string') throw new TypeError('configs.name is required and must be string')
    else if (!(configs.preferences instanceof Object)) throw new TypeError('configs.preferences is required and must be Preferences')

    this.#name = configs.name
    this.#preferences = configs.preferences
  }

  /**
   * Get previous created preference
   *
   * @return {module:preferences/preference}
   *
   * @see module:preferences~Preferences#get
   */
  get () {
    return this.#preferences.get(this.#name)
  }

  /**
   * Create/Initialize preference
   *
   * @param {object} [body={}] Preference's initial content
   *
   * @return {module:preferences/preference}
   *
   * @see module:preferences~Preferences#add
   */
  add (body = Object.create(null)) {
    return this.#preferences.add(this.#name, body)
  }

  /**
   * Remove preference
   *
   * @async
   *
   * @see module:preferences~Preferences#remove
   */
  remove () {
    return this.#preferences.remove(this.#name)
  }

  /**
   * Remove preference
   *
   * @see module:preferences~Preferences#removeSync
   */
  removeSync () {
    return this.#preferences.removeSync(this.#name)
  }

  /**
   * Check Preference is already exist
   *
   * @return {boolean}
   *
   * @see module:preferences~Preferences#has
   */
  has () {
    return this.#preferences.has(this.#name)
  }

  get [logSymbol] () {
    try {
      return this.get()[logSymbol]
    } catch (error) {
      return {}
    }
  }
}

// Set string tag
helpers.decorator.setStringTag()(PluginPreferences)
