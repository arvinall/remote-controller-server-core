
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
}
