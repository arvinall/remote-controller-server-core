/* global global */

/**
 * @module activities/activity
 */

import EventEmitter from 'events'
import * as helpers from '../helpers'
import idGenerator from '../idGenerator'
import { makeClassLoggable } from '../logger'
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

  #init = function activityOnReady () {
    return this.plugin.emit('plugging')
  }
  #ready = function activityOnReady () {
    return this.plugin.emit('plugged')
  }
  #cleanup = function activityOnCleanup () {
    return this.plugin.emit('unplugging')
  }
  #close = function activityOnClose () {
    return this.plugin.emit('unplugged')
  }

  /**
   * Transfer events
   *
   * @param {object} configs
   * @param {module:connections/connection} configs.connection
   * @param {module:plugins/plugin} configs.Plugin Plugin extended class
   */
  constructor (configs) {
    if (typeof configs !== 'object') throw new TypeError('configs parameter is required and must be object')
    else if (!(configs.connection instanceof Connection)) throw new TypeError('configs.connection is required and must be Connection')
    else if (Object.getPrototypeOf(configs.Plugin) !== Plugin) throw new TypeError('configs.plugin is required and must be Plugin extended class')

    else if (!configs.connection.isConnect) throw new Error('connection is not connect')
    else if (!configs.connection.isAuthenticate) throw new Error('connection is not authenticate')

    super()

    this.#id = generateId()
    this.#connection = configs.connection
    this.#Plugin = configs.Plugin
    this.#plugin = new this.#Plugin({
      activityId: this.#id,
      activityConnection: configs.connection
    })

    this.once('init', () => (
      (this.#status = 'init') && this.#init()
    ))
    this.once('ready', () => (
      (this.#status = 'ready') && this.#ready()
    ))
    this.once('cleanup', () => (
      (this.#status = 'cleanup') && this.#cleanup()
    ))
    this.once('close', () => (
      (this.#status = 'close') && this.#close()
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
}

// Set string tag
helpers.decorator.setStringTag()(Activity)
