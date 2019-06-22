/* global test, expect, describe, beforeEach, beforeAll, afterAll, afterEach, jest, TMP_PATH, setImmediate */

import stream from 'stream'
import fs from 'fs'
import path from 'path'
import envConfigs from '../../test/configs'
import WebSocket from 'ws'
import Passport from '../../passport'
import Connection, {
  uint8ArrayToUint8ArrayLike,
  bufferToUint8ArrayLike,
  uint8ArrayLikeToBuffer
} from '../connection'
import * as helpers from './helpers'

const PASSWORD = 'aB_54321'
const PASSPORT = new Passport('password', PASSWORD)
const webSocketOptions = { perMessageDeflate: true }
const webSocketServerOptions = {
  host: '127.0.0.1',
  port: 9999,
  perMessageDeflate: true
}
const webSocketServer = new WebSocket.Server(webSocketServerOptions)
const DEFAULT_STREAM_CHUNK_SIZE = 1062500

webSocketServerOptions.address = `ws://${webSocketServerOptions.host}:${webSocketServerOptions.port}`

let connection
let socket
let webSocket

async function getSomeSockets (size = 1) {
  return helpers.getSomeSockets.call({
    webSocketServerOptions,
    webSocketOptions,
    webSocketServer
  }, size)
}

async function getSomeMessages (size = 1, ws = webSocket) {
  return helpers.getSomeMessages.call(ws, size)
}

function makeFileWithSpecificSize (size = DEFAULT_STREAM_CHUNK_SIZE) {
  const buffer = Buffer.allocUnsafe(size)

  buffer.filePath = path.join(TMP_PATH, String(size))

  fs.writeFileSync(buffer.filePath, buffer)

  return buffer
}

function removeFileWithSpecificSize (file) {
  let filePath = file.filePath || file

  fs.unlinkSync(filePath)
}

beforeAll(async () => new Promise(resolve => {
  if (!webSocketServer._server.listening) webSocketServer._server.once('listening', resolve)
  else resolve()
}))

beforeEach(() => jest.setTimeout(envConfigs.timeout))

test('uint8ArrayToUint8ArrayLike exported function must return correct Uint8ArrayLike', () => {
  const uint8Array = Uint8Array.from([116, 101, 115, 116]) // Equal to test
  const uint8ArrayLike = uint8ArrayToUint8ArrayLike(uint8Array)

  expect(uint8ArrayLike).toHaveLength(2)
  expect(uint8ArrayLike[0]).toBe(uint8Array.constructor.name)
  expect(uint8ArrayLike[1]).toBeInstanceOf(Array)
  expect(uint8ArrayLike[1]).toHaveLength(uint8Array.length)

  for (const index in uint8ArrayLike[1]) {
    expect(uint8ArrayLike[1][index]).toBe(uint8Array[index])
  }

  const uint8ArrayLikeValue = Buffer.from(Uint8Array.from(uint8ArrayLike[1])).toString()

  expect(uint8ArrayLikeValue).toBe('test')
})

test('bufferToUint8ArrayLike exported function must convert Buffer to Uint8ArrayLike', () => {
  const buffer = Buffer.from('test')
  const uint8Array = Uint8Array.from(buffer)
  const uint8ArrayLike = bufferToUint8ArrayLike(buffer)

  expect(uint8ArrayLike).toHaveLength(2)
  expect(uint8ArrayLike[0]).toBe(uint8Array.constructor.name)
  expect(uint8ArrayLike[1]).toBeInstanceOf(Array)
  expect(uint8ArrayLike[1]).toHaveLength(uint8Array.length)

  for (const index in uint8ArrayLike[1]) {
    expect(uint8ArrayLike[1][index]).toBe(uint8Array[index])
  }

  const newBuffer = Buffer.from(Uint8Array.from(uint8ArrayLike[1]))

  expect(buffer.equals(newBuffer)).toBe(true)
})

