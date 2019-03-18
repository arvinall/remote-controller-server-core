
/**
 * @module connections/connection
 */

import EventEmitter from 'events'
import engineIO from 'engine.io'
import Passport from '../passport'

const CLIENT_AUTHENTICATION_FACTORS = ['passport']

/**
 * Connection authentication status
 *
 * @event module:connections/connection#event:authentication
 *
 * @type {object}
 * @property {string} factor Authentication factor's name that it's states changed
 * @property {number} status
 * Authentication (factor) status
 *
 * | Value | Description |
 * | --- | --- |
 * | 0 | Ask for authentication factor |
 * | 1 | Allowed |
 * | 2 | Denied |
 * @property {string} type
 * Depend on factor
 *
 * |  Factor  | Description |
 * | --- | --- |
 * |  passport  | Type of passport |
 */

/**
 * @summary Connection is a Engine.io socket wrapper
 * @description
 * ### Messages
 * ##### Sends
 * **authentication** :`{@link module:connections/connection#event:authentication}`
 *
 * ##### Receives
 * **authenticate** :`object`
 *
 * | Name  | type  | Description |
 * | --- | --- | --- |
 * | factor  | string  |
 * | passportInput | string  | If factor is passport |
 *
 * @mixes module:remote-controller-server-core~external:EventEmitter
 * @see {@link https://github.com/socketio/engine.io/blob/master/README.md#events-2|engineIO.Socket's events}
 */
