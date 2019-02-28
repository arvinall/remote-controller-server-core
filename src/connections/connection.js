
/**
 * @module connections/connection
 */

import EventEmitter from 'events'
import engineIO from 'engine.io'

/**
 * Connection is a Engine.io socket wrapper
 *
 * @mixes module:remote-controller-server-core~external:EventEmitter
 * @see {@link https://github.com/socketio/engine.io/blob/master/README.md#events-2|engineIO.Socket's events}
 */
export default class Connection extends EventEmitter {
  #socket
  // Client IP address
  #address
  #mustConfirm
  #confirmed = false

  /**
   * Listen to EngineIO.Socket events
   *
   * @param {object} configs
   * @param {module:remote-controller-server-core~engineIO.Socket} configs.socket
   * @param {boolean} [configs.confirmation=true] Must Connection confirm before interact?
   *
   * @emits module:connections/connection:askConfirmation
   */
  constructor (configs) {
    if (typeof configs !== 'object') throw new Error('configs parameter is required and must be object')
    else if (!(configs.socket instanceof engineIO.Socket)) throw new Error('configs.socket is required and must be EngineIO.Socket')

    super()

    // Set default configs
    configs = Object.assign({
      confirmation: true
    }, configs)

    this.#socket = configs.socket
    this.#address = this.#socket.request.socket.remoteAddress
    this.#mustConfirm = configs.confirmation

    // Transform Socket events to Connection
    this.#socket.emit = (eventName, ...args) => {
      const chain = EventEmitter.prototype.emit.call(this.#socket, eventName, ...args)

      if (eventName !== 'message') this.emit(eventName, ...args)
      else {
        let message = args[0]

        if (typeof message === 'string') {
          try {
            message = JSON.parse(message)

            if (message.name === undefined || message.body === undefined) message = null
          } catch (error) {
            message = null
          }
        }

        if (this.isIdentify) {
          if (message !== null) this.emit(message.name, message.body)
        }
      }

      return chain
    }

    /**
     * Connection askConfirmation event
     * Fire if Connection needs confirmation
     *
     * @event module:connections/connection:askConfirmation
     */
    if (this.#mustConfirm) setImmediate(() => this.emit('askConfirmation'))
  }

  /**
   * Mark this Connection as confirmed
   *
   * @param {boolean} [confirmation=true]
   *
   * @return {void}
   */
  confirm (confirmation = true) {
    this.#confirmed = Boolean(confirmation)
  }

  /**
   * Get Connection authentication status
   *
   * @type {boolean}
   */
  get isIdentify () {
    let identified = true

    if (this.#mustConfirm && !this.#confirmed) identified = false

    return identified
  }

  /**
   * Get Socket readyState
   *
   * @type {string}
   *
   * @see module:remote-controller-server-core~engineIO.Socket
   * @see {@link https://github.com/socketio/engine.io/blob/master/README.md#properties-2|engineIO.Socket's properties}
   */
  get status () {
    return this.#socket.readyState
  }

  /**
   * Get Client IP
   *
   * @type {string}
   */
  get address () {
    return this.#address
  }
}
