
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
 * Nodejs readableStream class
 *
 * @external module:remote-controller-server-core~external:readableStream
 *
 * @see {@link https://nodejs.org/api/stream.html#stream_readable_streams|Readable Streams}
 */

/**
 * Nodejs http module
 *
 * @external module:remote-controller-server-core~external:http
 *
 * @see {@link https://nodejs.org/api/http.html|HTTP}
 */
/**
 * Nodejs http.Server class
 *
 * @name Server
 * @memberOf module:remote-controller-server-core~external:http
 * @static
 *
 * @see {@link https://nodejs.org/api/http.html#http_class_http_server|HTTP Server}
 */
/**
 * Nodejs IncomingMessage class
 *
 * @name IncomingMessage
 * @memberOf module:remote-controller-server-core~external:http
 * @static
 *
 * @see {@link https://nodejs.org/api/http.html#http_class_http_incomingmessage|HTTP IncomingMessage}
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
import makeConnections from './connections'

const storagesList = Object.create(null)

/**
 * makeCore creates core namespace
 *
 * @param {object} [configs={}]
 * @param {string} [configs.storagePath=process.cwd()] Storages path address
 * @param {string} [configs.preferenceStorageName='preferences'] Preferences storage name
 * @param {number} [configs.httpServerPort=7777] Default http server port
 * @param {number} [configs.connectionRemoveTimeout=1800000] Connections will remove after this time in millisecond
 *
 * @return {module:remote-controller-server-core~core}
 */
export default function makeCore (configs = Object.create(null)) {
  if (typeof configs !== 'object') throw new Error('configs parameter must be object')

  // Set default configs
  configs = Object.assign({
    storagePath: process.cwd(),
    preferenceStorageName: 'preferences',
    httpServerPort: 7777,
    connectionRemoveTimeout: 1000 * 60 * 30
  }, configs)

  if (typeof configs.storagePath !== 'string') throw new Error('configs.storagePath must be string')
  else if (typeof configs.preferenceStorageName !== 'string') throw new Error('configs.preferencesStorageName must be string')
  else if (typeof configs.httpServerPort !== 'number') throw new Error('configs.httpServerPort must be number')

  /**
   * @namespace module:remote-controller-server-core~core
   */
  const core = Object.create(null)

  if (storagesList[configs.storagePath] === undefined) {
    storagesList[configs.storagePath] = makeStorages.call(core, { path: configs.storagePath })
  }

  /**
   * Storage manager module
   *
   * @name storages
   * @memberOf module:remote-controller-server-core~core
   *
   * @type {module:storages~Storages}
   */
  core.storages = storagesList[configs.storagePath]

  /**
   * Preference manager module
   *
   * @name preferences
   * @memberOf module:remote-controller-server-core~core
   *
   * @type {module:preferences~Preferences}
   */
  core.preferences = makePreferences.call(core, { name: configs.preferenceStorageName })

  /**
   * Connection manager module
   *
   * @name connections
   * @memberOf module:remote-controller-server-core~core
   *
   * @type {module:connections~Connections}
   */
  core.connections = makeConnections.call(core, { removeTimeout: configs.connectionRemoveTimeout })

  /**
   * Core engine
   *
   * @name engine
   * @memberOf module:remote-controller-server-core~core
   *
   * @type {module:engine~Engine}
   */
  core.engine = makeEngine.call(core, { port: configs.httpServerPort })

  return Object.freeze(core)
}

export * as storages from './storages'
export * as preferences from './preferences'
export * as engine from './engine'
export * as passport from './passport'
export * as idGenerator from './idGenerator'
export * as connections from './connections'
export * as asyncEventEmitter from './asyncEventEmitter'
