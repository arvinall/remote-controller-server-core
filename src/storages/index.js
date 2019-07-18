/* global global */

/**
 * @module storages
 */

import Storage from './storage'
import EventEmitter from 'events'
import {
  logSymbol,
  makeClassLoggable
} from '../logger'
import * as helpers from '../helpers'
import fs from 'fs'
import path from 'path'

/**
 * makeStorages creates storages module
 *
 * @param {object} [configs={}]
 * @param {string} [configs.path=process.cwd()] Storages path address
 *
 * @return {module:storages~Storages}
 */
export default function makeStorages (configs = Object.create(null)) {
  // Error classes
  const logObject = {
    scope: 'makeStorages',
    event: undefined,
    module: undefined
  }
  const Error = makeClassLoggable(global.Error, logObject)
  const TypeError = makeClassLoggable(global.TypeError, logObject)

  // Set default configs
  configs = Object.assign({
    path: path.join(process.cwd(), 'storage')
  }, configs)

  if (typeof configs.path !== 'string') throw new TypeError('configs.path must be string')

  try {
    fs.mkdirSync(configs.path, { recursive: true })
  } catch (error) {
    if (error.code !== 'EEXIST') throw error
  }

  const logger = this.logger

  logObject.module = 'storages'

  Error.setLogObject(logObject)
  TypeError.setLogObject(logObject)

  const STORAGES_GLOBAL_ERRORS = {
    accessibility: new Error('Storage is not accessible'),
    existence: name => new Error(`${name} is not exist in list`)
  }

  /**
   * Storages module is a Storage holder/manager
   *
   * @memberOf module:storages
   * @inner
   */
  class Storages extends EventEmitter {
    /**
     * @type {Object}
     */
    #storagesList = {}

    // JSDoc doesnt use this class without constructor :/
    constructor () { super() } // eslint-disable-line no-useless-constructor

    /**
     * @summary Storage updated event
     * @description Target Storage pass as first parameter, and event pass as second parameter
     *
     * @event module:storages~Storages#event:updated
     *
     * @type {module:storages/storage}
     *
     * @see module:storages/storage#event:updated
     */
    /**
     * @summary Storage removed event
     * @description Target Storage pass as first parameter, and event pass as second parameter
     *
     * @event module:storages~Storages#event:removed
     *
     * @type {module:storages/storage}
     *
     * @see module:storages/storage#event:removed
     */

    /**
     * Transfer event from storage instance to storages module
     *
     * @param {module:storages/storage} storage
     * @param {string} eventName
     *
     * @return {module:storages/storage}
     */
    #transferEvent = (storage, eventName) => storage
      .on(eventName, event => this.emit(eventName, storage, event))

    /**
     * Remove Storage from list and it's file
     *
     * @function remove
     * @memberOf module:storages~Storages
     * @inner
     *
     * @param {(string|module:storages/storage)} storage Storage or storage's name to remove
     * @param {object} [configs={}]
     * @param {boolean} [configs.sync=true] Async or sync
     *
     * @throws Will throw an error if Storage is not accessible
     * @throws Will throw an error if Storage is not exist in list
     *
     * @return {(void|Promise<(void|Error)>)} Return promise if configs.sync equal to false
     * * Rejection
     *  * Reject an error if Storage is not accessible
     *  * Reject an error if Storage is not exist in list
     */
    #remove = (storage, configs = Object.create(null)) => {
      if (storage === undefined ||
        (typeof storage !== 'string' &&
          !(storage instanceof Storage))) {
        throw new TypeError('storage parameter is required and must be string/Storage')
      }

      // Set default configs
      configs = Object.assign({
        sync: true
      }, configs)

      const name = storage.name || storage
      const deleteStorage = () => {
        delete this.#storagesList[name]
      }
      const ERRORS = {
        accessibility: STORAGES_GLOBAL_ERRORS.accessibility,
        existence: STORAGES_GLOBAL_ERRORS.existence(name)
      }

      storage = this.#storagesList[name]

      if (configs.sync) {
        if (typeof name !== 'string') throw ERRORS.accessibility.setLogObject({ method: '#remove' })
        if (storage === undefined) throw ERRORS.existence.setLogObject({ method: '#remove' })

        storage.removeSync()
        deleteStorage()

        return
      }

      if (typeof name !== 'string') {
        return Promise
          .reject(ERRORS.accessibility.setLogObject({ method: '#remove' }))
      }
      if (storage === undefined) {
        return Promise
          .reject(ERRORS.existence.setLogObject({ method: '#remove' }))
      }

      return storage.remove()
        .then(deleteStorage, error => Promise.reject(error))
    }

    /**
     * Get Storage instance via it's name
     *
     * @param {string} name Target storage's name
     *
     * @emits module:storages~Storages#event:updated
     * @emits module:storages~Storages#event:removed
     *
     * @listens module:storages/storage#event:updated
     * @listens module:storages/storage#event:removed
     *
     * @return {module:storages/storage}
     */
    get (name) {
      if (typeof name !== 'string') throw new TypeError('name parameter is required and must be string')

      // Return Storage from list if exist
      if (this.#storagesList.hasOwnProperty(name)) return this.#storagesList[name]

      this.#storagesList[name] = new Storage({
        name,
        path: configs.path
      })

      this.#transferEvent(this.#storagesList[name], 'updated')
      this.#transferEvent(this.#storagesList[name], 'removed')

      return this.#storagesList[name]
    }

    /**
     * Add/Initialize Storage
     *
     * @param {(module:storages/storage|string)} storage Storage instance or storage's name
     * @param {object} [body={}] Storage's initial content
     *
     * @emits module:storages~Storages#event:updated
     * @emits module:storages~Storages#event:removed
     * @emits module:storages~Storages#event:added
     *
     * @listens module:storages/storage#event:updated
     * @listens module:storages/storage#event:removed
     *
     * @throws Will throw an error if Storage is already exist in list
     *
     * @return {module:storages/storage}
     */
    add (storage, body = Object.create(null)) {
      const Error = makeClassLoggable(global.Error, logObject)
        .assignLogObject({ method: 'add', ...this[logSymbol] })

      if (!(storage instanceof Storage) &&
        typeof storage !== 'string') throw new TypeError('storage parameter is required and must be Storage/string')
      else if (typeof body !== 'object') throw new TypeError('body parameter must be object')

      let name = storage.name || storage

      if (!(storage instanceof Storage)) storage = undefined

      if (this.#storagesList.hasOwnProperty(name)) throw new Error(`${name} is already exist`)

      if (storage) {
        this.#storagesList[name] = storage
      } else {
        this.#storagesList[name] = storage = new Storage({
          name,
          body,
          path: configs.path
        })
      }

      this.#transferEvent(storage, 'updated')
      this.#transferEvent(storage, 'removed')

      /**
       * Storage added event
       *
       * @event module:storages~Storages#event:added
       *
       * @type module:storages/storage
       */
      this.emit('added', storage)

      return storage
    }

    /**
     * Same as {@link module:storages~Storages~remove|~remove}(storage, { sync: false })
     *
     * @param {(string|module:storages/storage)} storage
     *
     * @async
     *
     * @see module:storages~Storages~remove
     */
    remove (storage) {
      return this.#remove(storage, { sync: false })
    }

    /**
     * Same as {@link module:storages~Storages~remove|~remove}(storage)
     *
     * @param {(string|module:storages/storage)} storage
     *
     * @see module:storages~Storages~remove
     */
    removeSync (storage) {
      return this.#remove(storage)
    }

    /**
     * Check Storage is already exist
     *
     * @param {string} storageName Storage's name to check
     *
     * @return {boolean}
     */
    has (storageName) {
      return this.#storagesList.hasOwnProperty(storageName)
    }

    /**
     * Return storage's path
     *
     * @return {string}
     */
    get path () {
      return configs.path
    }

    get [logSymbol] () {
      return {
        storages: {
          path: this.path
        }
      }
    }
  }

  // Set string tag
  helpers.decorator.setStringTag()(Storages)

  const storages = new Storages()

  // Logging
  ;(() => {
    storages.on('added', storage => logger
      .info('makeStorages', {
        module: 'storages',
        event: 'added'
      }, storage, storages))

    storages.on('removed', (storage, { name }) => logger
      .info('makeStorages', {
        module: 'storages',
        event: 'removed'
      }, storage, { storage: { name } }, storages))

    storages.on('updated', storage => logger
      .info('makeStorages', {
        module: 'storages',
        event: 'updated'
      }, storage, storages))
  })()

  return storages
}

export Storage from './storage'
