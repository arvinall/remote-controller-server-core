
/**
 * @module preferences/preference
 */

import EventEmitter from 'events'
import Storage from '../storages/storage'

/**
 * Preference is a holder for modules preferences
 *
 * @mixes module:remote-controller-server-core~external:EventEmitter
 */
export default class Preference extends EventEmitter {
  /**
   * preferences storage
   *
   * @type {(undefined|module:storages/storage)}
   */
  #storage
  /**
   * Preference's name
   *
   * @type {(undefined|string)}
   */
  #name

  /**
   * Initialize/Read Preference
   *
   * @param {string} name Preference's name
   * @param {object} configs
   * @param {module:storages/storage} configs.storage Storage that use for preferences
   * @param {object} [configs.body={}] Preference's initial content
   */
  constructor (name, configs) {
    if (typeof name !== 'string') throw new Error('name parameter is required and must be string')
    else if (typeof configs !== 'object') throw new Error('configs parameter is required and must be object')

    // Set default configs
    configs = Object.assign({
      body: Object.create(null)
    }, configs)

    if (configs.storage.constructor.name !== Storage.name) throw new Error('configs.storage is required and must be Storage')
    else if (configs.storage.body === undefined) throw new Error('Storage is not accessible')
    else if (typeof configs.body !== 'object') throw new Error('configs.body must be object')

    super()

    this.#storage = configs.storage

    this.#name = name

    if (typeof this.#storage.body[this.#name] !== 'object') {
      this.#storage.update(body => {
        body[this.#name] = configs.body

        return body
      })
    }
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
   * Update Preference content
   *
   * @param {(object|function)} body Updated Preference body, if body is a function, a copy of last body passed to it, then have to return object as Preference body
   * @param {object} [configs={}]
   * @param {boolean} [configs.sync=true] Async or sync
   *
   * @throws Will throw an error if the Preference doesn't accessible
   *
   * @emits module:preferences/preference#event:updated
   *
   * @return {(void|Promise)} Return promise if configs.sync equal to false
   */
  update (body, configs = { sync: true }) {
    if (this.#storage === undefined) throw new Error('Preference is not accessible')

    if (typeof body === 'function') body = body(this.body)

    if (body === undefined || typeof body !== 'object') throw new Error('body parameter is required and must be object/function')

    const updateBody = storageBody => {
      storageBody[this.#name] = body

      return storageBody
    }

    const currentBody = this.body

    const fireEvent = () => {
      const EVENT = {
        lastBody: currentBody,
        updatedBody: this.body
      }

      /**
       * Preference updated event
       *
       * @event module:preferences/preference#event:updated
       *
       * @type {object}
       * @property {object} lastBody Preference's body before update
       * @property {object} updatedBody A copy of updated body object
       */
      this.emit('updated', EVENT)
    }

    if (configs.sync) {
      this.#storage.update(updateBody)

      fireEvent()

      return
    }

    return this.#storage.update(updateBody, { sync: false })
      .then(fireEvent, error => Promise.reject(error))
  }

  /**
   * Remove Preference object
   *
   * @param {object} [configs={}]
   * @param {boolean} [configs.sync=true] Async or sync
   *
   * @throws Will throw an error if the Preference doesn't accessible
   *
   * @emits module:preferences/preference#event:removed
   *
   * @return {(void|Promise)} Return promise if configs.sync equal to false
   */
  remove (configs = { sync: true }) {
    if (this.#storage === undefined) throw new Error('Preference is not accessible')

    const deletePreference = body => {
      delete body[this.name]

      return body
    }
    const clearProperties = () => {
      const EVENT = {
        name: this.name,
        body: this.#storage.body[this.name]
      }

      this.#storage = undefined
      this.#name = undefined

      /**
       * Preference removed event
       *
       * @event module:preferences/preference#event:removed
       *
       * @type {object}
       * @property {string} name Name of the removed Preference
       * @property {object} body Last body of the removed Preference
       */
      this.emit('removed', EVENT)
    }

    if (configs.sync) {
      this.#storage.update(deletePreference)

      clearProperties()

      return
    }

    return this.#storage.update(deletePreference, { sync: false })
      .then(clearProperties, error => Promise.reject(error))
  }
}