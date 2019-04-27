
/**
 * @module remote-controller-server-core
 */

/**
 * Nodejs EventEmitter class
 *
 * @external module:remote-controller-server-core~external:EventEmitter
 *
 * @see {@link https://nodejs.org/docs/latest-v10.x/api/events.html#events_class_eventemitter|EventEmitter}
 */
/**
 * ws module
 *
 * @external module:remote-controller-server-core~external:ws
 *
 * @see {@link https://github.com/websockets/ws/blob/master/README.md|ws Github page}
 */
/**
 * ws WebSocket class
 *
 * @name WebSocket
 * @memberOf module:remote-controller-server-core~external:ws
 * @static
 *
 * @see {@link https://github.com/websockets/ws/blob/master/doc/ws.md#class-websocket|Class: WebSocket}
 */
/**
 * ws WebSocket.Server class
 *
 * @name Server
 * @memberOf module:remote-controller-server-core~external:ws.WebSocket
 * @static
 *
 * @see {@link https://github.com/websockets/ws/blob/master/doc/ws.md#class-websocketserver|Class: WebSocket.Server}
 */

import makeStorages from './storages'
import makePreferences from './preferences'
import makeEngine from './engine'

const storagesList = Object.create(null)

/**
 * core function creates main core module
 *
 * @param {object} [configs={}]
 * @param {string} [configs.storagePath=process.cwd()] Storages path address
 * @param {string} [configs.preferenceStorageName='preferences']
 *
 * @return {module:remote-controller-server-core~core}
 */
export default function makeCore (configs = Object.create(null)) {
  if (typeof configs !== 'object') throw new Error('configs parameter must be object')

  // Set default configs
  configs = Object.assign({
    storagePath: process.cwd(),
    preferenceStorageName: 'preferences'
  }, configs)

  if (typeof configs.storagePath !== 'string') throw new Error('configs.storagePath must be string')
  else if (typeof configs.preferenceStorageName !== 'string') throw new Error('configs.preferencesStorageName must be string')

  /**
   * @namespace module:remote-controller-server-core~core
   */
  const MODULE = Object.create(null)

  if (storagesList[configs.storagePath] === undefined) {
    storagesList[configs.storagePath] = makeStorages({ path: configs.storagePath })
  }

  /**
   * Storage manager module
   *
   * @name storages
   * @memberOf module:remote-controller-server-core~core
   *
   * @type {module:storages~Storages}
   */
  MODULE.storages = storagesList[configs.storagePath]

  /**
   * Preference manager module
   *
   * @name preferences
   * @memberOf module:remote-controller-server-core~core
   *
   * @type {module:preferences~Preferences}
   */
  MODULE.preferences = makePreferences({
    storages: MODULE.storages,
    name: configs.preferenceStorageName
  })

  /**
   * Core engine
   *
   * @name engine
   * @memberOf module:remote-controller-server-core~core
   *
   * @type {module:engine~Engine}
   */
  MODULE.engine = makeEngine()

  return Object.freeze(MODULE)
}

export * as storages from './storages'
export * as preferences from './preferences'
export * as engine from './engine'
export * as passport from './passport'
export * as idGenerator from './idGenerator'