test('uint8ArrayLikeToBuffer exported function must convert Uint8ArrayLike to Buffer', () => {
  const buffer = Buffer.from('test')
  const uint8Array = Uint8Array.from(buffer)
  const uint8ArrayLike = ['Uint8Array', Array.from(uint8Array)]

  expect(uint8ArrayLikeToBuffer(uint8ArrayLike).equals(buffer)).toBe(true)
})

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

    test('Must throw error when configs.socket.request property is not http.IncomingMessage', async () => {
      expect.assertions(1)

      const ERROR = 'configs.socket.request is required and must be http.IncomingMessage'
      const socket = (await getSomeSockets())[0]

      delete socket.request

      expect(() => new Connection({ socket })).toThrow(ERROR)
    })

    test('Must throw error when configs.authenticationFactors property is not object with boolean values', async () => {
      expect.assertions(2)

      const ERROR = 'configs.authenticationFactors must be object with boolean values'
      const configs = { socket: (await getSomeSockets())[0] }

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
      expect.assertions(1)

      const ERROR = 'One authentication factor require at least'
      const configs = {
        socket: (await getSomeSockets())[0],
        authenticationFactors: { confirmation: false }
      }

      expect(() => new Connection(configs)).toThrow(ERROR)
    })

    test('Must throw error when configs.passport property is not Passport and configs.authenticationFactors.passport property set to true', async () => {
      expect.assertions(2)

      const ERROR = 'configs.passport is required and must be Passport'
      const configs = {
        socket: (await getSomeSockets())[0],
        authenticationFactors: {
          confirmation: false,
          passport: true
        }
      }

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

      const configs = { socket: (await getSomeSockets())[0] }

      const connection = new Connection(configs)

      expect(connection).toBeInstanceOf(Connection)
    })

    describe('Must sends authentications ask status messages when connected', () => {
      test('Factor: confirmation', async () => {
        expect.assertions(3)

        configs.socket = (await getSomeSockets())[0]

        const webSocket = configs.socket.__webSocket__

        ;(() => new Connection(configs))()

        const [ messageName, [ messageBody ] ] = (await getSomeMessages(1, webSocket))[0]

        webSocket.on('message', data => console.error('Unexpected behavior', data))

        expect(messageName).toBe('authentication')
        expect(messageBody.factor).toBe('confirmation')
        expect(messageBody.status).toBe(0)
      })

      test('Factor: passport', async () => {
        expect.assertions(4)

        configs.authenticationFactors.confirmation = false
        configs.authenticationFactors.passport = true
        configs.socket = (await getSomeSockets())[0]

        const webSocket = configs.socket.__webSocket__

        ;(() => new Connection(configs))()

        const [ messageName, [ messageBody ] ] = (await getSomeMessages(1, webSocket))[0]

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
        configs.socket = (await getSomeSockets())[0]

        const webSocket = configs.socket.__webSocket__

        ;(() => new Connection(configs))()

        let message
        let messageName
        let messageBody

        // passport
        message = (await getSomeMessages(1, webSocket))[0]
        messageName = message[0]
        messageBody = message[1][0]

        expect(messageName).toBe('authentication')
        expect(messageBody.factor).toBe('passport')
        expect(messageBody.status).toBe(0)
        expect(messageBody.type).toBe(configs.passport.type)

        // confirmation
        webSocket.send(JSON.stringify([
          'authenticate',
          [
            {
              factor: 'passport',
              passportInput: PASSWORD
            }
          ]
        ]))

        // Get second message
        message = (await getSomeMessages(2, webSocket))[1]
        messageName = message[0]
        messageBody = message[1][0]

        expect(messageName).toBe('authentication')
        expect(messageBody.factor).toBe('confirmation')
        expect(messageBody.status).toBe(0)

        webSocket.on('message', data => console.error('Unexpected behavior', data))
      })
    })

    test('Must sends passport authentication factor allowed/denied status messages when passport sends', async () => {
      expect.assertions(12)

      configs.authenticationFactors.confirmation = false
      configs.authenticationFactors.passport = true
      configs.socket = (await getSomeSockets())[0]

      let webSocket = configs.socket.__webSocket__

      ;(() => new Connection(configs))()

      let message
      let messageName
      let messageBody

      await (async (/* Ask */) => {
        message = (await getSomeMessages(1, webSocket))[0]
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

        message = (await getSomeMessages(1, webSocket))[0]
        messageName = message[0]
        messageBody = message[1][0]

        expect(messageName).toBe('authentication')
        expect(messageBody.factor).toBe('passport')
        expect(messageBody.status).toBe(2)
      })()

      configs.socket = (await getSomeSockets())[0]
      webSocket = configs.socket.__webSocket__

      ;(() => new Connection(configs))()

      await (async (/* Ask */) => {
        message = (await getSomeMessages(1, webSocket))[0]
        messageName = message[0]
        messageBody = message[1][0]

        expect(messageName).toBe('authentication')
        expect(messageBody.factor).toBe('passport')
        expect(messageBody.status).toBe(0)
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

        message = (await getSomeMessages(1, webSocket))[0]
        messageName = message[0]
        messageBody = message[1][0]

        expect(messageName).toBe('authentication')
        expect(messageBody.factor).toBe('passport')
        expect(messageBody.status).toBe(1)
      })()

      webSocket.on('message', data => console.error('Unexpected behavior', data))
    })

    test('Must sends authentication status messages when passport sends', async () => {
      expect.assertions(12)

      configs.authenticationFactors.confirmation = false
      configs.authenticationFactors.passport = true
      configs.socket = (await getSomeSockets())[0]

      let webSocket = configs.socket.__webSocket__

      ;(() => new Connection(configs))()

      let message
      let messageName
      let messageBody

      await (async (/* Ask */) => {
        message = (await getSomeMessages(1, webSocket))[0]
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

        // Get second message
        message = (await getSomeMessages(2, webSocket))[1]
        messageName = message[0]
        messageBody = message[1][0]

        expect(messageName).toBe('authentication')
        expect(messageBody.factor).toBeUndefined()
        expect(messageBody.status).toBe(2)
      })()

      configs.socket = (await getSomeSockets())[0]
      webSocket = configs.socket.__webSocket__

      ;(() => new Connection(configs))()

      await (async (/* Ask */) => {
        message = (await getSomeMessages(1, webSocket))[0]
        messageName = message[0]
        messageBody = message[1][0]

        expect(messageName).toBe('authentication')
        expect(messageBody.factor).toBe('passport')
        expect(messageBody.status).toBe(0)
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

        // Get second message
        message = (await getSomeMessages(2, webSocket))[1]
        messageName = message[0]
        messageBody = message[1][0]

        expect(messageName).toBe('authentication')
        expect(messageBody.factor).toBeUndefined()
        expect(messageBody.status).toBe(1)
      })()

      webSocket.on('message', data => console.error('Unexpected behavior', data))
    })

    test('Must sends unauthenticated status when authentication failed', async () => {
      expect.assertions(9)

      const configs = { socket: (await getSomeSockets())[0] }

      const connection = new Connection(configs)

      let message = (await getSomeMessages(1, configs.socket.__webSocket__))[0]
      let messageName = message[0]
      let messageBody = message[1][0]

      expect(messageName).toBe('authentication')
      expect(messageBody.factor).toBe('confirmation')
      expect(messageBody.status).toBe(0)

      connection.confirm(false)

      message = (await getSomeMessages(2, configs.socket.__webSocket__))
      messageName = message[0][0]
      messageBody = message[0][1][0]

      expect(messageName).toBe('authentication')
      expect(messageBody.factor).toBe('confirmation')
      expect(messageBody.status).toBe(2)

      messageName = message[1][0]
      messageBody = message[1][1][0]

      expect(messageName).toBe('authentication')
      expect(messageBody.factor).toBeUndefined()
      expect(messageBody.status).toBe(2)
    })

    test('Must disconnect connection when connection unauthenticated', async done => {
      const configs = { socket: (await getSomeSockets())[0] }

      const connection = new Connection(configs)

      await new Promise(resolve => connection.on('authentication', event => {
        if (event.factor === 'confirmation' &&
          event.status === 0) {
          connection.confirm(false)

          resolve()
        }
      }))

      connection.confirm(false)

      configs.socket.__webSocket__.on('close', () => done())
    })
  })

  afterAll(async () => {
    configs.authenticationFactors.confirmation = false
    configs.authenticationFactors.passport = true
    configs.socket = (await getSomeSockets())[0]

    socket = configs.socket
    webSocket = configs.socket.__webSocket__

    connection = new Connection(configs)

    await (new Promise(resolve => webSocket.once('open', resolve)))
  })
})

