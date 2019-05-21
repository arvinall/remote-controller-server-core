
/**
 * @module connections
 */

import EventEmitter from 'events'
import http from 'http'
import WebSocket from 'ws'
import Connection from './connection'

/**
 * makeConnections creates connections module
 *
 * @param {object} [configs={}]
 * @param {number} [configs.removeTimeout=1800000] Connections will remove after this time in millisecond
 *
 * @return {module:connections~Connections}
 */
export default function makeConnections (configs = Object.create(null)) {
  if (typeof configs !== 'object') throw new Error('configs parameter must be object')

  // Set default configs
  configs = Object.assign({
    removeTimeout: 1000 * 60 * 30
  }, configs)

  if (typeof configs.removeTimeout !== 'number') throw new Error('configs.removeTimeout must be number')

  const connectionsList = new Map()

  /**
   * Connections module is a Connection holder/manager
   *
   * @mixes module:remote-controller-server-core~external:EventEmitter
   */
  class Connections extends EventEmitter {
    /**
     * Add and initial connection
     *
     * @param {(module:remote-controller-server-core~external:ws.WebSocket|module:connections/connection)} socket
     * @param {module:remote-controller-server-core~external:http.IncomingMessage} [request] Is not require when socket parameter is a {@link module:connections/connection|Connection}
     *
     * @throws Will throw an error if previous connection that requested is not exist
     * @throws Will throw an error if previous connection is already connect
     *
     * @emits module:connections~Connections#event:connected
     * @emits module:connections~Connections#event:disconnected
     * @emits module:connections~Connections#event:added
     *
     * @return {module:connections/connection}
     */
    add (socket, request) {
      if (!(socket instanceof WebSocket) &&
        !(socket instanceof Connection)) throw new Error('socket parameter is required and must be ws.WebSocket/Connection')
      else if (socket instanceof WebSocket &&
        !(request instanceof http.IncomingMessage)) throw new Error('request parameter is required when socket parameter is ws.WebSocket and must be http.IncomingMessage')

      let connection = socket instanceof Connection ? socket : undefined
      let initial

      if (connection === undefined) {
        socket.request = request
        socket.request.previousSocketId = (new URLSearchParams(request.url.split('?')[1])).get('id')

        initial = socket.request.previousSocketId === null

        if (initial) { // Create new Connection instance
          delete socket.request.previousSocketId

          connection = new Connection({ socket })
        } else { // Change an existing connection's socket
          if (!connectionsList.has(socket.request.previousSocketId)) {
            socket.close()

            throw new Error('Previous connection that requested is not exist')
          }

          connection = connectionsList.get(socket.request.previousSocketId)

          if (connection.isConnected) {
            socket.close()

            throw new Error('Previous connection is already connect')
          }

          connection.socket = socket
        }
      } else initial = true

      if (initial) {
        connectionsList.set(connection.id, connection)

        let timeOut

        // Transfer events
        /**
         * @summary Connections connected event
         * @description First parameter is the target connection
         *
         * @event module:connections~Connections#event:connected
         *
         * @type {module:connections/connection}
         *
         * @see module:connections/connection#event:connected
         */
        connection.on('connected', (...parameters) => {
          clearTimeout(timeOut)

          this.emit('connected', connection, ...parameters)
        })
        /**
         * @summary Connections disconnected event
         * @description First parameter is the target connection
         *
         * @event module:connections~Connections#event:disconnected
         *
         * @type {module:connections/connection}
         *
         * @see module:connections/connection#event:disconnected
         */
        connection.on('disconnected', (...parameters) => {
          timeOut = setTimeout(() => {
            this.remove(connection)
          }, configs.removeTimeout)

          this.emit('disconnected', connection, ...parameters)
        })
      }

      return connection
    }
  }

  return new Connections()
}

export Connection from './connection'
