
/**
 * @module preferences
 */

import EventEmitter from 'events'
import Preference from './preference'

/**
 * makePreferences creates preferences module
 *
 * @param {object} configs
 * @param {string} [configs.name='preferences'] Preferences's Storage name
 *
 * @throws Will throw an error if Preferences file is already in use
 *
 * @return {module:preferences~Preferences}
 */
export default function makePreferences (configs) {
  if (typeof configs !== 'object') throw new TypeError('configs parameter is required and must be object')

  // Set default configs
  configs = Object.assign({
    name: 'preferences'
  }, configs)

  if (typeof configs.name !== 'string') throw new TypeError('configs.name must be string')
  else if (this.storages.has(configs.name)) throw new Error(`${configs.name} is already in use`)

  const logger = this.logger
  const PREFERENCES_GLOBAL_ERRORS = {
    accessibility: new Error(`Preference is not accessible`),
    existence: name => new Error(`${name} is not exist in list`)
  }
  const preferencesStorage = (() => {
    try {
      return this.storages.add(configs.name)
    } catch (error) {
      if (error.message === `${configs.name} is already exist`) {
        try {
          return this.storages.get(configs.name)
        } catch (error) {
          throw error
        }
      } else {
        throw error
      }
    }
  })()

  /**
   * Preferences module is a Preference holder/manager
   *
   * @todo This class doesn't show correctly in documentation, so needs to fix it
   *
   * @memberOf module:preferences
   * @inner
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
     * Remove Preference from list and its Storage
     *
     * @function remove
     * @memberOf module:preferences~Preferences
     * @inner
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
    #remove = (preference, configs = Object.create(null)) => {
      if (preference === undefined ||
        (typeof preference !== 'string' &&
          !(preference instanceof Preference))) {
        throw new TypeError('preference parameter is required and must be string/Preference')
      }

      // Set default configs
      configs = Object.assign({
        sync: true
      }, configs)

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

        preference.removeSync()

        deletePreference()

        return
      }

      if (typeof name !== 'string') return Promise.reject(ERRORS.accessibility)
      if (preference === undefined) return Promise.reject(ERRORS.existence)

      return preference.remove()
        .then(deletePreference, error => Promise.reject(error))
    }

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
      if (typeof name !== 'string') throw new TypeError('name parameter is required and must be string')

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
     * Add/Initialize Preference
     *
     * @param {(module:preferences/preference|string)} preference Preference instance or preference's name
     * @param {object} [body={}] Preference's initial content
     *
     * @throws Will throw an error if Preference is already exist in list
     *
     * @emits module:preferences~Preferences#event:updated
     * @emits module:preferences~Preferences#event:removed
     * @emits module:preferences~Preferences#event:added
     *
     * @listens module:preferences/preference#event:updated
     * @listens module:preferences/preference#event:removed
     *
     * @return {module:preferences/preference}
     */
    add (preference, body = Object.create(null)) {
      if (!(preference instanceof Preference) &&
        typeof preference !== 'string') throw new TypeError('preference parameter is required and must be Preference/string')
      else if (typeof body !== 'object') throw new TypeError('body parameter must be object')

      const name = preference.name || preference

      if (!(preference instanceof Preference)) preference = undefined

      if (this.#preferencesList.hasOwnProperty(name)) throw new Error(`${name} is already exist`)

      if (preference) {
        this.#preferencesList[name] = preference
      } else {
        this.#preferencesList[name] = preference = new Preference({
          name,
          body,
          storage: preferencesStorage
        })
      }

      preference.on('updated', event => this.emit('updated', {
        name,
        ...event
      }))
      preference.on('removed', event => this.emit('removed', event))

      /**
       * Preference added event
       *
       * @event module:preferences~Preferences#event:added
       *
       * @type module:preferences/preference
       */
      this.emit('added', preference)

      return preference
    }

    /**
     * Same as {@link module:preferences~Preferences~remove|~remove}(preference, { sync: false })
     *
     * @param {(string|module:preferences/preference)} preference
     *
     * @async
     *
     * @see module:preferences~Preferences~remove
     */
    remove (preference) {
      return this.#remove(preference, { sync: false })
    }

    /**
     * Same as {@link module:preferences~Preferences~remove|~remove}(preference)
     *
     * @param {(string|module:preferences/preference)} preference
     *
     * @see module:preferences~Preferences~remove
     */
    removeSync (preference) {
      return this.#remove(preference)
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

  const preferences = new Preferences()

  // Logging
  ;(() => {
    preferences.on('added', preference => {
      logger.info('makePreferences', {
        module: 'preferences',
        event: 'added'
      }, preference)
    })

    preferences.on('removed', ({ name }) => {
      logger.info('makePreferences', {
        module: 'preferences',
        event: 'removed'
      }, { preference: { name } })
    })

    preferences.on('updated', ({ name }) => {
      logger.info('makePreferences', {
        module: 'preferences',
        event: 'updated'
      }, { preference: { name } })
    })
  })()

  return preferences
}

export Preference from './preference'
