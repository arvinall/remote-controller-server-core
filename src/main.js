
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

var storages

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

  if (storages === undefined || storages._path !== configs.storagePath) {
    storages = storagesMaker({ path: configs.storagePath })
  }

  /**
   * Storage manager module
   *
   * @name storages
   * @memberOf module:remote-controller-server-core~core
   *
   * @type {module:storages~Storages}
   */
  MODULE.preferences = preferences({
    storages,
    name: configs.preferencesStorageName
  })

  return MODULE
}
