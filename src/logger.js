
/**
 * @module logger
 */

import EventEmitter from 'events'
import fs from 'fs'
import path from 'path'
import stream from 'stream'
import { Console } from 'console'

/**
 * Simple logger
 *
 * @mixes module:remote-controller-server-core~external:EventEmitter
 */
export default class Logger extends EventEmitter {
  /**
   * @type module:remote-controller-server-core~external:Console
   */
  #logger
  /**
   * @type module:remote-controller-server-core~external:stream.Writable
   */
  #infoStream
  /**
   * @type module:remote-controller-server-core~external:stream.Writable
   */
  #errorStream

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
        this.#infoStream = fs.createWriteStream(path.join(directory, 'info.log'), { flags: 'a' })

        this.#infoStream.on('error', error => {
          if (error.code === 'ENOENT') this.#infoStream = undefined
        })

        // Error
        this.#errorStream = fs.createWriteStream(path.join(directory, 'error.log'), { flags: 'a' })

        this.#errorStream.on('error', error => {
          if (error.code === 'ENOENT') this.#errorStream = undefined
        })
      }
    } catch (e) {}

    if (this.#infoStream instanceof stream.Writable ||
      this.#errorStream instanceof stream.Writable) {
      this.#logger = new Console({
        stdout: this.#infoStream,
        stderr: this.#errorStream,
        colorMode: false
      })
    } else {
      this.#logger = {
        info () {},
        error () {}
      }
    }
  }

  /**
   * Log information
   *
   * @param {string} [scope]
   * @param {...any} messages
   * @return {(object|undefined)} Returns produced object or undefined if messages parameter left empty
   */
  info (scope, ...messages) {
    if (!(this.#infoStream instanceof stream.Writable) ||
      !messages.length) return

    const message = Object.create(null)

    if (typeof scope !== 'string') messages.unshift(scope)

    for (const messageId in messages) {
      if (messages[messageId] instanceof Object &&
        !(messages[messageId] instanceof Array)) {
        Object.assign(message, messages.splice(messageId, 1)[0])
      }
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
