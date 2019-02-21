
/**
 * @module storages
 */

import Storage from './storage'

/**
 * storagesMaker creates storages module
 *
 * @param {object} [configs={}]
 * @param {string} [configs.path=process.cwd()] Storages path address
 *
 * @return {module:storages~Storages}
 */
export default function storagesMaker (configs = { path: process.cwd() }) {
  if (typeof configs.path !== 'string') throw new Error('configs.path must be string')

  /**
   * Storages module is a Storage holder/manager
   */
  class Storages {
    /**
     * A list that hold Storage classes
     *
     * @type {Object}
     */
    #storagesList = {}

    /**
     * Get Storage instance via it's name
     *
     * @param {string} name Target storage's name
     *
     * @return {module:storages/storage}
     */
    get (name) {
      if (typeof name !== 'string') throw new Error('name parameter is required and must be string')

      // Return Storage from list if exist
      if (this.#storagesList.hasOwnProperty(name)) return this.#storagesList[name]

      this.#storagesList[name] = new Storage({
        name,
        path: configs.path
      })

      return this.#storagesList[name]
    }

    /**
     * Initialize Storage
     *
     * @param {string} name Storage's name
     * @param {object} [body={}] Storage's initial content
     *
     * @throws Will throw an error if Storage is already exist in list
     *
     * @return {module:storages/storage}
     */
    initialize (name, body = Object.create(null)) {
      if (typeof name !== 'string') throw new Error('name parameter is required and must be string')
      else if (typeof body !== 'object') throw new Error('body parameter must be object')

      if (this.#storagesList.hasOwnProperty(name)) throw new Error(`${name} is already exist`)

      this.#storagesList[name] = new Storage({
        name,
        body,
        path: configs.path
      })

      return this.#storagesList[name]
    }

    /**
     * Remove Storage from list and it's file
     *
     * @param {(string|module:storages/storage)} storage Storage or storage's name to remove
     * @param {object} [configs={}]
     * @param {boolean} [configs.sync=true] Async or sync
     *
     * @throws Will throw error if storage is not accessible or not exist in list
     *
     * @return {(void|Promise)} Return promise if configs.sync equal to false
     */
    remove (storage, configs = { sync: true }) {
      if (storage === undefined || (typeof storage !== 'string' && !(storage instanceof Storage))) {
        throw new Error('storage parameter is required and must be string/Storage')
      }

      const name = storage.name || storage

      storage = this.#storagesList[name]

      const deleteStorage = () => {
        delete this.#storagesList[name]
      }

      const ERRORS = {
        accessibility: new Error(`storage is not accessible`),
        existence: new Error(`${name} is not exist in list`)
      }

      if (configs.sync) {
        if (typeof name !== 'string') throw ERRORS.accessibility
        if (storage === undefined) throw ERRORS.existence

        storage.remove()

        deleteStorage()

        return
      }

      return new Promise((resolve, reject) => {
        if (typeof name !== 'string') reject(ERRORS.accessibility)
        if (storage === undefined) reject(ERRORS.existence)

        resolve(storage.remove({ sync: false })
          .then(deleteStorage, error => Promise.reject(error)))
      })
    }

    /**
     * Check Storage is already exist
     *
     * @param {string} storageName Storage's name to check
     *
     * @return {boolean}
     */
    has (storageName) {
      if (typeof storageName !== 'string') throw new Error('storageName parameter is required and must be string')

      return this.#storagesList.hasOwnProperty(storageName)
    }

    /**
     * Return storage's path
     *
     * @return {string}
     */
    get _path () {
      return configs.path
    }
  }

  return new Storages()
}
