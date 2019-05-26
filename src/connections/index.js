
/**
 * @module connections
 */

import EventEmitter from 'events'
import http from 'http'
import WebSocket from 'ws'
import Connection from './connection'
import Passport from '../passport'

/**
 * makeConnections creates connections module
 *
 * @return {module:connections~Connections}
 */
export default function makeConnections () {
  const connectionsList = new Map()
  const preference = (defaults => {
    let preference

    try {
      preference = this.preferences.initialize('connections', defaults)
    } catch (error) {
      preference = this.preferences.get('connections')
    }

    preference.defaults = defaults

    return preference
  })({
    /** @type {object} */
    authenticationFactors: {
      /** @type {boolean} */
      confirmation: true,
      /** @type {boolean} */
      passport: false
    },
    /** @type {{type: string, hash: number[], salt: number[]}} */
    passport: undefined,
    /** @type {number} */
    removeTimeout: 1000 * 60 * 30
  })

  /**
   * Connections module is a Connection holder/manager
   *
   * @memberOf module:connections
   * @inner
   *
   * @mixes module:remote-controller-server-core~external:EventEmitter
   */
  class Connections extends EventEmitter {
    /**
     * Authentication factors requirement
     *
     * @todo This namespace doesn't show correctly in documentation, so needs to fix it
     *
     * @namespace module:connections~Connections#authenticationFactors
     */
    authenticationFactors = {
      /**
       * @summary Authentication confirmation factor requirement
       * @description To reset to default value set it to `null` <br>
       * Default: `true`
       *
       * @type {boolean}
       */
      get confirmation () {
        return preference.body.authenticationFactors.confirmation
      },

      set confirmation (value) {
        if (typeof value === 'boolean' ||
          value === null) {
          preference.updateSync(body => {
            if (value !== null) body.authenticationFactors.confirmation = value
            else body.authenticationFactors.confirmation = preference.defaults.authenticationFactors.confirmation

            return body
          })
        }
      },

      /**
       * @summary Authentication passport factor requirement
       * @description To reset to default value set it to `null` <br>
       * Default: `false`
       *
       * @type {boolean}
       */
      get passport () {
        return preference.body.authenticationFactors.passport
      },

      set passport (value) {
        if (typeof value === 'boolean' ||
          value === null) {
          preference.updateSync(body => {
            if (value !== null) body.authenticationFactors.passport = value
            else body.authenticationFactors.passport = preference.defaults.authenticationFactors.passport

            return body
          })
        }
      }
    }

    /**
     * @summary Authentication passport factor
     * @description To reset to default value set it to `null` <br>
     * Default: `undefined`
     *
     * @type {module:passport}
     */
    get passport () {
      const passportDetails = preference.body.passport

      return passportDetails
        ? Passport.from(passportDetails.type, passportDetails)
        : undefined
    }

    set passport (value) {
      if (value instanceof Passport ||
        value === null) {
        preference.updateSync(body => {
          if (value !== null) {
            body.passport = {
              type: value.type,
              hash: value.hash.toJSON().data,
              salt: value.salt.toJSON().data
            }
          } else body.passport = preference.defaults.passport

          return body
        })
      }
    }

    /**
     * @summary Connections will remove after this time in millisecond
     * @description To reset to default value set it to `null` <br>
     * Default: `1800000`
     *
     * @type {number}
     */
    get removeTimeout () {
      return preference.body.removeTimeout
    }

    set removeTimeout (value) {
      if (typeof value === 'number' ||
        value === null) {
        preference.updateSync(body => {
          if (value !== null) {
            body.removeTimeout = value
          } else body.removeTimeout = preference.defaults.removeTimeout

          return body
        })
      }
    }

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

          connection = new Connection({
            socket,
            authenticationFactors: this.authenticationFactors,
            passport: this.passport
          })
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
          }, this.removeTimeout)

          this.emit('disconnected', connection, ...parameters)
        })
      }

      /**
       * Connections added event
       *
       * @event module:connections~Connections#event:added
       *
       * @type {module:connections/connection}
       */
      this.emit('added', connection)

      return connection
    }

    /**
     * Remove connection from list
     *
     * @param {(module:connections/connection|string)} connection Instance of Connection or connection's id
     *
     * @emits module:connections~Connections#event:removed
     *
     * @return {boolean}
     */
    remove (connection) {
      if (!(connection instanceof Connection) &&
      typeof connection !== 'string') throw new Error('connection parameter is required and must be Connection/string')

      if (typeof connection === 'string') {
        connection = connectionsList.get(connection)
      }

      let result = false

      if (connection instanceof Connection) {
        connection.disconnect()

        result = connectionsList.delete(connection.id)

        /**
         * Connections removed event
         *
         * @event module:connections~Connections#event:removed
         *
         * @type {module:connections/connection}
         */
        this.emit('removed', connection)
      }

      return result
    }

    /**
     * Get specific connection or all connected list
     *
     * @param  {string} [id]
     * @return {((module:connections/connection|object<string, module:connections/connection>))}
     */
    get (id) {
      if (id !== undefined &&
        typeof id !== 'string') throw new Error('id parameter must be string')

      if (id) return connectionsList.get(id)

      const connectedList = {}

      for (const connection of connectionsList.values()) {
        if (connection.isConnected) connectedList[connection.id] = connection
      }

      return connectedList
    }

    /**
     * @summary Send broadcast message to clients (connected and authenticated)
     *
     * @param {string} name Message's name
     * @param {...*} [body] Message's content
     * @param {function} [callback] This function listens to event with the same name just once
     *
     * @return {Promise<(void|Error)>}
     */
    send (name, ...body) {
      if (typeof name !== 'string') throw new Error('name parameter is required and must be string')

      return (async () => {
        const connectedConnections = this.get()

        for (const connection of Object.values(connectedConnections)) {
          if (connection.isAuthenticate) {
            await connection.send(name, ...body)
          }
        }
      })()
    }
  }

  return new Connections()
}

export Connection from './connection'