describe('Connection properties', () => {
  test('Connection id property must return string with at least one character', () => {
    expect(!!connection.id.length).toBe(true)
  })

  test('Connection address property must return string that contains 4 dot', () => {
    expect(!!connection.address.length).toBe(true)
    expect(connection.address.split('.').length).toBe(4)
  })

  describe('isAuthenticate', () => {
    test('Must return false when passport is not provided', () => {
      expect(connection.isAuthenticate).toBe(false)
    })

    test('Must return true when passport is provided', async () => {
      expect.assertions(1)

      webSocket.send(JSON.stringify([
        'authenticate',
        [
          {
            factor: 'passport',
            passportInput: PASSWORD
          }
        ]
      ]))

      await getSomeMessages(2)

      expect(connection.isAuthenticate).toBe(true)
    })
  })

  describe('isConnect', () => {
    test('Must return true when connection is established', () => {
      expect(connection.isConnect).toBe(true)
    })

    test('Must return false when connection is not established', () => {
      socket.close()

      expect(connection.isConnect).toBe(false)
    })
  })

  describe('socket', () => {
    test('Must return correct ws.WebSocket instance', () => {
      expect(connection.socket).toBeInstanceOf(WebSocket)
      expect(connection.socket).toBe(socket)
    })

    test('Must throw an error when value is not instance of ws.WebSocket', () => {
      const ERROR = 'Value must be ws.WebSocket'

      expect(() => {
        connection.socket = 'wrong'
      }).toThrow(ERROR)
    })

    test('Must set socket property to new socket without error', async () => {
      expect.assertions(2)

      const sockets = await getSomeSockets(2)
      const connection = new Connection({ socket: sockets[0] })

      await new Promise(resolve => connection.once('connected', resolve))

      connection.socket = sockets[1]

      expect(connection.socket).not.toBe(sockets[0])
      expect(connection.socket).toBe(sockets[1])
    })

    test('Must emit connected event when new socket is open', async done => {
      const sockets = await getSomeSockets(2)
      const connection = new Connection({ socket: sockets[0] })

      await new Promise(resolve => connection.once('connected', resolve))

      connection.socket = sockets[1]

      await new Promise(resolve => connection.once('connected', () => done()))
    })

    test('Must send/emit authentication status when factor is only confirmation(passed before)', async () => {
      expect.assertions(9)

      const sockets = await getSomeSockets(2)
      const connection = new Connection({ socket: sockets[0] })

      // Ask for confirmation
      await new Promise(resolve => connection.once('authentication', event => {
        expect(event.factor).toBe('confirmation')
        expect(event.status).toBe(0)

        resolve()
      }))

      setImmediate(() => connection.confirm())

      // Authentication/Confirmation status
      await new Promise(resolve => connection.on('authentication', function allow (event) {
        if (event.factor !== undefined) {
          expect(event.factor).toBe('confirmation')
          expect(event.status).toBe(1)
        } else {
          expect(event.factor).toBeUndefined()
          expect(event.status).toBe(1)

          connection.off('authentication', allow)
          resolve()
        }
      }))

      connection.socket = sockets[1]

      // Authentication status
      await new Promise(resolve => connection.once('authentication', event => {
        expect(event.factor).toBeUndefined()
        expect(event.status).toBe(1)

        resolve()
      }))

      expect(connection.isAuthenticate).toBe(true)
    })

    test('Must send/emit passport factor and authentication status when factor is only passport', async () => {
      expect.assertions(9)

      const sockets = await getSomeSockets(2)
      const connection = new Connection({
        socket: sockets[0],
        authenticationFactors: { confirmation: false, passport: true },
        passport: PASSPORT
      })

      // Ask for passport
      await new Promise(resolve => connection.once('authentication', event => {
        expect(event.factor).toBe('passport')
        expect(event.status).toBe(0)

        resolve()
      }))

      connection.socket.__webSocket__.send(JSON.stringify([
        'authenticate',
        [
          {
            factor: 'passport',
            passportInput: PASSWORD
          }
        ]
      ]))

      // Authentication/Passport status
      await new Promise(resolve => connection.on('authentication', function allow (event) {
        if (event.factor !== undefined) {
          expect(event.factor).toBe('passport')
          expect(event.status).toBe(1)
        } else {
          expect(event.factor).toBeUndefined()
          expect(event.status).toBe(1)

          connection.off('authentication', allow)
          resolve()
        }
      }))

      connection.socket = sockets[1]

      // Ask for passport
      await new Promise(resolve => connection.once('authentication', event => {
        expect(event.factor).toBe('passport')
        expect(event.status).toBe(0)

        resolve()
      }))

      expect(connection.isAuthenticate).toBe(false)
    })

    test('Must send/emit passport factor and authentication status when factor is confirmation(passed before) and passport', async () => {
      expect.assertions(18)

      const sockets = await getSomeSockets(2)
      const connection = new Connection({
        socket: sockets[0],
        authenticationFactors: { confirmation: true, passport: true },
        passport: PASSPORT
      })

      // Ask for passport
      await new Promise(resolve => connection.once('authentication', event => {
        expect(event.factor).toBe('passport')
        expect(event.status).toBe(0)

        resolve()
      }))

      connection.socket.__webSocket__.send(JSON.stringify([
        'authenticate',
        [
          {
            factor: 'passport',
            passportInput: PASSWORD
          }
        ]
      ]))

      // Passport status - Ask for confirmation
      await new Promise(resolve => connection.on('authentication', function handler (event) {
        if (event.factor !== 'confirmation') {
          expect(event.factor).toBe('passport')
          expect(event.status).toBe(1)
        } else {
          expect(event.factor).toBe('confirmation')
          expect(event.status).toBe(0)

          connection.off('authentication', handler)
          resolve()
        }
      }))

      setImmediate(() => connection.confirm())

      // Authentication/Confirmation status
      await new Promise(resolve => connection.on('authentication', function allow (event) {
        if (event.factor !== undefined) {
          expect(event.factor).toBe('confirmation')
          expect(event.status).toBe(1)
        } else {
          expect(event.factor).toBeUndefined()
          expect(event.status).toBe(1)

          connection.off('authentication', allow)
          resolve()
        }
      }))

      connection.socket = sockets[1]

      // Ask for passport
      await new Promise(resolve => connection.once('authentication', event => {
        expect(event.factor).toBe('passport')
        expect(event.status).toBe(0)

        resolve()
      }))

      expect(connection.isAuthenticate).toBe(false)

      connection.socket.__webSocket__.send(JSON.stringify([
        'authenticate',
        [
          {
            factor: 'passport',
            passportInput: PASSWORD
          }
        ]
      ]))

      // Authentication/Passport status
      await new Promise(resolve => connection.on('authentication', function allow (event) {
        if (event.factor !== undefined) {
          expect(event.factor).toBe('passport')
          expect(event.status).toBe(1)
        } else {
          expect(event.factor).toBeUndefined()
          expect(event.status).toBe(1)

          connection.off('authentication', allow)
          resolve()
        }
      }))

      expect(connection.isAuthenticate).toBe(true)
    })
  })

  afterAll(async () => {
    socket = (await getSomeSockets())[0]
    webSocket = socket.__webSocket__

    connection = new Connection({
      socket,
      authenticationFactors: { passport: true },
      passport: PASSPORT
    })

    await (new Promise(resolve => webSocket.once('open', resolve)))
  })
})

