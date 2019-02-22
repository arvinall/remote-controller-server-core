
/**
 * @module remote-controller-server-core
 */

/**
 * Nodejs EventEmitter class
 * @external module:remote-controller-server-core~EventEmitter
 * @see {@link https://nodejs.org/docs/latest-v10.x/api/events.html#events_class_eventemitter|EventEmitter}
 */

import storagesMaker from './storages'
import preferences from './preferences'

const storagesList = new Map()

/**
 * core function creates main core module
 *
 * @param {object} [configs={}]
 * @param {string} [configs.storagePath=process.cwd()] Storages path address
 * @param {string} [configs.preferencesStorageName='preferences']
 *
 * @return {module:remote-controller-server-core~core}
 */
export default function coreMaker (configs = Object.create(null)) {
  if (typeof configs !== 'object') throw new Error('configs parameter must be object')

  // Set default configs
  configs = Object.assign({
    storagePath: process.cwd(),
    preferencesStorageName: 'preferences'
  }, configs)

  /**
   * @namespace module:remote-controller-server-core~core
   */
  const MODULE = Object.create(null)

  let storages = storagesList.get(configs.storagePath)
  if (storages === undefined) {
    storages = storagesMaker({ path: configs.storagePath })

    storagesList.set(configs.storagePath, storages)
  }

  /**
   * Preference manager module
   *
   * @name preferences
   * @memberOf module:remote-controller-server-core~core
   *
   * @type {module:preferences~Preferences}
   */
  MODULE.preferences = preferences({
    storages,
    name: configs.preferencesStorageName
  })

  return MODULE
}
