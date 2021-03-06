/* global global */

/**
 * @module storages/storage
 */

import { promisify } from 'util'
import fs from 'fs'
import path from 'path'
import EventEmitter from 'events'
import {
  logSymbol,
  makeClassLoggable
} from '../logger'
import * as helpers from '../helpers'

const ENCODING = 'utf8'

// Error classes
const logObject = {
  scope: 'storage',
  class: 'Storage',
  event: undefined,
  module: undefined
}
const Error = makeClassLoggable(global.Error, logObject)
const TypeError = makeClassLoggable(global.TypeError, logObject)

const GLOBAL_ERRORS = {
  accessibility: new Error('Storage is not accessible')
}

/**
 * Storage is a json file Manager
 *
 * @mixes module:remote-controller-server-core~external:EventEmitter
 */
export default class Storage extends EventEmitter {
  /**
   * @type {string}
   */
  #name
  /**
   * @type {string}
   */
  #address
  /**
   * @type {object}
   */
  #body

  /**
   * Remove storage json file
   *
   * @function remove
   * @memberOf module:storages/storage
   * @inner
   *
   * @param {object} [configs={}]
   * @param {boolean} [configs.sync=true] Async or sync
   *
   * @throws Will throw an error if the storage's json file doesn't accessible
   *
   * @emits module:storages/storage#event:removed
   *
   * @return {(void|Promise<(void|Error)>)} Return promise if configs.sync equal to false
   * * Rejection
   *  * Reject an error if the storage's json file doesn't accessible
   */
  #remove = (configs = Object.create(null)) => {
    // Set default configs
    configs = Object.assign({
      sync: true
    }, configs)

    const clearProperties = () => {
      const EVENT = {
        name: this.#name,
        body: this.#body
      }

      this.#body = undefined
      this.#name = undefined

      /**
       * Storage removed event
       *
       * @event module:storages/storage#event:removed
       *
       * @type {object}
       * @property {string} name Name of the removed storage
       * @property {object} body Last body of the removed storage
       */
      this.emit('removed', EVENT)
    }

