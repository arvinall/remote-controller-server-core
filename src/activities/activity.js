/* global global */

/**
 * @module activities/activity
 */

import EventEmitter from 'events'
import * as helpers from '../helpers'
import idGenerator from '../idGenerator'
import {
  makeClassLoggable,
  logSymbol
} from '../logger'
import Connection from '../connections/connection'
import Plugin from '../plugins/plugin'

// Error classes
const logObject = {
  scope: 'activity',
  class: 'Activity',
  event: undefined,
  module: undefined
}
const TypeError = makeClassLoggable(global.TypeError, logObject)
const Error = makeClassLoggable(global.Error, logObject)
const generateId = idGenerator()

/**
 * Activity is the connection between plugin instance and client connection
 *
 * @mixes module:remote-controller-server-core~external:EventEmitter
 */
export default class Activity extends EventEmitter {
  /**
   * @type {string}
   */
  #status
  /**
   * @type {string}
   */
  #id
  /**
   * @type {module:connections/connection}
   */
  #connection
  /**
   * @type {module:plugins/plugin} Actual Plugin class
   */
  #Plugin
  /**
   * @type {module:plugins/plugin} Plugin instance
   */
  #plugin

  /**
   * @param {object} configs
   * @param {module:connections/connection} configs.connection
   * @param {module:plugins/plugin} configs.Plugin Plugin extended class
   */
  constructor (configs) {
    if (typeof configs !== 'object') throw new TypeError('configs parameter is required and must be object')
    else if (!(configs.connection instanceof Connection)) throw new TypeError('configs.connection is required and must be Connection')
    else if (Object.getPrototypeOf(configs.Plugin) !== Plugin) throw new TypeError('configs.plugin is required and must be Plugin extended class')

    else if (!configs.connection.isConnect) throw new Error('Connection is not connect')
    else if (!configs.connection.isAuthenticate) throw new Error('Connection is not authenticate')

    super()

    this.#id = generateId()
    this.#connection = configs.connection
    this.#Plugin = configs.Plugin
    this.#plugin = new this.#Plugin({
      activityId: this.#id,
      activityConnection: configs.connection
    })

    this.on('init', () => (
      (this.#status = 'init') && this.plugin.emit('plugging')
    ))
    this.on('ready', () => (
      (this.#status = 'ready') && this.plugin.emit('plugged')
    ))
    this.on('cleanup', () => (
      (this.#status = 'cleanup') && this.plugin.emit('unplugging')
    ))
    this.on('close', () => (
      (this.#status = 'close') && this.plugin.emit('unplugged')
    ))
  }

  get id () {
    return this.#id
  }

  get connection () {
    return this.#connection
  }

  get plugin () {
    return this.#plugin
  }

  get status () {
    return this.#status
  }

  get [logSymbol] () {
    return {
      activity: {
        id: this.id,
        status: this.status,
        connection: this.connection[logSymbol],
        plugin: this.plugin[logSymbol]
      }
    }
  }
}

// Set string tag
helpers.decorator.setStringTag()(Activity)
