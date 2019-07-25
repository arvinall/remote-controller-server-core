/* global global */

/**
 * @module plugins/pluginStorages
 */

import EventEmitter from 'events'
import {
  logSymbol,
  makeClassLoggable
} from '../logger'
import * as helpers from '../helpers'
import Storage from '../storages/storage'

// Error classes
const logObject = {
  scope: 'pluginStorages',
  class: 'PluginStorages',
  event: undefined,
  module: undefined
}
const TypeError = makeClassLoggable(global.TypeError, logObject)

/**
 * Create a wrapper around storages module to use in plugins
 *
 * @mixes module:remote-controller-server-core~external:EventEmitter
 *
 * @see module:storages~Storages
 */
export default class PluginStorages extends EventEmitter {
  /**
   * @type {string}
   */
  #name
  /**
   * @type {module:storages~Storages}
   */
  #storages

  /**
   * Storage added event
   *
   * @event module:plugins/pluginStorages#event:added
   *
   * @type module:storages/storage
   *
   * @see module:storages~Storages#event:added
   */
  /**
   * @summary Storage removed event
   * @description Target Storage pass as first parameter, and event pass as second parameter
   *
   * @event module:plugins/pluginStorages#event:removed
   *
   * @type {module:storages/storage}
   *
   * @see module:storages~Storages#event:removed
   */
  /**
   * @summary Storage updated event
   * @description Target Storage pass as first parameter, and event pass as second parameter
   *
   * @event module:plugins/pluginStorages#event:updated
   *
   * @type {module:storages/storage}
   *
   * @see module:storages~Storages#event:updated
   */

  /**
   * @param {object} configs
   * @param {string} configs.name Name that use for create Storage instance
   * @param {module:storages~Storages} configs.storages
   *
   * @emits module:plugins/pluginStorages#event:added
   * @emits module:plugins/pluginStorages#event:removed
   * @emits module:plugins/pluginStorages#event:updated
   *
   * @listens module:storages~Storages#event:added
   * @listens module:storages~Storages#event:removed
   * @listens module:storages~Storages#event:updated
   */
  constructor (configs) {
    if (typeof configs !== 'object') throw new TypeError('configs parameter is required and must be object')
    else if (typeof configs.name !== 'string') throw new TypeError('configs.name is required and must be string')
    else if (!(configs.storages instanceof Object)) throw new TypeError('configs.storages is required and must be Storages')

    super()

    this.#name = configs.name
    this.#storages = configs.storages

    // Transfer events
    const events = [ 'added', 'removed', 'updated' ]

    for (const event of events) {
      this.#storages.on(event, (...parameters) => {
        const [ storage, additional ] = parameters
        const name = storage.name || additional.name

        if (name.startsWith(this.#name + NAME_SEPARATOR)) {
          this.emit(event, ...parameters)
        }
      })
    }
  }

  /**
   * Get Storage instance via it's name
   *
   * @param {string} name Target storage's name
   *
   * @return {module:storages/storage}
   *
   * @see module:storages~Storages#get
   */
  get (name) {
    if (typeof name !== 'string') throw new TypeError('name parameter is required and must be string')

    return this.#storages.get(this.#name + NAME_SEPARATOR + name)
  }

  /**
   * Add/Initialize Storage
   *
   * @param {string} name
   * @param {object} [body={}] Storage's initial content
   *
   * @return {module:storages/storage}
   *
   * @see module:storages~Storages#add
   */
  add (name, body = Object.create(null)) {
    if (typeof name !== 'string') throw new TypeError('name parameter is required and must be string')

    return this.#storages.add(this.#name + NAME_SEPARATOR + name, body)
  }

  /**
   * Remove Storage from list and it's file
   *
   * @param {(string|module:storages/storage)} storage
   *
   * @async
   *
   * @see module:storages~Storages#remove
   */
  remove (storage) {
    if (storage === undefined ||
      (typeof storage !== 'string' &&
        !(storage instanceof Storage))) throw new TypeError('storage parameter is required and must be string/Storage')

    if (typeof storage === 'string') storage = this.#name + NAME_SEPARATOR + storage

    return this.#storages.remove(storage)
  }

  /**
   * Remove Storage from list and it's file
   *
   * @param {(string|module:storages/storage)} storage
   *
   * @see module:storages~Storages#removeSync
   */
  removeSync (storage) {
    if (storage === undefined ||
      (typeof storage !== 'string' &&
        !(storage instanceof Storage))) throw new TypeError('storage parameter is required and must be string/Storage')

    if (typeof storage === 'string') storage = this.#name + NAME_SEPARATOR + storage

    return this.#storages.removeSync(storage)
  }

  /**
   * Check Storage is already exist
   *
   * @param {string} name Storage's name to check
   *
   * @return {boolean}
   *
   * @see module:storages~Storages#has
   */
  has (name) {
    return this.#storages.has(this.#name + NAME_SEPARATOR + name)
  }

  /**
   * Return storage's path
   *
   * @return {string}
   *
   * @see module:storages~Storages#path
   */
  get path () {
    return this.#storages.path
  }

  get [logSymbol] () {
    return this.#storages[logSymbol]
  }
}

// Set string tag
helpers.decorator.setStringTag()(PluginStorages)

export const NAME_SEPARATOR = '.'
