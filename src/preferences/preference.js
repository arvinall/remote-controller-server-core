
/**
 * @module preferences/preference
 */

import EventEmitter from 'events'
import Storage from '../storages/storage'

const GLOBAL_ERRORS = {
  accessibility: new Error('Preference is not accessible')
}

/**
 * Preference is a holder for modules preferences
 *
 * @mixes module:remote-controller-server-core~external:EventEmitter
 */
export default class Preference extends EventEmitter {
  /**
   * preferences storage
   *
   * @type {module:storages/storage}
   */
  #storage
  /**
   * Preference's name
   *
   * @type {string}
   */
  #name

  /**
   * Update Preference content
   *
   * @function update
   * @memberOf module:preferences/preference
   * @inner
   *
   * @param {(object|function)} body Updated Preference body, if body is a function, a copy of last body passed to it, then have to return object as Preference body
   * @param {object} [configs={}]
   * @param {boolean} [configs.sync=true] Async or sync
   *
   * @throws Will throw an error if the Preference is not accessible
   *
   * @emits module:preferences/preference#event:updated
   *
   * @return {(void|Promise<(void|Error)>)} Return promise if configs.sync equal to false
   * * Rejection
   *  * Reject an error if the Preference is not accessible
   */
  #update = (body, configs = Object.create(null)) => {
    // Make body object from function
    if (typeof body === 'function') body = body(this.body)

    if (typeof body !== 'object') throw new Error('body parameter is required and must be object/function')

    // Set default configs
    configs = Object.assign({
      sync: true
    }, configs)

    const updateBody = storageBody => {
      storageBody[this.#name] = body

      return storageBody
    }
    const currentBody = this.body
    /**
     * Preference updated event
     *
     * @event module:preferences/preference#event:updated
     *
     * @type {object}
     * @property {object} lastBody Preference's body before update
     * @property {object} updatedBody A copy of updated body object
     */
    const fireEvent = () => {
      const EVENT = {
        lastBody: currentBody,
        updatedBody: this.body
      }

      this.emit('updated', EVENT)
    }

    if (configs.sync) {
      if (this.#storage === undefined) throw GLOBAL_ERRORS.accessibility

      this.#storage.updateSync(updateBody)

      fireEvent()

      return
    }

    if (this.#storage === undefined) return Promise.reject(GLOBAL_ERRORS.accessibility)

    return this.#storage.update(updateBody)
      .then(fireEvent, error => Promise.reject(error))
  }

  /**
   * Remove Preference object
   *
   * @function remove
   * @memberOf module:preferences/preference
   * @inner
   *
   * @param {object} [configs={}]
   * @param {boolean} [configs.sync=true] Async or sync
   *
   * @throws Will throw an error if the Preference is not accessible
   *
   * @emits module:preferences/preference#event:removed
   *
   * @return {(void|Promise<(void|Error)>)} Return promise if configs.sync equal to false
   * * Rejection
   *  * Reject an error if the Preference is not accessible
   */
  #remove = (configs = Object.create(null)) => {
    const lastBody = this.body
    const deletePreference = body => {
      delete body[this.name]

      return body
    }
    /**
     * Preference removed event
     *
     * @event module:preferences/preference#event:removed
     *
     * @type {object}
     * @property {string} name Name of the removed Preference
     * @property {object} body Last body of the removed Preference
     */
    const clearProperties = () => {
      const EVENT = {
        name: this.name,
        body: lastBody
      }

      this.#storage = undefined
      this.#name = undefined

      this.emit('removed', EVENT)
    }

    // Set default configs
    configs = Object.assign({
      sync: true
    }, configs)

    if (configs.sync) {
      if (this.#storage === undefined) throw GLOBAL_ERRORS.accessibility

      this.#storage.updateSync(deletePreference)

      clearProperties()

      return
    }

    if (this.#storage === undefined) return Promise.reject(GLOBAL_ERRORS.accessibility)

    return this.#storage.update(deletePreference)
      .then(clearProperties, error => Promise.reject(error))
  }

  /**
   * Initialize/Read Preference
   *
   * @param {object} configs
   * @param {string} configs.name Preference's name
   * @param {module:storages/storage} configs.storage Storage that use for preferences
   * @param {object} [configs.body] Preference's initial content
   *
   * @throws Will throw an error if the storage is not accessible
   * @throws Will throw an error if the body property provided but storage is already exist
   * @throws Will throw an error if the body property not provided and storage is not accessible
   */
  constructor (configs) {
    let initial = false

    if (typeof configs !== 'object') throw new Error('configs parameter is required and must be object')
    else if (typeof configs.name !== 'string') throw new Error('configs.name is required and must be string')
    else if (configs.storage === undefined || !(configs.storage instanceof Storage)) throw new Error('configs.storage is required and must be Storage')
    else if (configs.storage.body === undefined) throw new Error('Storage is not accessible')
    else if (configs.body !== undefined && typeof configs.body !== 'object') throw new Error('configs.body must be object')

    super()

    this.#storage = configs.storage
    this.#name = configs.name

    if (configs.body) initial = true

    if (initial) {
      if (typeof this.#storage.body[this.#name] === 'object') throw new Error(`${this.#name} is already exist`)

      this.#storage.update(body => {
        body[this.#name] = configs.body

        return body
      })
    } else if (typeof this.#storage.body[this.#name] !== 'object') throw new Error(`${this.#name} is not accessible`)
  }

  /**
   * Preference's name
   *
   * @type {string}
   */
  get name () {
    return this.#name
  }

  /**
   * Copy of Preference's body object
   *
   * @type {string}
   */
  get body () {
    if (this.#storage && this.#storage.body && this.#storage.body[this.#name]) {
      return JSON.parse(JSON.stringify(this.#storage.body[this.#name]))
    }
  }

  /**
   * Same as {@link module:preferences/preference~remove|~remove}({ sync: false })
   *
   * @see module:preferences/preference~remove
   */
  async remove () {
    return this.#remove({ sync: false })
  }

  /**
   * Same as {@link module:preferences/preference~remove|~remove}()
   *
   * @see module:preferences/preference~remove
   */
  removeSync () {
    return this.#remove()
  }

  /**
   * Same as {@link module:preferences/preference~update|~update}(body, { sync: false })
   *
   * @param {(object|function)} body
   *
   * @see module:preferences/preference~update
   */
  async update (body) {
    return this.#update(body, { sync: false })
  }

  /**
   * Same as {@link module:preferences/preference~update|~update}(body)
   *
   * @param {(object|function)} body
   *
   * @see module:preferences/preference~update
   */
  updateSync (body) {
    return this.#update(body)
  }
}
