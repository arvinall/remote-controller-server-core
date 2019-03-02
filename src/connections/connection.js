
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
  #fireAuthenticatedEvent = () => {
    /**
     * Connection authenticated event
     *
     * @event module:connections/connection#event:authenticated
     */
    if (this.isAuthenticate) this.localEmit('authenticated')
  }

  /**
   * Listen to EngineIO.Socket events
   *
   * @param {object} configs
   * @param {module:remote-controller-server-core~engineIO.Socket} configs.socket
   * @param {boolean} [configs.confirmation=true] Must Connection confirm before interact?
   *
   * @emits module:connections/connection#event:askConfirmation
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

      if (eventName === 'close') eventName = 'disconnected'

      if (eventName !== 'message') this.localEmit(eventName, ...args)
      else {
        let message = args[0]

        if (typeof message === 'string') {
          try {
            message = JSON.parse(message)

            if (message.name === undefined) message = null
          } catch (error) {
            message = null
          }
        }

        if (this.isAuthenticate) {
          if (message !== null) this.localEmit(message.name, message.body)
        }
      }

      return chain
    }

    /**
     * Connection askConfirmation event
     * Fire if Connection needs confirmation
     *
     * @event module:connections/connection#event:askConfirmation
     */
    if (this.#mustConfirm) setImmediate(() => this.localEmit('askConfirmation'))
  }

  /**
   * emit sends message to client
   * If body is instanceof Buffer, then it convert to Uint8Array
   *
   * @param {string} name Message's name
   * @param {*} [body] Message's content
   *
   * @return {Promise}
   */
  emit (name, body) {
    let message = Object.create(null)

    message.name = name
    message.body = body

    if (body instanceof Buffer) {
      message.body = Object.create(null)

      message.body.type = 'Uint8Array'
      message.body.data = Array.from(new Uint8Array(body.buffer))
    }

    message = JSON.stringify(message)

    return new Promise((resolve, reject) => {
      if (!this.isAuthenticate) return reject(new Error('Connection is not authenticated'))

      this.#socket.send(message, undefined, () => resolve())
    })
  }

  /**
   * Disconnect Connection
   *
   * @emits module:connections/connection#event:disconnected
   *
   * @return {void}
   */
  disconnect () {
    /**
     * Connection disconnected event same as engineIO.Socket#event:close
     *
     * @event module:connections/connection#event:disconnected
     * @see {@link https://github.com/socketio/engine.io/blob/master/README.md#events-2|Engine.io's Github page}
     * @see module:remote-controller-server-core~engineIO.Socket
     */
    if (this.status !== 'closed' || this.status !== 'closing') this.#socket.close()
  }

  /**
   * Mark this Connection as confirmed
   *
   * @param {boolean} [confirmation=true]
   *
   * @emits module:connections/connection#event:authenticated
   *
   * @return {void}
   */
  confirm (confirmation = true) {
    this.#confirmed = Boolean(confirmation)

    this.#fireAuthenticatedEvent()
  }

  /**
   * localEmit is a alias for EventEmitter.prototype.emit
   *
   * @see module:remote-controller-server-core~EventEmitter
   * @see {@link https://nodejs.org/api/events.html#events_emitter_emit_eventname_args|Events}
   */
  get localEmit () {
    return EventEmitter.prototype.emit.bind(this)
  }

  /**
   * Get Connection authentication status
   *
   * @type {boolean}
   */
  get isAuthenticate () {
    let authenticated = true

    if (this.#mustConfirm && !this.#confirmed) authenticated = false

    return authenticated
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

  /**
   * @type {boolean}
   */
  get isConnected () {
    return this.status === 'open'
  }
}
