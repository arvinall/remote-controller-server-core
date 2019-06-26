
/**
 * @module engine
 */

import { promisify } from 'util'
import EventEmitter from 'events'
import os from 'os'
import http from 'http'
import WebSocket from 'ws'
import { logSymbol } from '../logger'
import * as helpers from '../helpers'

/**
 * makeEngine creates engine module
 *
 * @param {object} [configs={}]
 * @param {number} [configs.port=7777] Server's port
 * @param {string} [configs.path="/"] WebSocket's path
 *
 * @return {module:engine~Engine}
 */
export default function makeEngine (configs = Object.create(null)) {
  if (typeof configs !== 'object') throw new TypeError('configs parameter must be object')

  // Set default configs
  configs = Object.assign({
    port: 7777,
    path: '/'
  }, configs)

  if (typeof configs.port !== 'number') throw new TypeError('configs.port must be number')
  else if (typeof configs.path !== 'string') throw new TypeError('configs.path must be string')
  else if (!configs.path.startsWith('/')) throw new Error('configs.path must starts with "/"')

  const logger = this.logger
  const connections = this.connections
  const httpServer = http.createServer()
  const webSocketServer = new WebSocket.Server({
    server: httpServer,
    path: configs.path,
    perMessageDeflate: true
  })

  /**
   * Engine module control web server and it's websocket
   *
   * @memberOf module:engine
   * @inner
   *
   * @mixes module:remote-controller-server-core~external:EventEmitter
   */
  class Engine extends EventEmitter {
    constructor () {
      super()

      webSocketServer.on('connection', (...parameters) => {
        const logParameters = {
          socket: {
            readyState: parameters[0].readyState,
            bufferedAmount: parameters[0].bufferedAmount,
            extensions: parameters[0].extensions
          },
          request: {
            url: parameters[1].url,
            socket: {
              address: parameters[1].socket.address,
              remoteAddress: parameters[1].socket.remoteAddress,
              remoteFamily: parameters[1].socket.remoteFamily,
              remotePort: parameters[1].socket.remotePort,
              localAddress: parameters[1].socket.localAddress,
              localPort: parameters[1].socket.localPort
            }
          }
        }

        try {
          logger.info('engine', {
            module: 'ws.Server',
            event: 'connection'
          }, logParameters)

          connections.add(...parameters)
        } catch (error) {
          logger.error('engine', {
            module: 'connections',
            method: 'add'
          }, error, logParameters)
        }
      })
    }

    /**
     * Start engine
     *
     * @param {number} [port=module:engine~configs.port]
     *
     * @emits module:engine~Engine#event:started
     *
     * @async
     * @returns {Promise<(void|Error)>}
     * * Rejection
     *  * Reject an error if engine started before
     *  * Reject an error if there is no network
     */
    start (port = configs.port) {
      if (typeof port !== 'number') throw new TypeError('port parameter must be number')

      return (async () => {
        if (this.isActive) throw new Error('Engine already started')
        else if (getNetworkIP() === null) throw new Error('Network is not available')

        configs.port = port

        /**
         * Engine started event
         *
         * @event module:engine~Engine#event:started
         */
        const fireEvent = () => { this.emit('started') }

        await promisify(httpServer.listen.bind(httpServer))({ port, host: '0.0.0.0' })
        fireEvent()
      })()
    }

    /**
     * Stop engine
     *
     * @emits module:engine~Engine#event:stopped
     *
     * @returns {Promise<(void|Error)>}
     * * Rejection
     *  * Reject an error if engine stopped before
     */
    async stop () {
      if (!this.isActive) throw new Error('Engine already stopped')

      /**
       * Engine stopped event
       *
       * @event module:engine~Engine#event:stopped
       */
      const fireEvent = () => { this.emit('stopped') }

      for (const webSocket of webSocketServer.clients) { webSocket.close() }

      await promisify(httpServer.close.bind(httpServer))()
      fireEvent()
    }

    /**
     * Get server address
     *
     * @example
     * { address: '192.168.1.2', family: 'IPv4', port: 7777, path: '/'}
     *
     * @type {{address: (string|null), family: string, port: number}}
     *
     * @see {@link https://github.com/websockets/ws/blob/master/doc/ws.md#serveraddress|WebSocket.Server#address method}
     */
    get address () {
      const ADDRESS = webSocketServer.address() || {}
      const ADDRESS_CACHE = Object.assign(Object.create(null), ADDRESS)

      Object.assign(ADDRESS, {
        family: 'IPv4',
        port: configs.port,
        path: configs.path
      }, ADDRESS_CACHE, {
        address: getNetworkIP()
      })

      return ADDRESS
    }

    /**
     * Get server listening status
     *
     * @type {boolean}
     */
    get isActive () {
      return httpServer.listening
    }

    /**
     * Get http server instance that in use
     *
     * @type {module:remote-controller-server-core~external:http.Server}
     */
    get httpServer () {
      return httpServer
    }

    get [logSymbol] () {
      return {
        engine: {
          address: this.address,
          isActive: this.isActive
        }
      }
    }
  }

  // Set string tag
  helpers.decorator.setStringTag()(Engine)

  const engine = new Engine()

  // Logging
  ;(() => {
    engine.on('started', () => {
      logger.info('makeEngine', {
        module: 'engine',
        event: 'started'
      }, engine)
    })

    engine.on('stopped', () => {
      logger.info('makeEngine', {
        module: 'engine',
        event: 'stopped'
      }, engine)
    })
  })()

  return engine
}

// Get Network IP
function getNetworkIP () {
  const networkInterfaces = os.networkInterfaces()
  let ip = null

  for (let interfaceName of Object.keys(networkInterfaces)) {
    if (typeof ip === 'string') break
    for (let iface of networkInterfaces[interfaceName]) {
      if (typeof ip === 'string') break

      if (!iface.internal && iface.family === 'IPv4') ip = iface.address
    }
  }

  return ip
}