describe('Connection confirm method', () => {
  test('Must sends only confirmation authentication factor allowed/denied status messages when passport is not provided', async () => {
    expect.assertions(6)

    let message
    let messageName
    let messageBody

    // Allow
    connection.confirm(/* true */)

    message = (await getSomeMessages())[0]
    messageName = message[0]
    messageBody = message[1][0]

    expect(messageName).toBe('authentication')
    expect(messageBody.factor).toBe('confirmation')
    expect(messageBody.status).toBe(1)

    // Deny
    connection.confirm(false)

    message = (await getSomeMessages())[0]
    messageName = message[0]
    messageBody = message[1][0]

    expect(messageName).toBe('authentication')
    expect(messageBody.factor).toBe('confirmation')
    expect(messageBody.status).toBe(2)
  })

  test('Must sends confirmation factor and authentication status messages when passport is provided', async () => {
    expect.assertions(12)

    let message
    let messageName
    let messageBody

    webSocket.send(JSON.stringify([
      'authenticate',
      [
        {
          factor: 'passport',
          passportInput: PASSWORD
        }
      ]
    ]))

    await getSomeMessages()

    await (async (/* Allow */) => {
      connection.confirm(/* true */)

      message = await getSomeMessages(2)
      messageName = [message[0][0], message[1][0]]
      messageBody = [message[0][1][0], message[1][1][0]]

      expect(messageName[0]).toBe('authentication')
      expect(messageBody[0].factor).toBe('confirmation')
      expect(messageBody[0].status).toBe(1)

      expect(messageName[1]).toBe('authentication')
      expect(messageBody[1].factor).toBeUndefined()
      expect(messageBody[1].status).toBe(1)
    })()

    await (async (/* Deny */) => {
      connection.confirm(false)

      message = await getSomeMessages(2)
      messageName = [message[0][0], message[1][0]]
      messageBody = [message[0][1][0], message[1][1][0]]

      expect(messageName[0]).toBe('authentication')
      expect(messageBody[0].factor).toBe('confirmation')
      expect(messageBody[0].status).toBe(2)

      expect(messageName[1]).toBe('authentication')
      expect(messageBody[1].factor).toBeUndefined()
      expect(messageBody[1].status).toBe(2)
    })()
  })

  afterEach(async () => {
    socket = (await getSomeSockets())[0]
    webSocket = socket.__webSocket__

    connection = new Connection({
      socket,
      authenticationFactors: { passport: true },
      passport: PASSPORT
    })

    await (new Promise(resolve => webSocket.once('open', resolve)))
  })
  afterAll(async () => {
    socket = (await getSomeSockets())[0]
    webSocket = socket.__webSocket__

    connection = new Connection({ socket })

    await (new Promise(resolve => webSocket.once('open', resolve)))

    await getSomeMessages(1)
  })
})

