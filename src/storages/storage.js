
/**
 * @module storages/storage
 */

import { promisify } from 'util'
import fs from 'fs'
import path from 'path'
import EventEmitter from 'events'

const ENCODING = 'utf8'

/**
 * Storage is a json file Manager
 */
export default class Storage extends EventEmitter {
  // Storage name
  #name
  // Storage json file address
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
   * @throws Will throw an error if the requested storage's json file doesn't accessible
   */
  constructor (configs) {
    let initial = false
    let storageAccessible
    let storageAddress

    if (configs === undefined) throw new Error('configs parameter is require')

    super()

    if (configs.path === undefined) configs.path = process.cwd()

    if (typeof configs.name !== 'string') throw new Error('configs.name is required and must be string')
    else if (configs.body !== undefined && typeof configs.body !== 'object') throw new Error('configs.body must be object')
    else if (typeof configs.path !== 'string') throw new Error('configs.path must be string')

    // Mark as must initial if configs.body property is defined
    if (configs.body !== undefined) initial = true

    /**
     * Address of the storage json file
     *
     * @type {string}
     */
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

      this.#body = configs.body
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
   * Take a copy from Storage body
   *
   * @return {object} Storage content object
   */
  get body () {
    return this.#body ? JSON.parse(JSON.stringify(this.#body)) : undefined
  }

  /**
   * Take a copy from Storage name
   *
   * @return {string} Storage name
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
   * @return {(void|Promise)} Return promise if configs.sync equal to false
   */
  remove (configs = Object.create(null)) {
    const {
      sync = true
    } = configs

    const clearProperties = () => {
      this.#body = undefined
      this.#name = undefined
    }

    if (sync) {
      try {
        fs.accessSync(this.#address, fs.constants.F_OK | fs.constants.W_OK)
      } catch (error) {
        throw new Error('Storage is not accessible')
      }

      fs.unlinkSync(this.#address)

      clearProperties()

      return
    }

    return promisify(fs.access)(this.#address, fs.constants.F_OK | fs.constants.W_OK)
      .then(() => {
        return promisify(fs.unlink)(this.#address)
          .then(clearProperties, error => Promise.reject(error))
      }, () => Promise.reject(new Error('Storage is not accessible')))
  }

  /**
   * Update storage content
   *
   * @param {object} body Updated Storage body
   * @param {object} [configs={}]
   * @param {boolean} [configs.sync=true] Async or sync
   *
   * @throws Will throw an error if the storage's json file doesn't accessible
   *
   * @return {(void|Promise)} Return promise if configs.sync equal to false
   */
  update (body, configs = Object.create(null)) {
    const {
      sync = true
    } = configs

    if (body === undefined || (typeof body !== 'object' && typeof body !== 'function')) {
      throw new Error('body parameter is required and must be object/function')
    }

    if (typeof body === 'function') body = body(this.body)

    const setProperties = () => {
      this.#body = body
    }

    if (sync) {
      try {
        fs.accessSync(this.#address, fs.constants.F_OK | fs.constants.W_OK)
      } catch (error) {
        throw new Error('Storage is not accessible')
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
      }, () => Promise.reject(new Error('Storage is not accessible')))
  }
}
