/* global global, Buffer */

/**
 * @module connections/connection
 */

import AsyncEventEmitter from '../asyncEventEmitter'
import http from 'http'
import WebSocket from 'ws'
import Passport from '../passport'
import idGenerator from '../idGenerator'
import stream from 'stream'
import * as helpers from '../helpers'
import {
  logSymbol,
  makeClassLoggable
} from '../logger'

// Error classes
const logObject = {
  scope: 'connection',
  class: 'Connection',
  event: undefined,
  module: undefined
}
const Error = makeClassLoggable(global.Error, logObject)
const TypeError = makeClassLoggable(global.TypeError, logObject)

const CLIENT_AUTHENTICATION_FACTORS = [ 'passport' ]
const generateId = idGenerator()

/**
 * @summary Connection is a {@link module:remote-controller-server-core~external:ws.WebSocket|ws.WebSocket} wrapper
 * @description
 * This class receives client's messages like this
 * <br> `'[string, *[]]'` <br>
 * and then emit an event with its name and body
 * ##### Elements
 *  | Name | Type | Attributes | Description |
 *  | --- | --- | --- | --- | --- |
 *  | `0` | `string` |   | Message's name |
 *  | `1` | `*[]` | &lt;optional> | Message's body (Every element pass as parameter to event) |
 *
 *
 * ### Messages
 * ##### Sends
 * **authentication**:  `{@link module:connections/connection#event:authentication}`
 *
 * ##### Receives
 * **authenticate**:  `object`
 *
 * | Name  | Type  | Description |
 * | --- | --- | --- |
 * | `factor`  | `string`  |  Target factor
 * | `passportInput` | `string`  | If factor is passport |
 *
 *
 * ##### Disconnect codes and descriptions
 * |  Code  | Description |
 * |  --- | --- |
 * |  `4000`  | Connection unauthenticated  |
 *
 * @mixes module:asyncEventEmitter
 */