describe('Connection send method', () => {
  describe('Errors', () => {
    test('Must throw error when name parameter is not string', () => {
      const ERROR = 'name parameter is required and must be string'

      expect(() => connection.send()).toThrow(ERROR)
      expect(() => connection.send(['wrong'])).toThrow(ERROR)
    })

    test('Must throw error when connection is not authenticated', async () => {
      expect.assertions(1)

      const ERROR = 'Connection is not authenticated'

      try {
        await connection.send('test')
      } catch (error) {
        expect(error.message).toBe(ERROR)
      }
    })

    test('Must throw error when connection is not connected', async () => {
      expect.assertions(1)

      const ERROR = 'Connection is not connected'

      let socket = (await getSomeSockets())[0]

      const webSocket = socket.__webSocket__
      const connection = new Connection({ socket })

      await (new Promise(resolve => webSocket.once('open', resolve)))

      connection.confirm()

      webSocket.close()

      await (new Promise(resolve => webSocket.once('close', resolve)))

      try {
        await connection.send('test')
      } catch (error) {
        expect(error.message).toBe(ERROR)
      }
    })
  })

  describe('Success', () => {
    beforeAll(async () => {
      connection.confirm()

      await getSomeMessages(2)
    })

    test('Send message without error', async () => {
      expect.assertions(1)

      const name = 'test'

      await connection.send(name)

      const [ messageName ] = (await getSomeMessages())[0]

      expect(messageName).toBe(name)
    })

    test('Send message with body', async () => {
      expect.assertions(4)

      const name = 'test'
      const body = [ name + 1 ]

      let message
      let messageName
      let messageBody

      // Send with one body data
      await connection.send(name, ...body)

      message = (await getSomeMessages())[0]
      messageName = message[0]
      messageBody = message[1]

      expect(messageName).toBe(name)
      expect(messageBody).toEqual(body)

      // Send with multi body data
      body.push(name + 2, name + 3, name + 4)

      await connection.send(name, ...body)

      message = (await getSomeMessages())[0]
      messageName = message[0]
      messageBody = message[1]

      expect(messageName).toBe(name)
      expect(messageBody).toEqual(body)
    })

    test('Send message with callback and no body', async done => {
      expect.assertions(1)

      const name = 'test'

      let messageName

      await connection.send(name, done)

      messageName = (await getSomeMessages())[0][0]

      expect(messageName).toBe(name)

      webSocket.send(JSON.stringify([ name, [] ]))
    })

    test('Send message with callback and body', async done => {
      expect.assertions(3)

      const name = 'test'
      const body = [
        name + 1,
        name + 2,
        name + 3,
        name + 4
      ]
      const reversedBody = [ ...body ].reverse()

      let message
      let messageName
      let messageBody

      await connection.send(name, ...body, (...body) => {
        expect(body).toEqual(reversedBody)

        done()
      })

      message = (await getSomeMessages())[0]
      messageName = message[0]
      messageBody = message[1]

      expect(messageName).toBe(name)
      expect(messageBody).toEqual(body)

      webSocket.send(JSON.stringify([ name, reversedBody ]))
    })
  })
})

