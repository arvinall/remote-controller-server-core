
/**
 * @module preferences
 */

import EventEmitter from 'events'
import Preference from './preference'

/**
 * preferencesMaker creates preferences module
 *
 * @param {object} configs
 * @param {module:storages~Storages} configs.storages storages module for storing Preferences
 * @param {string} [configs.name='preferences'] Preferences's Storage name
 *
 * @throws Will throw an error if Preferences file is already in use
 *
 * @return {module:preferences~Preferences}
 */
export default function preferencesMaker (configs) {
  if (typeof configs !== 'object') throw new Error('configs parameter is required and must be object')
  else if (typeof configs.storages !== 'object' || typeof configs.storages.initialize !== 'function') throw new Error('configs.storages is required and must be storages')

  // Set default configs
  configs = Object.assign({
    name: 'preferences'
  }, configs)

  if (typeof configs.name !== 'string') throw new Error('configs.name is required and must be string')
  else if (configs.storages.has(configs.name)) throw new Error(`${configs.name} is already in use`)

  const PREFERENCES_GLOBAL_ERRORS = {
    accessibility: new Error(`Preference is not accessible`),
    existence: name => new Error(`${name} is not exist in list`)
  }
  const preferencesStorage = (() => {
    try {
      return configs.storages.get(configs.name)
    } catch (error) {
      return configs.storages.initialize(configs.name)
    }
  })()

  /**
   * Preferences module is a Preference holder/manager
   *
   * @mixes module:remote-controller-server-core~external:EventEmitter
   */
  class Preferences extends EventEmitter {
    /**
     * A list that hold Preference classes
     *
     * @type {Object}
     */
    #preferencesList = {}

    /**
     * Preference updated event
     *
     * @event module:preferences~Preferences#event:updated
     *
     * @type {object}
     * @property {string} name Preference's name that updated
     *
     * @see module:preferences/preference#event:updated
     */
    /**
     * Preference removed event
     *
     * @event module:preferences~Preferences#event:removed
     *
     * @see module:preferences/preference#event:removed
     */

    /**
     * Get Preference instance via it's name
     *
     * @param {string} name Target Preference's name
     *
     * @emits module:preferences~Preferences#event:updated
     * @emits module:preferences~Preferences#event:removed
     *
     * @listens module:preferences/preference#event:updated
     * @listens module:preferences/preference#event:removed
     *
     * @return {module:preferences/preference}
     */
    get (name) {
      if (typeof name !== 'string') throw new Error('name parameter is required and must be string')

      // Return Preference from list if exist
      if (this.#preferencesList.hasOwnProperty(name)) return this.#preferencesList[name]

      this.#preferencesList[name] = new Preference({
        name,
        storage: preferencesStorage
      })

      this.#preferencesList[name].on('updated', event => this.emit('updated', {
        name,
        ...event
      }))
      this.#preferencesList[name].on('removed', event => this.emit('removed', event))

      return this.#preferencesList[name]
    }

    /**
     * Initialize Preference
     *
     * @param {string} name Preference's name
     * @param {object} [body={}] Preference's initial content
     *
     * @throws Will throw an error if Preference is already exist in list
     *
     * @emits module:preferences~Preferences#event:updated
     * @emits module:preferences~Preferences#event:removed
     *
     * @listens module:preferences/preference#event:updated
     * @listens module:preferences/preference#event:removed
     *
     * @return {module:preferences/preference}
     */
    initialize (name, body = Object.create(null)) {
      if (typeof name !== 'string') throw new Error('name parameter is required and must be string')
      else if (typeof body !== 'object') throw new Error('body parameter must be object')
      else if (this.#preferencesList.hasOwnProperty(name)) throw new Error(`${name} is already exist`)

      this.#preferencesList[name] = new Preference({
        name,
        body,
        storage: preferencesStorage
      })

      this.#preferencesList[name].on('updated', event => this.emit('updated', {
        name,
        ...event
      }))
      this.#preferencesList[name].on('removed', event => this.emit('removed', event))

      return this.#preferencesList[name]
    }

    /**
     * Remove Preference from list and its Storage
     *
     * @param {(string|module:preferences/preference)} preference Preference or Preference's name to remove
     * @param {object} [configs={}]
     * @param {boolean} [configs.sync=true] Async or sync
     *
     * @throws Will throw an error if Preference is not accessible
     * @throws Will throw an error if Preference is not exist in list
     *
     * @return {(void|Promise<(void|Error)>)} Return promise if configs.sync equal to false
     * * Rejection
     *  * Reject an error if Preference is not accessible
     *  * Reject an error if Preference is not exist in list
     */
    remove (preference, configs = { sync: true }) {
      if (preference === undefined || (typeof preference !== 'string' && !(preference instanceof Preference))) {
        throw new Error('preference parameter is required and must be string/Preference')
      }

      const name = preference.name || preference
      const deletePreference = () => {
        delete this.#preferencesList[name]
      }
      const ERRORS = {
        accessibility: PREFERENCES_GLOBAL_ERRORS.accessibility,
        existence: PREFERENCES_GLOBAL_ERRORS.existence(name)
      }

      preference = this.#preferencesList[name]

      if (configs.sync) {
        if (typeof name !== 'string') throw ERRORS.accessibility
        if (preference === undefined) throw ERRORS.existence

        preference.remove()

        deletePreference()

        return
      }

      return new Promise((resolve, reject) => {
        if (typeof name !== 'string') reject(ERRORS.accessibility)
        if (preference === undefined) reject(ERRORS.existence)

        resolve(preference.remove({ sync: false })
          .then(deletePreference, error => Promise.reject(error)))
      })
    }

    /**
     * Check Preference is already exist
     *
     * @param {string} preferenceName Storage's name to check
     *
     * @return {boolean}
     */
    has (preferenceName) {
      return this.#preferencesList.hasOwnProperty(preferenceName)
    }
  }

  return new Preferences()
}
