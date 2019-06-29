
/**
 * @module logger
 */

import EventEmitter from 'events'
import fs from 'fs'
import path from 'path'
import { promisify } from 'util'

const INDENT = 2 // spaces

/**
 * Simple logger
 *
 * @mixes module:remote-controller-server-core~external:EventEmitter
 */
export default class Logger extends EventEmitter {
  /**
   * @type {string[]}
   */
  #types = [
    'info',
    'warn',
    'error'
  ]
  /**
   * @type {{warn: string, error: string, info: string}}
   */
  #paths = {
    info: undefined,
    warn: undefined,
    error: undefined
  }

  /**
   * @summary Append log to log files
   * @description
   * Available type:
   * * `info`
   * * `warn`
   * * `error`
   *
   * @param {string} type Target log file
   * @param {*} data This parameter pass to JSON.stringify
   *
   * @return {Promise<(void|Error)>}
   */
  #append = async (type, data) => {
    const path = this.#paths[type]

    if (typeof path !== 'string') return

    return promisify(fs.appendFile)(path, JSON
      .stringify(data, null, INDENT) + ",\n") // eslint-disable-line quotes
  }

  /**
   * Emit events with "Logged" suffix
   *
   * @param {string} type
   * @param {...*} data
   *
   * @return {module:logger~Logger}
   */
  #emitLogged = (type, ...data) => this.emit(type + 'Logged', ...data)

  /**
   * @param {string} [directory]
   */
  constructor (directory) {
    if (directory !== undefined &&
      directory !== null) directory = String(directory)

    super()

    try {
      if (fs.statSync(directory).isDirectory()) {
        for (const type of this.#types) {
          this.#paths[type] = path.join(directory, type + '.log')
        }
      }
    } catch (e) {}
  }

  /**
   * Log information
   *
   * @param {string} [scope]
   * @param {...*} [data]
   *
   * @emits module:logger~Logger#event:infoLogged
   *
   * @return {object}
   *
   * @see module:logger.createInfoObject
   */
  info (scope, ...data) {
    const infoObject = createInfoObject(scope, ...data)

    if (infoObject === undefined) return

    const parameters = [ 'info', infoObject ]

    this.#append(...parameters)
      /**
       * Logger infoLogged event
       *
       * @event module:logger~Logger#event:infoLogged
       *
       * @type {object}
       *
       * @see module:logger.createInfoObject
       */
      .then(() => this.#emitLogged(...parameters))

    return infoObject
  }

  /**
   * Log warnings
   *
   * @param {string} [scope]
   * @param {...*} [data]
   *
   * @emits module:logger~Logger#event:warnLogged
   *
   * @return {object}
   *
   * @see module:logger.createErrorObject
   */
  warn (scope, ...data) {
    const warnObject = createErrorObject(scope, ...data)

    if (warnObject === undefined) return

    const parameters = [ 'warn', warnObject ]

    this.#append(...parameters)
    /**
     * Logger warnLogged event
     *
     * @event module:logger~Logger#event:warnLogged
     *
     * @type {object}
     *
     * @see module:logger.createErrorObject
     */
      .then(() => this.#emitLogged(...parameters))

    return warnObject
  }

  /**
   * Log errors
   *
   * @param {string} [scope]
   * @param {...*} [data]
   *
   * @emits module:logger~Logger#event:errorLogged
   *
   * @return {object}
   *
   * @see module:logger.createErrorObject
   */
  error (scope, ...data) {
    const errorObject = createErrorObject(scope, ...data)

    if (errorObject === undefined) return

    const parameters = [ 'error', errorObject ]

    this.#append(...parameters)
      /**
       * Logger errorLogged event
       *
       * @event module:logger~Logger#event:errorLogged
       *
       * @type {object}
       *
       * @see module:logger.createErrorObject
       */
      .then(() => this.#emitLogged(...parameters))

    return errorObject
  }
}

// Set string tag
Object.defineProperty(Logger.prototype, Symbol.toStringTag, {
  get () {
    return Logger.name
  }
})

/**
 * @summary Create an object based inputs for logging information
 * @description
 * Adds date key to return object with current human readable date and time <br>
 * Use object's `{@link module:logger.logSymbol}` getter instead object if available
 *
 * @param {string} [scope] If this parameter provided, added to return object by "scope" key
 * @param {...*} [data] All objects merged with return object and other primitive values push to an array that its key is "messages"
 *
 * @return {object}
 */
export function createInfoObject (scope, ...data) {
  const infoObject = Object.create(null)

  if ((scope !== undefined &&
    typeof scope !== 'string') ||
    (!data.length &&
      typeof scope === 'string')) {
    data.unshift(scope)

    scope = undefined
  }

  if (!data.length) return

  Object.assign(infoObject, {
    scope: typeof scope === 'string' ? scope : undefined,
    date: Date(Date.now())
  })

  const mergedObjects = []

  for (const dataIndex in data) {
    if ((data[dataIndex] && data[dataIndex][logSymbol]) !== undefined) {
      data[dataIndex] = data[dataIndex][logSymbol]
    }

    if (typeof data[dataIndex] === 'object' &&
      !(data[dataIndex] instanceof Array)) {
      mergedObjects.unshift(dataIndex)

      Object.assign(infoObject, data[dataIndex])
    }
  }

  for (const objectIndex of mergedObjects) {
    data.splice(objectIndex, 1)
  }

  infoObject.messages = data.length ? data : undefined

  return infoObject
}

/**
 * @summary Create an object based inputs for logging errors
 * @description
 * Same as {@link module:logger.createInfoObject} with some additional behaviors <br><br>
 * Errors pushes to "_errors" array for future usage <br>
 * Errors serialize to normal objects <br>
 * If Number of errors equal to 1, then it sets to "error" key, else errors pushes to "errors" key
 *
 * @param {string} [scope]
 * @param {...*} [data]
 *
 * @return {object}
 *
 * @see module:logger.createInfoObject
 */
export function createErrorObject (scope, ...data) {
  if ((scope !== undefined &&
    typeof scope !== 'string') ||
    (!data.length &&
      typeof scope === 'string')) {
    data.unshift(scope)

    scope = undefined
  }

  if (!data.length) return

  const errors = []

  for (let dataIndex = data.length - 1; dataIndex >= 0; dataIndex--) {
    if (data[dataIndex] instanceof Error) errors.unshift(data.splice(dataIndex, 1)[0])
  }

  for (const error of errors) {
    if (error[logSymbol] !== undefined) data.push(error[logSymbol])
  }

  if (!data.length) data.push(Object.create(null))

  const errorObject = createInfoObject(scope, ...data)

  if (errorObject === undefined) return

  Object.defineProperty(errorObject, '_errors', {
    value: errors.length ? errors : undefined,
    enumerable: false
  })

  const safeErrors = []

  if (errorObject._errors) {
    for (const error of errors) {
      const safeError = safeErrors[safeErrors.push(Object.create(null)) - 1]

      for (const key of Object.getOwnPropertyNames(Object.getPrototypeOf(error))) {
        safeError[key] = error[key]
      }
      for (const key of Object.getOwnPropertyNames(error)) {
        safeError[key] = error[key]
      }
    }
  }

  if (safeErrors.length === 1) errorObject.error = safeErrors[0]
  else if (safeErrors.length > 1) errorObject.errors = safeErrors

  return errorObject
}

/**
 * Use this symbol as key on any object for custom logging
 *
 * @type {symbol}
 */
export const logSymbol = Symbol('log')