    if (configs.sync) {
      try {
        fs.accessSync(this.#address, fs.constants.F_OK | fs.constants.W_OK)
      } catch (error) {
        throw GLOBAL_ERRORS.accessibility.setLogObject({ method: '#remove' })
      }

      fs.unlinkSync(this.#address)

      clearProperties()

      return
    }

    return promisify(fs.access)(this.#address, fs.constants.F_OK | fs.constants.W_OK)
      .then(() => {
        return promisify(fs.unlink)(this.#address)
          .then(clearProperties, error => Promise.reject(error))
      }, () => Promise
        .reject(GLOBAL_ERRORS.accessibility.setLogObject({ method: '#remove' })))
  }

  /**
   * Update storage content
   *
   * @function update
   * @memberOf module:storages/storage
   * @inner
   *
   * @param {(object|function)} body Updated Storage body, if body is a function, a copy of last body passed to it, then have to return object as storage body
   * @param {object} [configs={}]
   * @param {boolean} [configs.sync=true] Async or sync
   *
   * @throws Will throw an error if the storage's json file doesn't accessible
   *
   * @emits module:storages/storage#event:updated
   *
   * @return {(void|Promise<(void|Error)>)} Return promise if configs.sync equal to false
   * * Rejection
   *  * Reject an error if the storage's json file doesn't accessible
   */
  #update = (body, configs = Object.create(null)) => {
    if (typeof body === 'function') body = body(this.body)

    // Set default configs
    configs = Object.assign({
      sync: true
    }, configs)

    if (body === undefined ||
      typeof body !== 'object') throw new TypeError('body parameter is required and must be object/function')

    const setProperties = () => {
      const EVENT = {
        lastBody: this.#body,
        updatedBody: JSON.parse(JSON.stringify(body))
      }

      this.#body = body

      /**
       * Storage updated event
       *
       * @event module:storages/storage#event:updated
       *
       * @type {object}
       * @property {object} lastBody storage's body before update
       * @property {object} updatedBody A copy of updated body object
       */
      this.emit('updated', EVENT)
    }

    if (configs.sync) {
      try {
        fs.accessSync(this.#address, fs.constants.F_OK | fs.constants.W_OK)
      } catch (error) {
        throw GLOBAL_ERRORS.accessibility.setLogObject({ method: '#update' })
      }

      fs.writeFileSync(this.#address, JSON.stringify(body), {
        encoding: ENCODING,
        flag: 'w'
      })

      setProperties()

      return
    }

    return promisify(fs.access)(this.#address, fs.constants.F_OK | fs.constants.W_OK)
      .then(() => {
        return promisify(fs.writeFile)(this.#address, JSON.stringify(body), {
          encoding: ENCODING,
          flag: 'w'
        }).then(setProperties, error => Promise.reject(error))
      }, () => Promise
        .reject(GLOBAL_ERRORS.accessibility.setLogObject({ method: '#update' })))
  }

  /**
   * Initialize/Read json file
   *
   * @param {object} configs
   * @param {string} configs.name json file name
   * @param {object} [configs.body] json file initial content
   * @param {object} [configs.path=process.cwd()] json file initial content
   *
   * @throws Will throw an error if the requested storage's json file is not accessible
   * @throws Will throw an error if the body property provided but storage is already exist
   * @throws Will throw an error if the body property not provided and storage is not accessible
   */
  constructor (configs) {
    const Error = makeClassLoggable(global.Error, logObject)
      .assignLogObject({ method: 'constructor' })

    if (typeof configs !== 'object') throw new TypeError('configs parameter is required and must be object')

    // Set default configs
    configs = Object.assign({
      path: process.cwd()
    }, configs)

    if (typeof configs.name !== 'string') throw new TypeError('configs.name is required and must be string')
    else if (configs.body !== undefined &&
      typeof configs.body !== 'object') throw new TypeError('configs.body must be object')
    else if (typeof configs.path !== 'string') throw new TypeError('configs.path must be string')

    super()

    let initial = false
    let storageAccessible
    let storageAddress

    // Mark as must initial if configs.body property is defined
    if (configs.body !== undefined) initial = true

    storageAddress = path.join(configs.path, configs.name + '.json')

    // Check storage accessibility
    try {
      fs.accessSync(storageAddress, fs.constants.F_OK | fs.constants.W_OK)
      storageAccessible = true
    } catch (error) {
      storageAccessible = false
    }

    if (initial) {
      if (storageAccessible) throw new Error(`${configs.name} is already exist`)

      fs.writeFileSync(storageAddress, JSON.stringify(configs.body), {
        encoding: ENCODING,
        flag: 'w'
      })

      // Take a copy of body
      this.#body = JSON.parse(JSON.stringify(configs.body))
    } else {
      if (!storageAccessible) throw new Error(`${configs.name} is not accessible`)

      // Read storage and convert it to object
      this.#body = JSON.parse(fs
        .readFileSync(storageAddress, {
          encoding: ENCODING,
          flag: 'r'
        }))
    }

    this.#name = configs.name
    this.#address = storageAddress
  }

  /**
   * Storage's content object
   *
   * @type {object}
   */
  get body () {
    return this.#body ? JSON.parse(JSON.stringify(this.#body)) : undefined
  }

  /**
   * Storage's name
   *
   * @type {string}
   */
  get name () {
    return this.#name
  }

  /**
   * Same as {@link module:storages/storage~remove|~remove}({ sync: false })
   *
   * @async
   *
   * @see module:storages/storage~remove
   */
  remove () {
    return this.#remove({ sync: false })
  }

  /**
   * Same as {@link module:storages/storage~remove|~remove}()
   *
   * @see module:storages/storage~remove
   */
  removeSync () {
    return this.#remove()
  }

  /**
   * Same as {@link module:storages/storage~update|~update}(body, { sync: false })
   *
   * @param {(object|function)} body
   *
   * @async
   *
   * @see module:storages/storage~update
   */
  update (body) {
    return this.#update(body, { sync: false })
  }

  /**
   * Same as {@link module:storages/storage~update|~update}(body)
   *
   * @param {(object|function)} body
   *
   * @see module:storages/storage~update
   */
  updateSync (body) {
    return this.#update(body)
  }

  get [logSymbol] () {
    return {
      storage: {
        name: this.name,
        address: this.#address
      }
    }
  }
}

// Set string tag
helpers.decorator.setStringTag()(Storage)
