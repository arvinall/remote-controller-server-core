/* global global, console */

/**
 * @module connections
 */

import EventEmitter from 'events'
import http from 'http'
import WebSocket from 'ws'
import Connection from './connection'
import Passport from '../passport'
import * as helpers from '../helpers'
import {
  logSymbol,
  makeClassLoggable
} from '../logger'

// Error classes
const logObject = {
  scope: 'makeConnections',
  module: 'connections',
  event: undefined
}
const Error = makeClassLoggable(global.Error, logObject)
const TypeError = makeClassLoggable(global.TypeError, logObject)

const GLOBAL_ERRORS = {
  authenticationFactorsRequirement: new Error('One authentication factor require at least')
}

/**
 * makeConnections creates connections module
 *
 * @return {module:connections~Connections}
 */
export default function makeConnections () {
  const logger = this.logger
  const connectionsList = new Map()
  const preference = (defaults => {
    const NAME = 'connections'
    let preference

    try {
      preference = this.preferences.add(NAME, defaults)
    } catch (error) {
      if (error.message === `${NAME} is already exist`) {
        try {
          preference = this.preferences.get(NAME)
        } catch (error) {
          throw error
        }
      } else throw error
    }

    try {
      Object.defineProperty(preference, 'defaults', { value: defaults })
    } catch (error) {}

    return preference
  })(Object.freeze({
    /** @type {object} */
    authenticationFactors: Object.freeze({
      /** @type {boolean} */
      confirmation: true,
      /** @type {boolean} */
      passport: false
    }),
    /** @type {{type: string, hash: number[], salt: number[]}} */
    passport: undefined,
    /** @type {number} */
    removeTimeout: 1000 * 60 * 30
  }))

  /**
   * @summary Connections module is a Connection holder/manager
   * @description
   * ##### Disconnect codes and descriptions
   * |  Code  | Description |
   * |  --- | --- |
   * |  `4001`  | Previous connection that requested is not exist  |
   * |  `4002`  | Previous connection that requested is already connect  |
   *
   * @memberOf module:connections
   * @inner
   *
   * @mixes module:remote-controller-server-core~external:EventEmitter
   */
  class Connections extends EventEmitter {
    #__authenticationFactors = {
      /**
       * @summary Authentication confirmation factor requirement
       * @description To reset to default value set it to `null` <br>
       * Default: `true`
       *
       * @memberOf module:connections~Connections#authenticationFactors
       *
       * @type {boolean}
       */
      get confirmation () {
        return preference.body.authenticationFactors.confirmation
      },

      set confirmation (value) {
        if (typeof value === 'boolean' ||
          value === null) {
          if (value === false &&
            !this.passport) {
            throw GLOBAL_ERRORS.authenticationFactorsRequirement.setLogObject({ setter: 'confirmation' })
          }

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
       * @memberOf module:connections~Connections#authenticationFactors
       *
       * @type {boolean}
       */
      get passport () {
        return preference.body.authenticationFactors.passport
      },

      set passport (value) {
        if (typeof value === 'boolean' ||
          value === null) {
          if (value === false &&
            !this.confirmation) {
            throw GLOBAL_ERRORS.authenticationFactorsRequirement.setLogObject({ setter: 'passport' })
          }

          preference.updateSync(body => {
            if (value !== null) body.authenticationFactors.passport = value
            else body.authenticationFactors.passport = preference.defaults.authenticationFactors.passport

            return body
          })
        }
      }
    }
    /**
     * @type {module:passport}
     */
    #passport
    /**
     * @type {boolean}
     */
    #binary = false

    /**
     * Authentication factors requirement
     *
     * @namespace module:connections~Connections#authenticationFactors
     */
    get authenticationFactors () {
      return this.#__authenticationFactors
    }

    /**
     * @summary Authentication passport factor
     * @description To reset to default value set it to `null` <br>
     * Default: `undefined`
     *
     * @type {module:passport}
     */
    get passport () {
      if (!(this.#passport instanceof Passport)) {
        const passportDetails = preference.body.passport

        this.#passport = passportDetails
          ? Passport.from(passportDetails.type, passportDetails)
          : undefined
      }

      return this.#passport
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

        this.#passport = value !== null
          ? value
          : preference.defaults.passport
      }
    }

    /**
     * @summary Connections will remove after this time in millisecond when disconnect
     * @description To reset to default value set it to `null` <br>
     * Default: `1800000` (30 minutes)
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
      const Error = makeClassLoggable(global.Error, logObject)
        .assignLogObject({ method: 'add' })

      if (!(socket instanceof WebSocket) &&
        !(socket instanceof Connection)) throw new TypeError('socket parameter is required and must be ws.WebSocket/Connection')
      else if (socket instanceof WebSocket &&
        !(request instanceof http.IncomingMessage)) throw new TypeError('request parameter is required and must be http.IncomingMessage')

      let connection = socket instanceof Connection ? socket : undefined
      let isNew = true

      if (connection === undefined) {
        socket.request = request
        socket.request.previousSocketId = (new URLSearchParams(request.url.split('?')[1])).get('id')

        isNew = socket.request.previousSocketId === null

        if (isNew) { // Create new Connection instance
          delete socket.request.previousSocketId

          connection = new Connection({
            socket,
            authenticationFactors: this.authenticationFactors,
            passport: this.passport
          })
        } else { // Change an existing connection's socket
          if (!connectionsList.has(socket.request.previousSocketId)) {
            const ERROR = new Error('Previous connection that requested is not exist')

            socket.close(4001, ERROR.message)

            throw ERROR
          }

          connection = connectionsList.get(socket.request.previousSocketId)

          if (connection.isConnect) {
            const ERROR = new Error('Previous connection that requested is already connect')

            socket.close(4002, ERROR.message)

            throw ERROR
          }

          connection.socket = socket
        }
      }

      if (isNew) {
        connectionsList.set(connection.id, connection)

        let removeTimeOut

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
          clearTimeout(removeTimeOut)

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
          removeTimeOut = setTimeout(() => {
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
     * @summary Get specific connection or all connected list
     * @description
     * When call this method without id parameter, returned object is iterable (over values) <br>
     * `Object.values({@link module:connections~Connections#get|connections.get()})[Symbol.iterator]`
     * is same as
     * `{@link module:connections~Connections#get|connections.get()}[Symbol.iterator]`
     *
     * @param  {string} [id]
     *
     * @return {(module:connections/connection|object<string, module:connections/connection>)}
     */
    get (id) {
      if (id !== undefined &&
        typeof id !== 'string') throw new TypeError('id parameter must be string')

      if (id) return connectionsList.get(id)

      const connectedListPrototype = {
        length: 0,
        [Symbol.iterator]: helpers.object.iterateOverValues
      }
      const connectedList = Object.create(connectedListPrototype)

      for (const connection of connectionsList.values()) {
        if (connection.isConnect) {
          connectedList[connection.id] = connection

          connectedListPrototype.length++
        }
      }

      return connectedList
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
      typeof connection !== 'string') throw new TypeError('connection parameter is required and must be Connection/string')

      if (typeof connection === 'string') connection = connectionsList.get(connection)

      let result = false

      if (connection instanceof Connection) {
        connection.disconnect()

        result = connectionsList.delete(connection.id)
      }

      /**
       * Connections removed event
       *
       * @event module:connections~Connections#event:removed
       *
       * @type {module:connections/connection}
       */
      if (result) this.emit('removed', connection)

      return result
    }

    /**
     * Check Connection is already exist
     *
     * @param {string} connectionId Connection's id to check
     *
     * @return {boolean}
     */
    has (connectionId) {
      return connectionsList.has(connectionId)
    }

    /**
     * Send broadcast message to clients (connected and authenticated connections)
     *
     * @param {string} name Message's name
     * @param {...*} [body] Message's content
     * @param {function} [callback] This function listens to event with the same name just once
     *
     * @return {Promise<(void|Error)>}
     */
    send (name, ...body) {
      if (typeof name !== 'string') throw new TypeError('name parameter is required and must be string')

      const binary = this.#binary

      return (async () => {
        for (const connection of this.get()) {
          if (connection.isAuthenticate) {
            if (!binary) await connection.send(name, ...body)
            else await connection.sendBinary(name, ...body)
          }
        }
      })()
    }

    /**
     * @summary Send broadcast message in binary type to clients (connected and authenticated connections)
     * @description same as {@link module:connections~Connections#send}
     *
     * @param {string} name Message's name
     * @param {...*} [body] Message's content
     * @param {function} [callback] This function listens to event with the same name just once
     *
     * @return {Promise<(void|Error)>}
     *
     * @see module:connections~Connections#send
     */
    sendBinary (name, ...body) {
      this.#binary = true

      const result = this.send(name, ...body)

      this.#binary = false

      return result
    }

    get [logSymbol] () {
      return {
        connections: {
          authenticationFactors: this.authenticationFactors,
          removeTimeout: this.removeTimeout,
          passport: this.passport !== undefined
            ? this.passport.toString()
            : undefined
        }
      }
    }
  }

  // Set string tag
  helpers.decorator.setStringTag()(Connections)

  const connections = new Connections()

  // Logging
  ;(() => {
    const loggedList = new WeakSet()

    connections.on('connected', connection => {
      if (process.env.NODE_ENV === 'development') {
        console.log(connection.id, 'Connected', connection.address)
      }

      logger.info('makeConnections', {
        module: 'connections',
        event: 'connected'
      }, connection)

      if (!loggedList.has(connection)) {
        connection.on('authentication', event => {
          let state

          switch (event.factor) {
            case undefined:
              state = [
                'connection authenticated',
                'connection unauthenticated'
              ][event.status - 1]
              break
            case 'confirmation':
              state = [
                'connection ask for confirmation',
                'connection confirmation allowed',
                'connection confirmation denied'
              ][event.status]
              break
            case 'passport':
              state = [
                'connection ask for passport',
                'connection passport allowed',
                'connection passport denied'
              ][event.status]
              break
          }

          if (process.env.NODE_ENV === 'development') {
            console.log(connection.id, state)
          }

          logger.info('makeConnections', {
            module: 'connections',
            event: 'authentication',
            status: state
          }, connection, { _event: event })
        })

        loggedList.add(connection)
      }
    })
    connections.on('disconnected', connection => {
      const state = 'disconnected'

      if (process.env.NODE_ENV === 'development') {
        console.log(connection.id, state, connection.address)
      }

      logger.info('makeConnections', {
        module: 'connections',
        event: state
      }, connection)
    })

    preference.on('updated', () => logger
      .info('makeConnections', {
        module: 'preference',
        event: 'updated'
      }, connections, preference))
  })()

  return connections
}

export Connection from './connection'