export default class Connection extends EventEmitter {
  #socket
  /**
   * Client IP address
   * @type {(string|null)}
   */
  #address = null
  /**
   * @type {{passport: boolean[], confirmation: boolean[]}}
   */
  #authenticationFactors = {
    confirmation: [false],
    passport: [false]
  }
  /**
   * @type {(module:passport|null)}
   */
  #passport = null

  #fireAuthenticatedEvent = (() => {
    let isAuthenticateCache = this.isAuthenticate

    return () => {
      const EVENT_PROPS = ['authentication', { status: 1 }]

      if (!this.isAuthenticate) EVENT_PROPS[1].status = 2

      if (isAuthenticateCache === this.isAuthenticate) return
      isAuthenticateCache = this.isAuthenticate

      this.emit(...EVENT_PROPS)
      this.send(...EVENT_PROPS)
    }
  })()
  #passportChecker = passportInput => {
    try {
      this.#authenticationFactors.passport[1] = this.#passport.isEqual(passportInput)
    } catch (error) {
      this.#authenticationFactors.passport[1] = false
    }

    const EVENT_PROPS = ['authentication', {
      factor: 'passport',
      status: this.#authenticationFactors.passport[1] ? 1 : 2
    }]

    this.emit(...EVENT_PROPS)
    this.send(...EVENT_PROPS)
    this.#fireAuthenticatedEvent()
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
   * @param {object} [configs.authenticationFactors={}] Authentication factors
   * @param {boolean} [configs.authenticationFactors.confirmation=true] Must Connection confirm before interact?
   * @param {boolean} [configs.authenticationFactors.passport=false]
   * @param {module:passport} [configs.passport] Required if configs.authenticationFactors.passport === true
   *
   * @emits module:connections/connection#event:authentication
   */
  constructor (configs) {
    if (typeof configs !== 'object') throw new Error('configs parameter is required and must be object')
    else if (!(configs.socket instanceof engineIO.Socket)) throw new Error('configs.socket is required and must be EngineIO.Socket')
    else if (
      (configs.authenticationFactors !== undefined &&
        typeof configs.authenticationFactors !== 'object') ||
      ((configs.authenticationFactors && configs.authenticationFactors.confirmation) !== undefined &&
        typeof (configs.authenticationFactors && configs.authenticationFactors.confirmation) !== 'boolean') ||
      ((configs.authenticationFactors && configs.authenticationFactors.passport) !== undefined &&
        typeof (configs.authenticationFactors && configs.authenticationFactors.passport) !== 'boolean')
    ) throw new Error('configs.authenticationFactors must be object with boolean values')

    super()

    // Set default configs
    configs = Object.assign({
      authenticationFactors: {}
    }, configs)
    // Set default authentication factors
    configs.authenticationFactors = Object.assign({
      confirmation: true,
      passport: false
    }, configs.authenticationFactors)

    let withOutAuthFactor = true
    for (let factor in configs.authenticationFactors) {
      if (!this.#authenticationFactors[factor] || !configs.authenticationFactors[factor]) continue

      withOutAuthFactor = false
      break
    }
    if (withOutAuthFactor) throw new Error('One authentication factor require at least')

    if (configs.authenticationFactors.passport === true && !(configs.passport instanceof Passport)) {
      throw new Error('configs.passport is required and must be Passport')
    }

    this.#socket = configs.socket
    this.#address = this.#socket.request.socket.remoteAddress
    for (let factor in this.#authenticationFactors) {
      this.#authenticationFactors[factor].unshift(configs.authenticationFactors[factor])
    }
    this.#passport = configs.authenticationFactors.passport ? configs.passport : null

    // Transform Socket events to Connection
    this.#socket.emit = (eventName, ...args) => {
      const chain = EventEmitter.prototype.emit.call(this.#socket, eventName, ...args)
      const necessaryEvents = ['message', 'disconnected', 'error']

      // Change events name
      if (eventName === 'close') eventName = 'disconnected'

      if (!necessaryEvents.includes(eventName)) return chain

      if (eventName !== 'message') this.emit(eventName, ...args)
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

        if (body && body[0] === 'Uint8Array' && typeof body[1] === 'object') {
          body = uint8ArrayLikeToBuffer(body[1])
        }

        if (name &&
          (name === 'authenticate' || this.isAuthenticate) &&
          !necessaryEvents.includes(name)) {
          this.emit(name, body)
        }
      }

      return chain
    }

    setImmediate(() => {
      for (let factor in this.#authenticationFactors) {
        if (!this.#authenticationFactors[factor][0]) continue

        const EVENT_PROPS = ['authentication', {
          factor,
          status: 0
        }]

        switch (factor) {
          case 'passport':
            EVENT_PROPS[1].type = this.#passport.type
            break
        }

        this.emit(...EVENT_PROPS)
        this.send(...EVENT_PROPS)
      }

      this.on('authenticate', event => {
        if (
          !this.#authenticationFactors[event.factor] ||
          !this.#authenticationFactors[event.factor][0] ||
          this.#authenticationFactors[event.factor][1] ||
          !CLIENT_AUTHENTICATION_FACTORS.includes(event.factor)
        ) return

        switch (event.factor) {
          case 'passport':
            this.#passportChecker(event.passportInput)
            break
        }
      })
    })
  }

  /**
   * @summary Send message to client
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
  send (name, body) {
    if (typeof name !== 'string') throw new Error('name parameter is required and must be string')
    else if (name !== 'authentication' && !this.isAuthenticate) return Promise.reject(new Error('Connection is not authenticated'))

    let message = [ name ]

    if (body instanceof Buffer) {
      message[1] = bufferToUint8ArrayLike(body)
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
   * @emits module:connections/connection#event:authentication
   *
   * @return {void}
   */
  confirm (confirmation = true) {
    confirmation = Boolean(confirmation)

    if (this.#authenticationFactors.confirmation[1] === confirmation) return

    this.#authenticationFactors.confirmation[1] = confirmation

    const EVENT_PROPS = ['authentication', {
      factor: 'confirmation',
      status: this.#authenticationFactors.confirmation[1] ? 1 : 2
    }]

    this.emit(...EVENT_PROPS)
    this.send(...EVENT_PROPS)
    this.#fireAuthenticatedEvent()
  }

  /**
   * Get Connection authentication status
   *
   * @type {boolean}
   */
  get isAuthenticate () {
    let authenticated = false

    for (let factor in this.#authenticationFactors) {
      if (this.#authenticationFactors[factor][0]) {
        authenticated = this.#authenticationFactors[factor][1]
        if (!authenticated) break
      }
    }

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

  /**
   * Connection id
   *
   * @return {number}
   */
  get id () {
    return this.#socket.id
  }
}

export function bufferToUint8ArrayLike (buffer) {
  let ab = new ArrayBuffer(buffer.length)
  let view = new Uint8Array(ab)
  for (var i = 0; i < buffer.length; ++i) {
    view[i] = buffer[i]
  }
  return ['Uint8Array', Array.from(view)]
}

export function uint8ArrayLikeToBuffer (uint8ArrayLike) {
  return ['Buffer', Buffer.from(Uint8Array.from(uint8ArrayLike))]
}