describe('Connection disconnect method', () => {
  describe('Errors', () => {
    test('Must throw error when code parameter is not number', () => {
      const ERROR = 'code parameter must be number'

      expect(() => connection.disconnect('wrong')).toThrow(ERROR)
    })

    test('Must throw error when description parameter is not string', () => {
      const ERROR = 'description parameter must be string'

      expect(() => connection.disconnect(1, [ 'wrong' ])).toThrow(ERROR)
    })
  })

  describe('Success', () => {
    test('Must close socket successfully', done => {
      connection.disconnect()

      webSocket.once('close', () => done())
    })

    test('Must close socket successfully with code and description', async () => {
      expect.assertions(2)

      const socket = (await getSomeSockets())[0]
      const connection = new Connection({ socket })
      const CODE = 4000
      const DESCRIPTION = 'Test'

      connection.disconnect(CODE, DESCRIPTION)

      await new Promise(resolve => socket.__webSocket__.once('close', (code, description) => {
        expect(code).toBe(CODE)
        expect(description).toBe(DESCRIPTION)

        resolve()
      }))
    })
  })
})

describe('Connection events', () => {
  test('Emit connected when socket(open) attach to connection', async done => {
    let socket = (await getSomeSockets())[0]

    const connection = new Connection({ socket })

    connection.on('connected', () => done())
  })

  describe('Authentication', () => {
    test('Emit confirmation factor status', async done => {
      expect.assertions(10)

      let socket = (await getSomeSockets())[0]

      const connection = new Connection({ socket })

      // Ask
      await (new Promise(resolve => connection.once('authentication', event => {
        expect(event.factor).toBe('confirmation')
        expect(event.status).toBe(0)

        resolve()
      })))

      let counter = 0

      connection.on('authentication', function mainListener (event) {
        counter++

        switch (counter) {
          // Deny
          case 1:
            expect(event.factor).toBe('confirmation')
            expect(event.status).toBe(2)
            break
          case 2:
            expect(event.factor).toBeUndefined()
            expect(event.status).toBe(2)
            break
          // Allow
          case 3:
            expect(event.factor).toBe('confirmation')
            expect(event.status).toBe(1)
            break
          case 4:
            expect(event.factor).toBeUndefined()
            expect(event.status).toBe(1)
          default: // eslint-disable-line no-fallthrough
            connection.off('authentication', mainListener)

            done()
            break
        }
      })

      // Deny
      connection.confirm(false)
      // Allow
      connection.confirm()
    })

    test('Emit passport factor status', async () => {
      expect.assertions(10)

      let socket = (await getSomeSockets())[0]

      const webSocket = socket.__webSocket__

      const connection = new Connection({
        socket,
        authenticationFactors: {
          confirmation: false,
          passport: true
        },
        passport: PASSPORT
      })

      // Ask
      await (new Promise(resolve => connection.once('authentication', event => {
        expect(event.factor).toBe('passport')
        expect(event.status).toBe(0)

        resolve()
      })))

      if (!webSocket.readyState) await (new Promise(resolve => webSocket.once('open', resolve)))

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

        let counter = 0

        await (new Promise(resolve => connection.on('authentication', function deny (event) {
          counter++

          switch (counter) {
            case 1:
              expect(event.factor).toBe('passport')
              expect(event.status).toBe(2)
              break
            case 2:
              expect(event.factor).toBeUndefined()
              expect(event.status).toBe(2)
            default: // eslint-disable-line no-fallthrough
              connection.off('authentication', deny)

              resolve()
              break
          }
        })))
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

        let counter = 0

        await (new Promise(resolve => connection.on('authentication', function allow (event) {
          counter++

          switch (counter) {
            case 1:
              expect(event.factor).toBe('passport')
              expect(event.status).toBe(1)
              break
            case 2:
              expect(event.factor).toBeUndefined()
              expect(event.status).toBe(1)
            default: // eslint-disable-line no-fallthrough
              connection.off('authentication', allow)

              resolve()
              break
          }
        })))
      })()
    })

    test('Emit passport then confirmation factor status', async done => {
      expect.assertions(16)

      let socket = (await getSomeSockets())[0]

      const webSocket = socket.__webSocket__

      const connection = new Connection({
        socket,
        authenticationFactors: { passport: true },
        passport: PASSPORT
      })

      // Ask for passport
      await (new Promise(resolve => connection.once('authentication', event => {
        expect(event.factor).toBe('passport')
        expect(event.status).toBe(0)

        resolve()
      })))

      if (!webSocket.readyState) await (new Promise(resolve => webSocket.once('open', resolve)))

      await (async (/* Passport denied */) => {
        webSocket.send(JSON.stringify([
          'authenticate',
          [
            {
              factor: 'passport',
              passportInput: 'wrong'
            }
          ]
        ]))

        await (new Promise(resolve => connection.once('authentication', event => {
          expect(event.factor).toBe('passport')
          expect(event.status).toBe(2)

          resolve()
        })))
      })()

      await (async (/* Passport allowed - Ask for confirmation */) => {
        webSocket.send(JSON.stringify([
          'authenticate',
          [
            {
              factor: 'passport',
              passportInput: PASSWORD
            }
          ]
        ]))

        let counter = 0

        await (new Promise(resolve => connection.on('authentication', function listener (event) {
          counter++

          switch (counter) {
            // Passport allowed
            case 1:
              expect(event.factor).toBe('passport')
              expect(event.status).toBe(1)
              break
            // Ask for confirmation
            case 2:
              expect(event.factor).toBe('confirmation')
              expect(event.status).toBe(0)
            default: // eslint-disable-line no-fallthrough
              connection.off('authentication', listener)

              resolve()
              break
          }
        })))
      })()

      ;((/* Confirmation denied - Confirmation allowed */) => {
        let counter = 0

        connection.on('authentication', function listener (event) {
          counter++

          switch (counter) {
            // Deny
            case 1:
              expect(event.factor).toBe('confirmation')
              expect(event.status).toBe(2)
              break
            case 2:
              expect(event.factor).toBeUndefined()
              expect(event.status).toBe(2)
              break
            // Allow
            case 3:
              expect(event.factor).toBe('confirmation')
              expect(event.status).toBe(1)
              break
            case 4:
              expect(event.factor).toBeUndefined()
              expect(event.status).toBe(1)
            default: // eslint-disable-line no-fallthrough
              connection.off('authentication', listener)

              done()
              break
          }
        })
      })()

      // Confirmation denied
      connection.confirm(false)
      // Confirmation allowed
      connection.confirm()
    })
  })

  test('Emit disconnected when socket closed', async done => {
    let socket = (await getSomeSockets())[0]

    const connection = new Connection({ socket })

    setImmediate(() => connection.disconnect())

    connection.on('disconnected', () => done())
  })
})

