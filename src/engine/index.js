
/**
 * @module engine
 */

import { promisify } from 'util'
import EventEmitter from 'events'
import os from 'os'
import http from 'http'
import engineIO from 'engine.io'

/**
 * engineMaker creates engine module
 *
 * @param {object} [configs={}]
 * @param {number} [configs.port=7777] Server's port
 * @param {string} [configs.path="/"] WebSocket's path
 *
 * @return {module:engine~Engine}
 */
export default function engineMaker (configs = {}) {
  if (typeof configs !== 'object') throw new Error('configs parameter must be object')

  // Set default configs
  configs = Object.assign({
    port: 7777,
    path: '/'
  }, configs)

  if (typeof configs.port !== 'number') throw new Error('configs.port must be number')
  else if (typeof configs.path !== 'string' || !configs.path.startsWith('/')) throw new Error('configs.path must be string and starts with "/"')

  const httpServer = http.createServer()
  const webSocketServer = new engineIO.Server()

  // Attach websocket to http server
  webSocketServer.attach(httpServer, { path: configs.path })
  webSocketServer.generateId = idGenerator

  /**
   * Engine module control web server and its websocket
   *
   * @mixes module:remote-controller-server-core~external:EventEmitter
   */
  class Engine extends EventEmitter {
    /**
     * Start engine
     *
     * @param {number} [port=engineMaker~configs.port]
     *
     * @emits module:engine~Engine#event:started
     *
     * @returns {Promise<(void|Error)>}
     * * Rejection
     *  * Reject an error if engine started before
     *  * Reject an error if there is no network
     */
    start (port = configs.port) {
      if (typeof port !== 'number') throw new Error('port parameter must be number')
      else if (this.isActive) return Promise.reject(new Error('Engine already started'))
      else if (getNetworkIP() === null) return Promise.reject(new Error('Network is not available'))

      configs.port = port

      /**
       * Engine started event
       *
       * @event module:engine~Engine#event:started
       */
      const fireEvent = () => { this.emit('started') }

      return promisify(httpServer.listen.bind(httpServer))({ port, host: '0.0.0.0' })
        .then(fireEvent, error => Promise.reject(error))
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
    stop () {
      if (!this.isActive) return Promise.reject(new Error('Engine already stopped'))

      /**
       * Engine stopped event
       *
       * @event module:engine~Engine#event:stopped
       */
      const fireEvent = () => { this.emit('stopped') }

      webSocketServer.close()

      return promisify(httpServer.close.bind(httpServer))()
        .then(fireEvent, error => Promise.reject(error))
    }

    /**
     * Get server address
     *
     * @type {{port: number, ip: (string|null)}}
     */
    get address () {
      return { port: configs.port, ip: getNetworkIP() }
    }

    /**
     * Get server listening status
     *
     * @type {boolean}
     */
    get isActive () {
      return httpServer.listening
    }
  }

  return new Engine()
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

// Socket ID generator
const idGenerator = (() => {
  let counter = 0

  return () => counter++
})()
