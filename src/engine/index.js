
/**
 * @module engine
 */

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
 * @throws Will throw an error if there is no Network
 *
 * @return {module:engine~Engine}
 */
export default function engineMaker (configs = {}) {
  if (typeof configs !== 'object') throw new Error('configs parameter is required and must be object')

  const networkIP = getNetworkIP()

  if (networkIP === null) throw new Error('Network is not available')

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
     * @throws Will throw an error if engine started before
     *
     * @returns {Promise}
     */
    start (port = configs.port) {
      if (this.status) throw new Error('Engine already started')
      else if (typeof port !== 'number') throw new Error('port parameter must be number')

      return new Promise(resolve => httpServer.listen({ port, host: '0.0.0.0' }, resolve))
    }

    /**
     * Stop engine
     *
     * @returns {Promise}
     */
    stop () {
      webSocketServer.close()

      return new Promise(resolve => httpServer.close(resolve))
    }

    /**
     * Get server address
     *
     * @type {{address: string, port: (number|null)}}
     */
    get address () {
      return { port: httpServer.address() ? httpServer.address().port : null, address: networkIP }
    }

    /**
     * Get server listening status
     * 0 as Off
     * 1 as On
     *
     * @type {number}
     */
    get status () {
      return Number(httpServer.listening)
    }
  }

  return new Engine()
}

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
