
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

  const STORAGES_GLOBAL_ERRORS = {
    accessibility: new Error('Storage is not accessible'),
    existence: name => new Error(`${name} is not exist in list`)
  }

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
      else if (this.#storagesList.hasOwnProperty(name)) throw new Error(`${name} is already exist`)

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
     * @throws Will throw an error if Storage is not accessible
     * @throws Will throw an error if Storage is not exist in list
     *
     * @return {(void|Promise<(void|Error)>)} Return promise if configs.sync equal to false
     * * Rejection
     *  * Reject an error if Storage is not accessible
     *  * Reject an error if Storage is not exist in list
     */
    remove (storage, configs = { sync: true }) {
      if (storage === undefined || (typeof storage !== 'string' && !(storage instanceof Storage))) {
        throw new Error('storage parameter is required and must be string/Storage')
      }

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
        if (typeof name !== 'string') throw ERRORS.accessibility
        if (storage === undefined) throw ERRORS.existence

        storage.remove()
        deleteStorage()

        return
      }

      if (typeof name !== 'string') return Promise.reject(ERRORS.accessibility)
      if (storage === undefined) return Promise.reject(ERRORS.existence)

      return storage.remove({ sync: false })
        .then(deleteStorage, error => Promise.reject(error))
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
  }

  return new Storages()
}

export Storage from './storage'
