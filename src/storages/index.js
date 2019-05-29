
/**
 * @module storages
 */

import Storage from './storage'

/**
 * makeStorages creates storages module
 *
 * @param {object} [configs={}]
 * @param {string} [configs.path=process.cwd()] Storages path address
 *
 * @return {module:storages~Storages}
 */
export default function makeStorages (configs = Object.create(null)) {
  // Set default configs
  configs = Object.assign({
    path: process.cwd()
  }, configs)

  if (typeof configs.path !== 'string') throw new Error('configs.path must be string')

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
  class Storages {
    /**
     * @type {Object}
     */
    #storagesList = {}

    // JSDoc doesnt use this class without constructor :/
    constructor () {} // eslint-disable-line no-useless-constructor

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
      if (storage === undefined || (typeof storage !== 'string' && !(storage instanceof Storage))) {
        throw new Error('storage parameter is required and must be string/Storage')
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
        if (typeof name !== 'string') throw ERRORS.accessibility
        if (storage === undefined) throw ERRORS.existence

        storage.removeSync()
        deleteStorage()

        return
      }

      if (typeof name !== 'string') return Promise.reject(ERRORS.accessibility)
      if (storage === undefined) return Promise.reject(ERRORS.existence)

      return storage.remove()
        .then(deleteStorage, error => Promise.reject(error))
    }

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
     * Add/Initialize Storage
     *
     * @param {(module:storages/storage|string)} storage Storage instance or storage's name
     * @param {object} [body={}] Storage's initial content
     *
     * @throws Will throw an error if Storage is already exist in list
     *
     * @return {module:storages/storage}
     */
    add (storage, body = Object.create(null)) {
      if (!(storage instanceof Storage) &&
        typeof storage !== 'string') throw new Error('storage parameter is required and must be Storage/string')
      else if (typeof body !== 'object') throw new Error('body parameter must be object')

      let name = storage.name || storage

      if (!(storage instanceof Storage)) storage = undefined

      if (this.#storagesList.hasOwnProperty(name)) throw new Error(`${name} is already exist`)

      if (storage) {
        this.#storagesList[name] = storage
      } else {
        this.#storagesList[name] = new Storage({
          name,
          body,
          path: configs.path
        })
      }

      return this.#storagesList[name]
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
  }

  return new Storages()
}

export Storage from './storage'