describe('Connection setReadStreamDefaults static method', () => {
  const CHUNK_SIZE = DEFAULT_STREAM_CHUNK_SIZE

  test('Return new object with defaults', () => {
    const streamOptions = Connection.setReadStreamDefaults()

    expect(streamOptions).toEqual({
      end: CHUNK_SIZE,
      highWaterMark: CHUNK_SIZE + 1,
      multiChunks: true
    })
  })

  test('Return new object with defaults with some prefer options', () => {
    const preferOptions = {
      end: CHUNK_SIZE * 2,
      test: 0
    }
    const streamOptions = Connection.setReadStreamDefaults(preferOptions, false)

    expect(streamOptions).toEqual({
      end: CHUNK_SIZE * 2,
      highWaterMark: CHUNK_SIZE + 1,
      multiChunks: true,
      test: 0
    })

    expect(preferOptions).toEqual({
      end: CHUNK_SIZE * 2,
      test: 0
    })
  })

  test('Overwrite object with defaults', () => {
    const streamOptions = {
      end: CHUNK_SIZE * 2,
      test: 0
    }

    Connection.setReadStreamDefaults(streamOptions /* , true */)

    expect(streamOptions).toEqual({
      end: CHUNK_SIZE * 2,
      highWaterMark: CHUNK_SIZE + 1,
      multiChunks: true,
      test: 0
    })
  })

  test('Set end property to start plus ' + CHUNK_SIZE + ' if start property provided', () => {
    const streamOptions = Connection.setReadStreamDefaults({
      start: CHUNK_SIZE
    })

    expect(streamOptions).toEqual({
      end: CHUNK_SIZE * 2,
      highWaterMark: CHUNK_SIZE + 1,
      multiChunks: true,
      start: CHUNK_SIZE
    })
  })

  test('Add one to highWaterMark property if provided', () => {
    const streamOptions = Connection.setReadStreamDefaults({
      highWaterMark: CHUNK_SIZE
    })

    expect(streamOptions).toEqual({
      end: CHUNK_SIZE,
      highWaterMark: CHUNK_SIZE + 1,
      multiChunks: true
    })
  })

  test('Set highWaterMark property to different between end and start properties plus one if start property provided', () => {
    const streamOptions = Connection.setReadStreamDefaults({
      start: CHUNK_SIZE / 2
    })

    expect(streamOptions).toEqual({
      end: CHUNK_SIZE + CHUNK_SIZE / 2,
      highWaterMark: (CHUNK_SIZE + CHUNK_SIZE / 2 - CHUNK_SIZE / 2) + 1,
      multiChunks: true,
      start: CHUNK_SIZE / 2
    })
  })
})

