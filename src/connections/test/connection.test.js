/* global test, expect, describe, beforeEach, beforeAll, afterAll */

import envConfigs from '../../test/configs'
import WebSocket from 'ws'
import Passport from '../../passport'
import Connection from '../connection'

const PASSPORT = new Passport('password', 'aB_54321')
const webSocketOptions = { perMessageDeflate: true }
const webSocketServerOptions = {
  host: '127.0.0.1',
  port: 9999,
  perMessageDeflate: true
}
const webSocketServer = new WebSocket.Server(webSocketServerOptions)

webSocketServerOptions.address = `ws://${webSocketServerOptions.host}:${webSocketServerOptions.port}`

async function getSocket () {
  return new Promise(resolve => {
    webSocketServer.once('connection', (...args) => resolve(args))
  })
}

beforeAll(async () => new Promise(resolve => {
  if (!webSocketServer._server.listening) webSocketServer._server.once('listening', resolve)
  else resolve()
}))

beforeEach(() => jest.setTimeout(envConfigs.timeout))

describe('Connection constructor', () => {
  describe('Errors', () => {
    test('Must throw error when configs parameter is not object', () => {
      const ERROR = 'configs parameter is required and must be object'

      expect(() => new Connection()).toThrow(ERROR)
      expect(() => new Connection('worng')).toThrow(ERROR)
    })

    test('Must throw error when configs.socket property is not ws.WebSocket', () => {
      const ERROR = 'configs.socket is required and must be ws.WebSocket'

      expect(() => new Connection({})).toThrow(ERROR)
      expect(() => new Connection({ socket: new function () {}() })).toThrow(ERROR)
    })

    test('Must throw error when configs.authenticationFactors property is not object with boolean values', async () => {
      const ERROR = 'configs.authenticationFactors must be object with boolean values'
      const configs = { socket: new WebSocket(webSocketServerOptions.address, webSocketOptions) }
      const [ socket, request ] = await getSocket()

      configs.socket.once('error', () => {})

      socket.request = request
      configs.socket = socket

      configs.authenticationFactors = 'wrong'

      expect(() => new Connection(configs)).toThrow(ERROR)

      configs.authenticationFactors = {
        confirmation: 'wrong',
        passport: 'wrong'
      }

      expect(() => new Connection(configs)).toThrow(ERROR)

      configs.socket.terminate()
    })

    test('Must throw error when all values of configs.authenticationFactors property is false', async () => {
      const ERROR = 'One authentication factor require at least'
      const configs = {
        socket: new WebSocket(webSocketServerOptions.address, webSocketOptions),
        authenticationFactors: { confirmation: false }
      }
      const [ socket, request ] = await getSocket()

      configs.socket.once('error', () => {})

      socket.request = request
      configs.socket = socket

      expect(() => new Connection(configs)).toThrow(ERROR)
    })

    test('Must throw error when configs.passport property is not Passport and configs.authenticationFactors.passport property set to true', async () => {
      const ERROR = 'configs.passport is required and must be Passport'
      const configs = {
        socket: new WebSocket(webSocketServerOptions.address, webSocketOptions),
        authenticationFactors: {
          confirmation: false,
          passport: true
        }
      }
      const [ socket, request ] = await getSocket()

      configs.socket.once('error', () => {})

      socket.request = request
      configs.socket = socket

      expect(() => new Connection(configs)).toThrow(ERROR)

      configs.passport = new function () {}()

      expect(() => new Connection(configs)).toThrow(ERROR)
    })
  })

  describe('Success', () => {
    test('Initial without error', async () => {
      expect.assertions(1)

      const configs = {}
      const webSocket = new WebSocket(webSocketServerOptions.address, webSocketOptions)
      const [ socket, request ] = await getSocket()

      webSocket.once('error', () => {})

      socket.request = request
      configs.socket = socket

      const connection = new Connection(configs)

      expect(connection).toBeInstanceOf(Connection)
    })
  })
})

afterAll(async () => new Promise(resolve => webSocketServer.close(resolve)))
