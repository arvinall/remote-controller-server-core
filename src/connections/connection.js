
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
   * @summary Listen to engineIO.Socket events
   * @description
   * This class receives client's messages like this
   * <br> `'["name","body"]'` <br>
   * and then emit an event with its name and body
   * ##### Elements
   *  | Name | Type | Attributes | Description |
   *  | --- | --- | --- | --- | --- |
   *  | name | string |   | Message's name |
   *  | body | * | <optional> | Message's body |
   *
   * @param {object} configs
   * @param {module:remote-controller-server-core~engineIO.Socket} configs.socket
   * @param {boolean} [configs.confirmation=true] Must Connection confirm before interact?
   *
   * @emits module:connections/connection#event:askConfirmation
   * @emits module:connections/connection#event:disconnected
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
      const necessaryEvents = ['message', 'disconnected', 'error']

      // Change events name
      if (eventName === 'close') eventName = 'disconnected'

      if (!necessaryEvents.includes(eventName)) return chain

      if (eventName !== 'message') this.localEmit(eventName, ...args)
      else {
        let message = args[0] || null
        let name
        let body

        necessaryEvents.splice(necessaryEvents.indexOf(eventName), 1)

        try {
          message = JSON.parse(message)
        } catch (error) {}

        if (message instanceof Array && typeof message[0] === 'string') {
          name = message[0]
          body = message[1]
        }

        if (name && this.isAuthenticate && !necessaryEvents.includes(name)) {
          this.localEmit(name, body)
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
   * @summary emit sends message to client
   * @description
   * If body is instanceof Buffer, then it convert to Uint8Array
   *
   * this method create an array and push name and body to it
   * `[name, body]`
   * and then normalize it to string and send to client
   *
   * @param {string} name Message's name
   * @param {*} [body] Message's content
   *
   * @return {Promise<(void|Error)>}
   * * Rejection
   *  * Reject an error if Connection is not authenticated
   */
  emit (name, body) {
    if (typeof name !== 'string') throw new Error('name parameter is required and must be string')
    else if (!this.isAuthenticate) return Promise.reject(new Error('Connection is not authenticated'))

    let message = [ name ]

    if (body instanceof Buffer) {
      message[1] = [
        'Uint8Array',
        Array.from(new Uint8Array(body.buffer))
      ]
    } else message[1] = body

    message = JSON.stringify(message)

    return new Promise(resolve => this.#socket.send(message, undefined, () => resolve()))
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
     * @summary Connection disconnected event
     * @description
     * Same as engineIO.Socket close event
     *
     * @event module:connections/connection#event:disconnected
     *
     * @see module:remote-controller-server-core~engineIO.Socket
     * @see {@link https://github.com/socketio/engine.io/blob/master/README.md#events-2|engineIO.Socket's events}
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
