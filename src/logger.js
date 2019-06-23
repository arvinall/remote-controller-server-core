
/**
 * @module logger
 */

import EventEmitter from 'events'
import fs from 'fs'
import path from 'path'
import { promisify } from 'util'

/**
 * Simple logger
 *
 * @mixes module:remote-controller-server-core~external:EventEmitter
 */
export default class Logger extends EventEmitter {
  /**
   * @type string
   */
  #infoPath
  /**
   * @type string
   */
  #errorPath
  #logger = {
    info: async message => {
      if (typeof this.#infoPath !== 'string') return

      return promisify(fs.appendFile)(this.#infoPath, message)
    },
    error: async error => {
      if (typeof this.#errorPath !== 'string') return

      return promisify(fs.appendFile)(this.#errorPath, error)
    }
  }

  /**
   * @param {string} [directory]
   */
  constructor (directory) {
    if (directory !== undefined &&
      directory !== null) directory = String(directory)

    super()

    try {
      if (fs.statSync(directory).isDirectory()) {
        // Info
        this.#infoPath = path.join(directory, 'info.log')

        // Error
        this.#errorPath = path.join(directory, 'error.log')
      }
    } catch (e) {}
  }

  /**
   * Log information
   *
   * @param {string} [scope]
   * @param {...any} messages
   *
   * @return {(object|undefined)} Returns produced object or undefined if messages parameter left empty
   */
  info (scope, ...messages) {
    if (typeof this.#infoPath !== 'string') return

    const message = Object.create(null)

    if (typeof scope !== 'string') messages.unshift(scope)

    if (!messages.length) return

    const messagesMustRemove = []

    for (const messageId in messages) {
      if (messages[messageId][logSymbol] !== undefined) {
        messages[messageId] = messages[messageId][logSymbol]
      }

      if (messages[messageId] instanceof Object &&
        !(messages[messageId] instanceof Array)) {
        messagesMustRemove.unshift(messageId)

        Object.assign(message, messages[messageId])
      }
    }

    for (const messageId of messagesMustRemove) {
      messages.splice(messageId, 1)
    }

    message.messages = messages.length ? messages : undefined

    Object.assign(message, {
      scope: typeof scope === 'string' ? scope : undefined,
      date: Date(Date.now())
    })

    this.#logger.info(JSON.stringify(message, null, 2) + ',')

    return message
  }

  /**
   * Log errors
   *
   * @param {string} [scope]
   * @param {...any} errors
   *
   * @return {(object|undefined)} Returns produced object or undefined if errors parameter left empty
   */
  error (scope, ...errors) {
    if (typeof this.#errorPath !== 'string') return

    const error = Object.create(null)

    if (typeof scope !== 'string') errors.unshift(scope)

    if (!errors.length) return

    const errorsMustRemove = []

    for (const errorId in errors) {
      if (errors[errorId][logSymbol] !== undefined) {
        errors[errorId] = errors[errorId][logSymbol]
      }

      if (errors[errorId] instanceof Error) {
        errorsMustRemove.unshift(errorId)

        const _error = errors[errorId]
        const result = Object.create(null)

        Object.assign(result, _error)

        for (const key of Object.getOwnPropertyNames(Object.getPrototypeOf(_error))) {
          result[key] = _error[key]
        }

        for (const key of Object.getOwnPropertyNames(_error)) {
          result[key] = _error[key]
        }

        Object.assign(error, result)
      } else if (errors[errorId] instanceof Object &&
        !(errors[errorId] instanceof Array)) {
        errorsMustRemove.unshift(errorId)

        Object.assign(error, errors[errorId])
      }
    }

    for (const errorId of errorsMustRemove) {
      errors.splice(errorId, 1)
    }

    error.errors = errors.length ? errors : undefined

    Object.assign(error, {
      scope: typeof scope === 'string' ? scope : undefined,
      date: Date(Date.now())
    })

    this.#logger.error(JSON.stringify(error, null, 2) + ',')

    return error
  }
}

/**
 * Use this symbol as key on any object for custom logging
 *
 * @type {symbol}
 */
export const logSymbol = Symbol('log')