describe('Connection readStreamChunks static method', () => {
  test('Must throw error when readableStream parameter is not stream.Readable', () => {
    const ERROR = 'readableStream parameter is required and must be stream.Readable'

    expect(() => Connection.readStreamChunks()).toThrow(ERROR)
    expect(() => Connection.readStreamChunks('wrong')).toThrow(ERROR)
  })

  describe('Success', () => {
    test('Must return AsyncGeneratorFunction without error', () => {
      const readableStream = new stream.Readable()
      const chunkGenerator = Connection.readStreamChunks(readableStream)
      const AsyncGeneratorFunction = (async function *() {}).constructor // eslint-disable-line no-extra-parens

      expect(chunkGenerator).toBeInstanceOf(AsyncGeneratorFunction)
    })

    const buffer = makeFileWithSpecificSize(DEFAULT_STREAM_CHUNK_SIZE * 3)

    test('Must resolve 3 chunks just over one iteration when set multiChunk true', async () => {
      expect.assertions(4)

      const readableStream = fs
        .createReadStream(buffer.filePath, Connection.setReadStreamDefaults({
          end: buffer.length
        }))
      const chunkIterator = Connection.readStreamChunks(readableStream /* , true */)()
      const chunks = (await chunkIterator.next()).value

      for (const chunkIndex in chunks) {
        if (chunkIndex < chunks.length - 1) {
          expect(chunks[chunkIndex].length).toBe(DEFAULT_STREAM_CHUNK_SIZE + 1)
        } else expect(chunks[chunkIndex].length).toBe(DEFAULT_STREAM_CHUNK_SIZE - chunkIndex)
      }

      expect((await chunkIterator.next()).done).toBe(true)
    })

    test('Must resolve one chunk over every iteration(3) when set multiChunk false', async () => {
      expect.assertions(4)

      const readableStream = fs
        .createReadStream(buffer.filePath, Connection.setReadStreamDefaults({
          end: buffer.length
        }))
      const chunkIterator = Connection.readStreamChunks(readableStream, false)()

      let counter = 0

      for await (let chunk of chunkIterator) {
        chunk = chunk[0]

        if (counter < 2) {
          expect(chunk.length).toBe(DEFAULT_STREAM_CHUNK_SIZE + 1)
        } else expect(chunk.length).toBe(DEFAULT_STREAM_CHUNK_SIZE - counter)

        counter++
      }

      expect((await chunkIterator.next()).done).toBe(true)
    })

    afterAll(() => removeFileWithSpecificSize(buffer))
  })
})

afterAll(async () => new Promise(resolve => webSocketServer.close(resolve)))
