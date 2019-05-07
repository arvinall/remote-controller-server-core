/* global test, expect, describe, beforeEach, beforeAll, afterAll */

import envConfigs from '../../test/configs'
import WebSocket from 'ws'
import Passport from '../../passport'
import Connection from '../connection'

const PASSWORD = 'aB_54321'
const PASSPORT = new Passport('password', PASSWORD)
const webSocketOptions = { perMessageDeflate: true }
const webSocketServerOptions = {
  host: '127.0.0.1',
  port: 9999,
  perMessageDeflate: true
}
const webSocketServer = new WebSocket.Server(webSocketServerOptions)

webSocketServerOptions.address = `ws://${webSocketServerOptions.host}:${webSocketServerOptions.port}`

let connection // eslint-disable-line no-unused-vars

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

  const configs = {
    authenticationFactors: {
      /* confirmation: true,
      passport: false */
    },
    passport: PASSPORT
  }

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

    describe('Must sends authentications ask status messages', () => {
      test('Factor: confirmation', async () => {
        expect.assertions(3)

        const webSocket = new WebSocket(webSocketServerOptions.address, webSocketOptions)
        const [ socket, request ] = await getSocket()

        webSocket.once('error', () => {})

        socket.request = request
        configs.socket = socket

        ;(() => new Connection(configs))()

        const [messageName, [messageBody]] = JSON
          .parse(await (new Promise(resolve => webSocket.once('message', resolve))))

        webSocket.on('message', data => console.error('Unexpected behavior', data))

        expect(messageName).toBe('authentication')
        expect(messageBody.factor).toBe('confirmation')
        expect(messageBody.status).toBe(0)
      })

      test('Factor: passport', async () => {
        expect.assertions(4)

        configs.authenticationFactors.confirmation = false
        configs.authenticationFactors.passport = true

        const webSocket = new WebSocket(webSocketServerOptions.address, webSocketOptions)
        const [ socket, request ] = await getSocket()

        webSocket.once('error', () => {})

        socket.request = request
        configs.socket = socket

        ;(() => new Connection(configs))()

        const [messageName, [messageBody]] = JSON
          .parse(await (new Promise(resolve => webSocket.once('message', resolve))))

        webSocket.on('message', data => console.error('Unexpected behavior', data))

        expect(messageName).toBe('authentication')
        expect(messageBody.factor).toBe('passport')
        expect(messageBody.status).toBe(0)
        expect(messageBody.type).toBe(configs.passport.type)
      })

      test('Factors: confirmation, passport', async () => {
        expect.assertions(7)

        configs.authenticationFactors.confirmation = true
        configs.authenticationFactors.passport = true

        const webSocket = new WebSocket(webSocketServerOptions.address, webSocketOptions)
        const [ socket, request ] = await getSocket()

        webSocket.once('error', () => {})

        socket.request = request
        configs.socket = socket

        ;(() => new Connection(configs))()

        const message = await (new Promise(resolve => {
          const result = []

          webSocket.on('message', function getData (data) {
            result.push(JSON.parse(data))

            if (result.length >= 2) {
              webSocket.off('message', getData)

              resolve(result)
            }
          })
        }))

        // confirmation
        expect(message[0][0]).toBe('authentication')
        expect(message[0][1][0].factor).toBe('confirmation')
        expect(message[0][1][0].status).toBe(0)

        // passport
        expect(message[1][0]).toBe('authentication')
        expect(message[1][1][0].factor).toBe('passport')
        expect(message[1][1][0].status).toBe(0)
        expect(message[1][1][0].type).toBe(configs.passport.type)

        webSocket.on('message', data => console.error('Unexpected behavior', data))
      })
    })

    test('Must sends passport authentication factor allowed/denied status messages', async () => {
      expect.assertions(9)

      configs.authenticationFactors.confirmation = false
      configs.authenticationFactors.passport = true

      const webSocket = new WebSocket(webSocketServerOptions.address, webSocketOptions)
      const [ socket, request ] = await getSocket()

      webSocket.once('error', () => {})

      socket.request = request
      configs.socket = socket

      ;(() => new Connection(configs))()

      let message
      let messageName
      let messageBody

      await (async (/* Ask */) => {
        message = JSON
          .parse(await (new Promise(resolve => webSocket.once('message', resolve))))
        messageName = message[0]
        messageBody = message[1][0]

        expect(messageName).toBe('authentication')
        expect(messageBody.factor).toBe('passport')
        expect(messageBody.status).toBe(0)
      })()

      await (async (/* Deny */) => {
        webSocket.send(JSON.stringify([
          'authenticate',
          [
            {
              factor: 'passport',
              passportInput: 'wrong'
            }
          ]
        ]))

        message = JSON
          .parse(await (new Promise(resolve => webSocket.once('message', resolve))))
        messageName = message[0]
        messageBody = message[1][0]

        expect(messageName).toBe('authentication')
        expect(messageBody.factor).toBe('passport')
        expect(messageBody.status).toBe(2)
      })()

      await (async (/* Allow */) => {
        webSocket.send(JSON.stringify([
          'authenticate',
          [
            {
              factor: 'passport',
              passportInput: PASSWORD
            }
          ]
        ]))

        message = JSON
          .parse(await (new Promise(resolve => webSocket.once('message', resolve))))
        messageName = message[0]
        messageBody = message[1][0]

        expect(messageName).toBe('authentication')
        expect(messageBody.factor).toBe('passport')
        expect(messageBody.status).toBe(1)
      })()

      webSocket.on('message', data => console.error('Unexpected behavior', data))
    })

    afterAll(async () => {
      configs.authenticationFactors.confirmation = true
      configs.authenticationFactors.passport = true

      const webSocket = new WebSocket(webSocketServerOptions.address, webSocketOptions)
      const [ socket, request ] = await getSocket()

      webSocket.once('error', () => {})

      socket.request = request
      configs.socket = socket

      connection = new Connection(configs)
    })
  })
})

afterAll(async () => new Promise(resolve => webSocketServer.close(resolve)))