export default class Connection extends AsyncEventEmitter {
  /**
   * @type {string}
   */
  #id
  /**
   * @type {module:remote-controller-server-core~external:ws.WebSocket}
   */
  #socket
  /**
   * @type {string}
   */
  #address
  /**
   * @type {module:passport}
   */
  #passport
  /**
   * @type {{passport: boolean[], confirmation: boolean[]}}
   */
  #authenticationFactors = {
    // [Requirement, Verification]
    passport: [false /* , false */], // eslint-disable-line standard/array-bracket-even-spacing
    confirmation: [true /* , false */] // eslint-disable-line standard/array-bracket-even-spacing
  }
  /**
   * @type {boolean}
   */
  #binary = false

  /**
   * @emits module:connections/connection#event:authentication
   */
  #emitAuthentication = (() => {
    let isAuthenticateCache

    const handler = () => {
      // Prevent emit authentication status if:
      if (isAuthenticateCache === this.isAuthenticate || // Authentication status has no change
        (this.#authenticationFactors.confirmation[0] && // (confirmation) Only one factor passed when two factor needed
          this.#authenticationFactors.confirmation[1] !== undefined &&
          this.#authenticationFactors.passport[0] &&
          this.#authenticationFactors.passport[1] === undefined) ||
        (this.#authenticationFactors.confirmation[0] && // (passport) Only one factor passed when two factor needed
          this.#authenticationFactors.confirmation[1] === undefined &&
          this.#authenticationFactors.passport[0])) return

      isAuthenticateCache = this.isAuthenticate

      const EVENT_PROPS = ['authentication', {
        status: this.isAuthenticate ? 1 : 2
      }]

      if (this.isAuthenticate) EVENT_PROPS[1].id = this.id

      this.emit(...EVENT_PROPS)
      this.send(...EVENT_PROPS).catch(() => {})
    }

    handler.clearCache = () => {
      isAuthenticateCache = undefined
    }

    return handler
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
    this.send(...EVENT_PROPS).catch(() => {})
    this.#emitAuthentication()
  }

  #emitFirstAuthenticationFactorAsk = () => {
    for (let factor in this.#authenticationFactors) {
      if (!this.#authenticationFactors[factor][0] ||
        this.#authenticationFactors[factor][1] !== undefined) continue

      const EVENT_PROPS = ['authentication', {
        factor,
        status: 0
      }]

      if (factor === 'passport') EVENT_PROPS[1].type = this.#passport.type

      this.emit(...EVENT_PROPS)
      this.send(...EVENT_PROPS).catch(() => {})

      break
    }
  }

  #emitConnected = () => {
    /**
     * Connection connected event
     *
     * @event module:connections/connection#event:connected
     */
    return this.emit('connected')
  }

  /**
   * Transfer events from {@link module:remote-controller-server-core~external:ws.WebSocket|ws.WebSocket}, <br>
   * Initial connection and send authentication (factor) statuses
   *
   * @param {object} configs
   * @param {module:remote-controller-server-core~external:ws.WebSocket} configs.socket
   * @param {module:remote-controller-server-core~external:http.IncomingMessage} configs.socket.request
   * @param {object} [configs.authenticationFactors={}] Authentication factors
   * @param {boolean} [configs.authenticationFactors.confirmation=true] Must Connection confirm before interact?
   * @param {boolean} [configs.authenticationFactors.passport=false]
   * @param {module:passport} [configs.passport] Required if configs.authenticationFactors.passport is set to true
   *
   * @emits module:connections/connection#event:authentication
   * @emits module:connections/connection#event:connected
   */
  constructor (configs) {
    if (typeof configs !== 'object') throw new TypeError('configs parameter is required and must be object')
    else if (!(configs.socket instanceof WebSocket)) throw new TypeError('configs.socket is required and must be ws.WebSocket')
    else if (!(configs.socket.request instanceof http.IncomingMessage)) throw new TypeError('configs.socket.request is required and must be http.IncomingMessage')
    else if (
      (configs.authenticationFactors !== undefined &&
        typeof configs.authenticationFactors !== 'object') ||
      ((configs.authenticationFactors && configs.authenticationFactors.confirmation) !== undefined &&
        typeof configs.authenticationFactors.confirmation !== 'boolean') ||
      ((configs.authenticationFactors && configs.authenticationFactors.passport) !== undefined &&
        typeof configs.authenticationFactors.passport !== 'boolean')
    ) throw new TypeError('configs.authenticationFactors must be object with boolean values')

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

    let withoutAuthFactor = true
    for (let factor in configs.authenticationFactors) {
      if (!this.#authenticationFactors[factor] || !configs.authenticationFactors[factor]) continue

      withoutAuthFactor = false
      break
    }
    if (withoutAuthFactor) throw new Error('One authentication factor require at least')

    if (configs.authenticationFactors.passport === true &&
      !(configs.passport instanceof Passport)) throw new TypeError('configs.passport is required and must be Passport')

    this.#id = generateId()
    this.#socket = configs.socket
    this.#address = this.#socket.request.socket.remoteAddress
    for (let factor in this.#authenticationFactors) {
      this.#authenticationFactors[factor][0] = configs.authenticationFactors[factor]
    }
    if (configs.authenticationFactors.passport) this.#passport = configs.passport

    // Transform Socket events to Connection
    this.#socket.emit = (eventName, ...args) => {
      const chain = AsyncEventEmitter.prototype.emit.call(this.#socket, eventName, ...args)
      const necessaryEvents = ['message', 'disconnected', 'error']

      // Change events name
      if (eventName === 'close') eventName = 'disconnected'

      if (!necessaryEvents.includes(eventName)) return chain

      if (eventName !== 'message') this.emit(eventName, ...args)
      else if (this.listenerCount(args[0].split('"')[1])) {
        let message = args[0]
        let name
        let body

        necessaryEvents.splice(necessaryEvents.indexOf(eventName), 1)

        try {
          message = JSON.parse(message)
        } catch (error) {}

        if (message instanceof Array && typeof message[0] === 'string') {
          name = message[0]

          if (message[1] instanceof Array) body = message[1]
        }

        if (body instanceof Array) {
          for (let dataIndex in body) {
            const data = body[dataIndex]

            if (data instanceof Array &&
              data[0] === 'Uint8Array' &&
              data[1] instanceof Array) {
              body[dataIndex] = uint8ArrayLikeToBuffer(data)
            }
          }
        }

        if (!(body instanceof Array)) body = []

        if (name &&
          (name === 'authenticate' || this.isAuthenticate) &&
          !necessaryEvents.includes(name)) this.emit(name, ...body)
      }

      return chain
    }

    this.on('authentication', event => {
      // Emit/Send next factor ask
      if (event.factor === 'passport') {
        if (!this.isAuthenticate &&
          this.#authenticationFactors.confirmation[0] &&
          event.status === 1) {
          const EVENT_PROPS = ['authentication', {
            factor: 'confirmation',
            status: 0
          }]

          this.emit(...EVENT_PROPS)
          this.send(...EVENT_PROPS).catch(() => {})
        }
      } else if (event.factor === undefined && // Disconnect when connection unauthenticated
        event.status === 2) this.disconnect(4000, 'Connection unauthenticated')
    })
    this.on('authenticate', event => {
      if (
        !this.#authenticationFactors[event.factor] ||
        !this.#authenticationFactors[event.factor][0] ||
        this.#authenticationFactors[event.factor][1] ||
        !CLIENT_AUTHENTICATION_FACTORS.includes(event.factor)
      ) return

      if (event.factor === 'passport') this.#passportChecker(event.passportInput)
    })

    if (this.isConnect) this.#emitConnected()
    this.#emitFirstAuthenticationFactorAsk()
  }

  /**
   * @summary Send message to client
   * @description
   * If each element of body is instanceof Buffer <br>
   * convert to Uint8Array then convert to pure array <br>
   * then send as {@link module:connections/connection~Uint8ArrayLike|Uint8ArrayLike} . <br>
   * This method create an array and push name and body to it like this <br>
   * `[name, [...body]]` <br>
   * and then serialize it to string and send to client
   *
   * @param {string} name Message's name
   * @param {...*} [body] Message's content
   * @param {function} [callback] This function listens to event with the same name just once
   *
   * @async
   * @return {Promise<(void|Error)>}
   * * Rejection
   *  * Reject an error if Connection is not authenticated
   *  * Reject an error if Connection is not connected
   */
  send (name, ...body) {
    const Error = makeClassLoggable(global.Error, logObject)
      .assignLogObject({ method: 'send', ...this[logSymbol] })

    if (typeof name !== 'string') throw new TypeError('name parameter is required and must be string')

    return (async () => {
      if (name !== 'authentication' &&
        !this.isAuthenticate) throw new Error('Connection is not authenticated')
      else if (!this.isConnect) throw new Error('Connection is not connected')

      let message = [ name, body ]
      let callback

      if (typeof body[body.length - 1] === 'function') callback = body.splice(body.length - 1, 1)[0]

      for (let dataIndex in body) {
        const data = body[dataIndex]

        if (data instanceof Buffer) body[dataIndex] = bufferToUint8ArrayLike(data)
        else if (data instanceof Uint8Array) body[dataIndex] = uint8ArrayToUint8ArrayLike(data)
      }

      message = JSON.stringify(message)

      if (this.#binary) message = Buffer.from(message)

      return (new Promise(resolve => this.#socket.send(message, undefined, resolve)))
        .then(() => {
          if (typeof callback === 'function') this.once(name, callback)
        })
    })()
  }

  /**
   * @summary Send message in binary type to client
   * @description Same as {@link module:connections/connection#send}
   *
   * @param {string} name Message's name
   * @param {...*} [body] Message's content
   * @param {function} [callback] This function listens to event with the same name just once
   *
   * @async
   * @return {Promise<(void|Error)>}
   *
   * @see module:connections/connection#send
   */
  sendBinary (name, ...body) {
    this.#binary = true

    const result = this.send(name, ...body)

    this.#binary = false

    return result
  }

  /**
   * Disconnect Connection
   *
   * @param {number} [code]
   * @param {string} [description]
   *
   * @emits module:connections/connection#event:disconnected
   *
   * @return {void}
   */
  disconnect (code, description) {
    if (code !== undefined &&
      typeof code !== 'number') throw new TypeError('code parameter must be number')
    else if (description !== undefined &&
      typeof description !== 'string') throw new TypeError('description parameter must be string')

    /**
     * @summary Connection disconnected event
     * @description
     * Same as {@link module:remote-controller-server-core~external:ws.WebSocket|ws.WebSocket} close event
     *
     * @event module:connections/connection#event:disconnected
     *
     * @see module:remote-controller-server-core~external:ws.WebSocket
     */
    if (this.#socket.readyState !== WebSocket.CLOSED ||
      this.#socket.readyState !== WebSocket.CLOSING) this.#socket.close(code, description)
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
    this.send(...EVENT_PROPS).catch(() => {})
    this.#emitAuthentication()
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

    return !!authenticated
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
  get isConnect () {
    return this.#socket.readyState === WebSocket.OPEN
  }

  /**
   * Connection id
   *
   * @type {number}
   */
  get id () {
    return this.#id
  }

  /**
   * @type {module:remote-controller-server-core~external:ws.WebSocket}
   */
  get socket () {
    return this.#socket
  }

  /**
   * @param socket
   *
   * @emits module:connections/connection#event:connected
   * @emits module:connections/connection#event:authentication
   */
  set socket (socket) {
    if (!(socket instanceof WebSocket)) throw new TypeError('Value must be ws.WebSocket')

    // Reset authentication factors
    for (const factorKey of CLIENT_AUTHENTICATION_FACTORS) {
      delete this.#authenticationFactors[factorKey][1]
    }

    this.#emitAuthentication.clearCache()

    // Replace emit method with our customized one
    socket.emit = this.#socket.emit

    // Change previous socket's emit method with it's default
    this.#socket.emit = AsyncEventEmitter.prototype.emit

    // Replace private properties
    this.#socket = socket
    this.#address = this.#socket.request.socket.remoteAddress

    if (this.isConnect) this.#emitConnected()
    this.#emitFirstAuthenticationFactorAsk()
    this.#emitAuthentication()
  }

  get [logSymbol] () {
    return {
      connection: {
        id: this.id,
        address: this.address,
        isConnect: this.isConnect,
        isAuthenticate: this.isAuthenticate
      }
    }
  }

  /**
   * Set preferred options for nodejs fs.createReadStream method
   *
   * * Read 1.0625 megabyte per chunk
   *
   * @param {object} [options={}]
   * @param {boolean} [overwrite=true] Write to the same object or create a new one
   *
   * @returns {Object}
   */
  static setReadStreamDefaults (options, overwrite = true) {
    if (typeof options !== 'object') options = {}

    let result

    // Byte Per Chunk
    const BPC = 1062500
    const DEFAULTS = {
      end: BPC,
      highWaterMark: BPC + 1,
      multiChunks: true
    }
    const optionsCache = Object.assign(Object.create(null), options)

    if (typeof optionsCache.end !== 'number') {
      DEFAULTS.end = (typeof optionsCache.start === 'number' ? optionsCache.start : 0) + BPC
    }

    if (typeof optionsCache.highWaterMark === 'number') optionsCache.highWaterMark++

    result = Object.assign(overwrite ? options : {}, DEFAULTS, optionsCache)

    if ((result.end - result.start) + 1 < result.highWaterMark) {
      result.highWaterMark = (result.end - result.start) + 1
    }

    return result
  }

  /**
   * A helper to read readable stream chunks
   *
   * @param {module:remote-controller-server-core~external:stream.Readable} readableStream
   * @param {boolean} [multiChunk=true]
   *
   * @returns {module:connections/connection~streamChunksReader}
   *
   * @example
   * let streamOptions = {@link module:connections/connection.setReadStreamDefaults|Connection.setReadStreamDefaults}({ end: 1062500 * 5 })
   * let readableStream = fs.createReadStream('Big.File', streamOptions)
   * ;(async function () {
   *    for await (const someChunks of {@link module:connections/connection.readStreamChunks|Connection.readStreamChunks}(readableStream, false)()) {
   *      await {@link module:connections/connection#send|connection.send}('bigFile', streamOptions, ...someChunks)
   *    }
   *  })()
   */
  static readStreamChunks (readableStream, multiChunk = true) {
    if (!(readableStream instanceof stream.Readable)) {
      throw new TypeError('readableStream parameter is required and must be stream.Readable')
    }

    /**
     * Resolve an array of chunks. <br>
     * * `{@link module:connections/connection.readStreamChunks|readStreamChunks}(multiChunk = true)`:
     * Resolve an array that contains **all** the chunks.
     * * `{@link module:connections/connection.readStreamChunks|readStreamChunks}(multiChunk = false)`:
     * Resolve an array that contains **one** chunk in every iteration.
     *
     * @name module:connections/connection~streamChunksReader
     * @generator
     * @async
     *
     * @returns {AsyncIterableIterator<Buffer[]>}
     */
    async function *streamChunksReader () {
      const chunks = []

      while (!readableStream.closed) {
        readableStream.resume()

        let closeListener
        let dataListener

        const chunk = await Promise.race([
          new Promise(resolve => readableStream.once('data', dataListener = data => { // eslint-disable-line no-return-assign
            readableStream.pause()

            resolve(data)
          })),
          new Promise(resolve => readableStream.once('close', closeListener = resolve)) // eslint-disable-line no-return-assign
        ])

        readableStream.off('data', dataListener)
        readableStream.off('close', closeListener)

        if (chunk) {
          if (multiChunk) chunks.push(chunk)
          else yield [ chunk ]
        }
      }

      if (multiChunk) yield chunks
    }

    return streamChunksReader
  }
}

// Set string tag
helpers.decorator.setStringTag()(Connection)

/**
 * Convert uint8Array to pure array then uint8ArrayLike
 *
 * @param {Uint8Array} uint8Array
 *
 * @returns {module:connections/connection~Uint8ArrayLike}
 */
export function uint8ArrayToUint8ArrayLike (uint8Array) {
  return ['Uint8Array', Array.from(uint8Array)]
}

/**
 * Convert buffer to uint8Array then uint8ArrayLike
 *
 * @param {Buffer} buffer
 *
 * @returns {module:connections/connection~Uint8ArrayLike}
 */
export function bufferToUint8ArrayLike (buffer) {
  const arrayBuffer = new ArrayBuffer(buffer.length)
  const uint8Array = new Uint8Array(arrayBuffer)

  for (let index = 0; index < buffer.length; index++) {
    uint8Array[index] = buffer[index]
  }

  return uint8ArrayToUint8ArrayLike(uint8Array)
}

/**
 * Convert uint8ArrayLike to buffer
 *
 * @param {module:connections/connection~Uint8ArrayLike} uint8ArrayLike
 *
 * @returns {Buffer}
 */
export function uint8ArrayLikeToBuffer (uint8ArrayLike) {
  return Buffer.from(Uint8Array.from(uint8ArrayLike[1]))
}

/**
 * Binary style use for send and receive <br>
 * `["Uint8Array", arrayFromUint8Array]`
 *
 * @typedef {array} module:connections/connection~Uint8ArrayLike
 * @property {string} 0 This element always is Uint8Array
 * @property {Array} 1 An array that contains uint8Array's data
 */

/**
 * Connection authentication status
 *
 * @event module:connections/connection#event:authentication
 *
 * @type {object}
 * @property {string} factor Authentication factor's name that it's state changed
 * @property {number} status
 * Authentication (factor) status
 *
 * | Value | Description |
 * | --- | --- |
 * | `0` | Ask for authentication factor |
 * | `1` | Allowed |
 * | `2` | Denied |
 *
 * @property {string} type
 * Depend on factor
 *
 * |  Factor  | Description |
 * | --- | --- |
 * |  `passport`  | Type of passport |
 */
