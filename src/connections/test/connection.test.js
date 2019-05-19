/* global test, expect, describe, beforeEach, beforeAll, afterAll, jest, TMP_PATH */

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

async function getSocket () {
  return new Promise(resolve => {
    webSocketServer.once('connection', (...args) => resolve(args))
  })
}

async function getSomeMessages (size = 1, ws = webSocket) {
  return new Promise(resolve => {
    const result = []

    ws.on('message', function getData (data) {
      result.push(JSON.parse(data))

      if (result.length >= size) {
        ws.off('message', getData)

        resolve(result)
      }
    })
  })
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

    describe('Must sends authentications ask status messages when connected', () => {
      test('Factor: confirmation', async () => {
        expect.assertions(3)

        const webSocket = new WebSocket(webSocketServerOptions.address, webSocketOptions)
        const [ socket, request ] = await getSocket()

        webSocket.once('error', () => {})

        socket.request = request
        configs.socket = socket

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

        const webSocket = new WebSocket(webSocketServerOptions.address, webSocketOptions)
        const [ socket, request ] = await getSocket()

        webSocket.once('error', () => {})

        socket.request = request
        configs.socket = socket

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

        const webSocket = new WebSocket(webSocketServerOptions.address, webSocketOptions)
        const [ socket, request ] = await getSocket()

        webSocket.once('error', () => {})

        socket.request = request
        configs.socket = socket

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
  })

  afterAll(async () => {
    configs.authenticationFactors.confirmation = false
    configs.authenticationFactors.passport = true

    webSocket = new WebSocket(webSocketServerOptions.address, webSocketOptions)

    webSocket.once('error', () => {})

    socket = await getSocket()
    socket[0].request = socket[1]
    socket = socket[0]

    configs.socket = socket

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

  test('Connection isAuthenticate property must return false when passport is not provided', () => {
    expect(connection.isAuthenticate).toBe(false)
  })

  test('Connection isAuthenticate property must return true when passport is provided', async () => {
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

  test('Connection isConnected property must return true when connection is established', () => {
    expect(connection.isConnected).toBe(true)
  })

  test('Connection isConnected property must return false when connection is not established', () => {
    socket.close()

    expect(connection.isConnected).toBe(false)
  })

  afterAll(async () => {
    webSocket = new WebSocket(webSocketServerOptions.address, webSocketOptions)

    webSocket.once('error', () => {})

    socket = await getSocket()
    socket[0].request = socket[1]
    socket = socket[0]

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

  afterAll(async () => {
    connection.confirm()

    await getSomeMessages()

    if (connection.isAuthenticate) {
      connection.confirm(false)

      await getSomeMessages(2)
    } else {
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

      connection.confirm(false)

      await getSomeMessages(2)
    }
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
      const webSocket = new WebSocket(webSocketServerOptions.address, webSocketOptions)

      webSocket.once('error', () => {})

      let socket = await getSocket()
      socket[0].request = socket[1]
      socket = socket[0]

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

test('Connection disconnect method must close socket successfully', done => {
  connection.disconnect()

  webSocket.once('close', () => done())
})

describe('Connection events', () => {
  describe('Authentication', () => {
    test('Emit confirmation factor status', async done => {
      expect.assertions(10)

      const webSocket = new WebSocket(webSocketServerOptions.address, webSocketOptions)

      webSocket.once('error', () => {})

      let socket = await getSocket()
      socket[0].request = socket[1]
      socket = socket[0]

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

      const webSocket = new WebSocket(webSocketServerOptions.address, webSocketOptions)

      webSocket.once('error', () => {})

      let socket = await getSocket()
      socket[0].request = socket[1]
      socket = socket[0]

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

      const webSocket = new WebSocket(webSocketServerOptions.address, webSocketOptions)

      webSocket.once('error', () => {})

      let socket = await getSocket()
      socket[0].request = socket[1]
      socket = socket[0]

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
    const webSocket = new WebSocket(webSocketServerOptions.address, webSocketOptions)

    webSocket.once('error', () => {})

    let socket = await getSocket()
    socket[0].request = socket[1]
    socket = socket[0]

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
  test('Must throw error when readableStream parameter is not readableStream', () => {
    const ERROR = 'readableStream parameter is required and must be readableStream'

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
