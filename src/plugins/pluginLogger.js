
/**
 * @module plugins/pluginLogger
 */

import * as helpers from '../helpers'
import Logger from '../logger'

/**
 * Create a wrapper around logger module to use in plugins
 *
 * @see module:logger
 */
export default class PluginLogger {
  /**
   * @type {string}
   */
  #name
  /**
   * @type {module:logger}
   */
  #logger
  /**
   * @type {object}
   */
  #logObject = {}

  /**
   * @param {object} configs
   * @param {string} configs.name
   * @param {module:logger} configs.logger
   */
  constructor (configs) {
    if (typeof configs !== 'object') throw new TypeError('configs parameter is required and must be object')
    else if (typeof configs.name !== 'string') throw new TypeError('configs.name is required and must be string')
    else if (!(configs.logger instanceof Logger)) throw new TypeError('configs.logger is required and must be Logger')

    this.#name = configs.name
    this.#logger = configs.logger
    this.#logObject.pluginName = this.#name
  }

  /**
   * Log information
   *
   * @param {string} [scope]
   * @param {...*} [data]
   *
   * @return {{_promise: Promise}}
   *
   * @see module:logger#info
   */
  info (scope, ...data) {
    data.push(this.#logObject)

    return this.#logger.info(scope, ...data)
  }

  /**
   * Log warnings
   *
   * @param {string} [scope]
   * @param {...*} [data]
   *
   * @return {{_promise: Promise}}
   *
   * @see module:logger#warn
   */
  warn (scope, ...data) {
    data.push(this.#logObject)

    return this.#logger.warn(scope, ...data)
  }

  /**
   * Log errors
   *
   * @param {string} [scope]
   * @param {...*} [data]
   *
   * @return {{_promise: Promise}}
   *
   * @see module:logger#error
   */
  error (scope, ...data) {
    data.push(this.#logObject)

    return this.#logger.error(scope, ...data)
  }
}

// Set string tag
helpers.decorator.setStringTag()(PluginLogger)
