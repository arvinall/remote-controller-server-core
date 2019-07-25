/* global global, console, process, setImmediate */

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
 * Nodejs stream module
 *
 * @external module:remote-controller-server-core~external:stream
 *
 * @see {@link https://nodejs.org/api/stream.html|Stream}
 */
/**
 * Nodejs stream.Readable class
 *
 * @name Readable
 * @memberOf module:remote-controller-server-core~external:stream
 * @static
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
 * Nodejs http.IncomingMessage class
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

import path from 'path'
import Logger, { makeClassLoggable } from './logger'
import makeStorages from './storages'
import makePreferences from './preferences'
import makeEngine from './engine'
import makeConnections from './connections'
import makePlugins from './plugins'

// Error classes
const logObject = {
  scope: 'makeCore',
  module: 'core',
  event: undefined
}
const TypeError = makeClassLoggable(global.TypeError, logObject)

const handleUncaughtExceptions = !process.listenerCount('uncaughtException')
const storagesList = Object.create(null)

/**
 * makeCore creates core namespace
 *
 * @param {object} [configs={}]
 * @param {string} [configs.storagePath=path.join(process.cwd(), 'storage')] Storages path address
 * @param {string} [configs.preferenceStorageName='preferences'] Preferences storage name
 * @param {number} [configs.httpServerPort=7777] Default http server port
 * @param {string} [configs.loggerPath=path.join(configs.storagePath, '../logs')] Logger directory path
 * @param {string} [configs.pluginPath=path.join(configs.storagePath, '../plugins')] Plugins directory path
 *
 * @return {module:remote-controller-server-core~core}
 */
export default function makeCore (configs = Object.create(null)) {
  if (typeof configs !== 'object') throw new TypeError('configs parameter must be object')

  // Set default configs
  configs = Object.assign({
    storagePath: path.join(process.cwd(), 'storage'),
    preferenceStorageName: 'preferences',
    httpServerPort: 7777
  }, configs)

  configs = Object.assign({
    loggerPath: path.join(configs.storagePath, '../logs'),
    pluginPath: path.join(configs.storagePath, '../plugins')
  }, configs)

  if (typeof configs.storagePath !== 'string') throw new TypeError('configs.storagePath must be string')
  else if (typeof configs.preferenceStorageName !== 'string') throw new TypeError('configs.preferencesStorageName must be string')
  else if (typeof configs.httpServerPort !== 'number') throw new TypeError('configs.httpServerPort must be number')
  if (typeof configs.loggerPath !== 'string') throw new TypeError('configs.loggerPath must be string')
  if (typeof configs.pluginPath !== 'string') throw new TypeError('configs.pluginPath must be string')

  /**
   * @namespace module:remote-controller-server-core~core
   */
  const core = Object.create(null)

  /**
   * Logger module
   *
   * @name logger
   * @memberOf module:remote-controller-server-core~core
   *
   * @type {module:logger}
   */
  core.logger = new Logger(configs.loggerPath)

  /*
  Handle unexpected behaviors
   */
  if (handleUncaughtExceptions) {
    process.prependListener('uncaughtException', error => {
      if (!error._dontLog) {
        core.logger.error('process', {
          module: 'core',
          event: 'uncaughtException'
        }, error)
      }

      if (process.env.NODE_ENV !== 'development') {
        setImmediate(() => console.log('For more information check error log file at', path
          .join(configs.loggerPath, 'error.log')))
      }
    })
  }
  process.on('unhandledRejection', reason => {
    if (!reason._dontLog) {
      core.logger.error('process', {
        module: 'core',
        event: 'unhandledRejection'
      }, reason)
    }

    if (process.env.NODE_ENV !== 'development') {
      console.log('For more information check error log file at', path
        .join(configs.loggerPath, 'error.log'))
    }
  })
  process.on('warning', warning => core.logger
    .warn('process', {
      module: 'core',
      event: 'warning'
    }, warning))

  // storages
  if (storagesList[configs.storagePath] === undefined) {
    try {
      storagesList[configs.storagePath] = makeStorages.call(core, { path: configs.storagePath })
    } catch (error) {
      core.logger.error('core', { module: 'storages' }, error)

      error._dontLog = true

      throw error
    }
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

  // preferences
  try {
    /**
     * Preference manager module
     *
     * @name preferences
     * @memberOf module:remote-controller-server-core~core
     *
     * @type {module:preferences~Preferences}
     */
    core.preferences = makePreferences.call(core, { name: configs.preferenceStorageName })
  } catch (error) {
    core.logger.error('core', { module: 'preferences' }, error)

    error._dontLog = true

    throw error
  }

  // connections
  try {
    /**
     * Connection manager module
     *
     * @name connections
     * @memberOf module:remote-controller-server-core~core
     *
     * @type {module:connections~Connections}
     */
    core.connections = makeConnections.call(core)
  } catch (error) {
    core.logger.error('core', { module: 'connections' }, error)

    error._dontLog = true

    throw error
  }

  // engine
  try {
    /**
     * Core engine
     *
     * @name engine
     * @memberOf module:remote-controller-server-core~core
     *
     * @type {module:engine~Engine}
     */
    core.engine = makeEngine.call(core, { port: configs.httpServerPort })
  } catch (error) {
    core.logger.error('core', { module: 'engine' }, error)

    error._dontLog = true

    throw error
  }

  // plugins
  try {
    /**
     * Plugins manager module
     *
     * @name plugins
     * @memberOf module:remote-controller-server-core~core
     *
     * @type {module:plugins~Plugins}
     */
    core.plugins = makePlugins.call(core, { path: configs.pluginPath })
  } catch (error) {
    core.logger.error('core', { module: 'plugins' }, error)

    error._dontLog = true

    throw error
  }

  return Object.freeze(core)
}

if (handleUncaughtExceptions) {
  process.on('uncaughtException', error => {
    if (process.env.NODE_ENV !== 'development') {
      console.error('uncaughtException', error.toString() + "\n") // eslint-disable-line quotes
    } else {
      console.error('uncaughtException', error) // eslint-disable-line quotes
    }

    setImmediate(() => process.exit(1))
  })
}
process.on('unhandledRejection', reason => {
  if (process.env.NODE_ENV !== 'development') {
    console.error('unhandledRejection', reason.toString() + "\n") // eslint-disable-line quotes
  } else {
    console.error('unhandledRejection', reason)
  }
})
process.on('warning', warning => {
  if (process.env.NODE_ENV !== 'development') {
    console.warn('warning', warning.toString() + "\n") // eslint-disable-line quotes
  } else {
    console.warn('warning', warning)
  }
})

export * as storages from './storages'
export * as preferences from './preferences'
export * as engine from './engine'
export * as passport from './passport'
export * as idGenerator from './idGenerator'
export * as connections from './connections'
export * as asyncEventEmitter from './asyncEventEmitter'
export * as helpers from './helpers'
export * as logger from './logger'
export * as plugins from './plugins'
