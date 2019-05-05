/* global test, expect, describe, afterAll, afterEach */

import envConfigs from '../../test/configs'
import WebSocket from 'ws'
import Connection from '../connection'

const webSocketOptions = { perMessageDeflate: true }
const webSocketServerOptions = {
  host: '127.0.0.1',
  port: 9999,
  perMessageDeflate: true
}
const webSocketServer = new WebSocket.Server(webSocketServerOptions)

webSocketServerOptions.address = `ws://${webSocketServerOptions.host}:${webSocketServerOptions.port}`

afterEach(() => jest.setTimeout(envConfigs.timeout))

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

    test('Must throw error when configs.authenticationFactors property is not object with boolean values', () => {
      const ERROR = 'configs.authenticationFactors must be object with boolean values'
      const configs = { socket: new WebSocket('ws://test') }

      configs.socket.once('error', () => {})

      configs.authenticationFactors = 'wrong'

      expect(() => new Connection(configs)).toThrow(ERROR)

      configs.authenticationFactors = {
        confirmation: 'wrong',
        passport: 'wrong'
      }

      expect(() => new Connection(configs)).toThrow(ERROR)

      configs.socket.terminate()
    })

    test('Must throw error when all values of configs.authenticationFactors is false', () => {
      const ERROR = 'One authentication factor require at least'
      const configs = {
        socket: new WebSocket('ws://test'),
        authenticationFactors: { confirmation: false }
      }

      configs.socket.once('error', () => {})

      expect(() => new Connection(configs)).toThrow(ERROR)

      configs.socket.terminate()
    })

    test('Must throw error when configs.passport property is not Passport and configs.authenticationFactors.passport set to true', () => {
      const ERROR = 'configs.passport is required and must be Passport'
      const configs = {
        socket: new WebSocket('ws://test'),
        authenticationFactors: {
          confirmation: false,
          passport: true
        }
      }

      configs.socket.once('error', () => {})

      expect(() => new Connection(configs)).toThrow(ERROR)

      configs.passport = new function () {}()

      expect(() => new Connection(configs)).toThrow(ERROR)

      configs.socket.terminate()
    })
  })

  describe('Success', () => {
    test('Initial without error', async () => {
      expect.assertions(1)

      const configs = {}
      const webSocket = new WebSocket(webSocketServerOptions.address, webSocketOptions)
      const [ socket, request ] = await (new Promise(resolve => {
        webSocketServer.once('connection', (...args) => resolve(args))
      }))

      webSocket.once('error', () => {})

      if (socket.request === undefined) socket.request = request

      configs.socket = socket

      const connection = new Connection(configs)

      expect(connection).toBeInstanceOf(Connection)

      socket.close()
    })
  })
})

afterAll(() => webSocketServer.close())
