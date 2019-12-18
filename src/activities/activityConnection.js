/* global global */

/**
 * @module activities/activityConnection
 */

import EventEmitter from 'events'
import {
  logSymbol,
  makeClassLoggable
} from '../logger'
import * as helpers from '../helpers'
import Connection from '../connections/connection'
import Activity from '../activities/activity'

// Error classes
const logObject = {
  scope: 'activityConnection',
  class: 'ActivityConnection',
  event: undefined,
  module: undefined
}
const TypeError = makeClassLoggable(global.TypeError, logObject)

/**
 * Create a wrapper around connection module to use in activity
 *
 * @mixes module:remote-controller-server-core~external:EventEmitter
 *
 * @see module:connections/connection
 */
export default class ActivityConnection extends EventEmitter {
  /**
   * @type {module:activities/activity}
   */
  #activity
  /**
   * @type {connections/connection}
   */
  #connection

  /**
   * @param {object} configs
   * @param {module:activities/activity} configs.activity Activity that use for create Connection instance
   * @param {module:connections/connection} configs.connection
   */
  constructor (configs) {
    if (typeof configs !== 'object') throw new TypeError('configs parameter is required and must be object')
    else if (!(configs.activity instanceof Activity)) throw new TypeError('configs.activity is required and must be Activity')
    else if (!(configs.connection instanceof Connection)) throw new TypeError('configs.connection is required and must be Connection')

    super()

    this.#activity = configs.activity
    this.#connection = configs.connection

    const eventEmitterMethods = [
      'emit',
      'addListener',
      'on',
      'prependListener',
      'once',
      'prependOnceListener',
      'removeListener',
      'off',
      'removeAllListeners',
      'listeners',
      'rawListeners',
      'listenerCount'
    ]
    const prototype = Object.getPrototypeOf(this)

    // Transfer events with activity id
    for (const methodName of eventEmitterMethods) {
      prototype[methodName] = function (type, ...parameters) {
        return configs.connection[methodName](configs.activity.id + ID_SEPARATOR + type, ...parameters)
      }
    }
  }

  /**
   * Send message to client's activity
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
   *
   *  @see module:connections/connection#send
   */
  send (name, ...body) {
    if (typeof name !== 'string' ||
      name === '') throw new TypeError('name parameter is required and must be string')

    name = this.#activity.id + ID_SEPARATOR + name

    return this.#connection.send(name, ...body)
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
   * @see module:connections/connection#sendBinary
   */
  sendBinary (name, ...body) {
    if (typeof name !== 'string' ||
      name === '') throw new TypeError('name parameter is required and must be string')

    name = this.#activity.id + ID_SEPARATOR + name

    return this.#connection.sendBinary(name, ...body)
  }

  /**
   * Get Client IP
   *
   * @type {string}
   *
   * @see module:connections/connection#address
   */
  get address () {
    return this.#connection.address
  }

  get [logSymbol] () {
    return {
      ...this.#connection[logSymbol],
      ...this.#activity[logSymbol]
    }
  }
}

// Set string tag
helpers.decorator.setStringTag()(ActivityConnection)

export const ID_SEPARATOR = ':'
