
/**
 * @module storages/storage
 */

import { promisify } from 'util'
import fs from 'fs'
import path from 'path'
import EventEmitter from 'events'

const ENCODING = 'utf8'
const GLOBAL_ERRORS = {
  accessibility: new Error('Storage is not accessible')
}

/**
 * Storage is a json file Manager
 *
 * @mixes module:remote-controller-server-core~external:EventEmitter
 */
export default class Storage extends EventEmitter {
  // Storage name
  #name
  /**
   * Storage json file address
   *
   * @type {(undefined|string)}
   */
  #address
  // Storage body
  #body

  /**
   * Initialize/Read json file
   *
   * @param {object} configs
   * @param {string} configs.name json file name
   * @param {object} configs.body json file initial content
   * @param {object} [configs.path=process.cwd()] json file initial content
   *
   * @throws Will throw an error if the requested storage's json file is not accessible
   * @throws Will throw an error if the body property provided but storage is already exist
   * @throws Will throw an error if the body property not provided and storage is not accessible
   */
  constructor (configs) {
    let initial = false
    let storageAccessible
    let storageAddress

    if (typeof configs !== 'object') throw new Error('configs parameter is required and must be object')

    super()

    // Set default configs
    configs = Object.assign({
      path: process.cwd()
    }, configs)

    if (typeof configs.name !== 'string') throw new Error('configs.name is required and must be string')
    else if (configs.body !== undefined && typeof configs.body !== 'object') throw new Error('configs.body must be object')
    else if (typeof configs.path !== 'string') throw new Error('configs.path must be string')

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
   * Remove storage json file
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
  remove (configs = { sync: true }) {
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
        throw GLOBAL_ERRORS.accessibility
      }

      fs.unlinkSync(this.#address)

      clearProperties()

      return
    }

    return promisify(fs.access)(this.#address, fs.constants.F_OK | fs.constants.W_OK)
      .then(() => {
        return promisify(fs.unlink)(this.#address)
          .then(clearProperties, error => Promise.reject(error))
      }, () => Promise.reject(GLOBAL_ERRORS.accessibility))
  }

  /**
   * Update storage content
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
  update (body, configs = { sync: true }) {
    if (typeof body === 'function') body = body(this.body)

    if (body === undefined || typeof body !== 'object') throw new Error('body parameter is required and must be object/function')

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
        throw GLOBAL_ERRORS.accessibility
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
      }, () => Promise.reject(GLOBAL_ERRORS.accessibility))
  }
}
