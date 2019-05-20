
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
 * @return {module:connections~Connections}
 */
export default function makeConnections () {
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
     * @param {module:remote-controller-server-core~external:ws.WebSocket} socket
     * @param {module:remote-controller-server-core~external:http.IncomingMessage} request
     *
     * @throws Will throw an error if the socket id that requested is not exist
     * @throws Will throw an error if connection is already connect
     *
     * @emits module:connections~Connections#event:connected
     * @emits module:connections~Connections#event:disconnected
     *
     * @return {module:connections/connection}
     */
    add (socket, request) {
      if (!(socket instanceof WebSocket)) throw new Error('socket parameter is required and must be ws.WebSocket')
      else if (!(request instanceof http.IncomingMessage)) throw new Error('request parameter is required and must be http.IncomingMessage')

      socket.request = request
      socket.request.previousSocketId = (new URLSearchParams(request.url.split('?')[1])).get('id')

      const initial = socket.request.previousSocketId === null

      let connection

      // Create new Connection instance
      if (initial) {
        connection = new Connection({ socket })

        connectionsList.set(connection.id, connection)
      } else { // Change an existing connection's socket
        if (!connectionsList.has(socket.request.previousSocketId)) {
          socket.close()

          throw new Error('Socket id that requested is not exist')
        }

        connection = connectionsList.get(socket.request.previousSocketId)

        if (connection.isConnected) {
          socket.close()

          throw new Error('Connection is already connect')
        }

        connection.socket = socket
      }

      if (initial) {
        // Disconnect when connection unauthenticated
        connection.on('authentication', event => {
          if (event.factor === undefined &&
          event.status === 2) connection.disconnect()
        })

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
        connection.on('connected', (...parameters) => this.emit('connected', connection, ...parameters))
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
        connection.on('disconnected', (...parameters) => this.emit('disconnected', connection, ...parameters))
      }

      return connection
    }
  }

  return new Connections()
}

export Connection from './connection'
