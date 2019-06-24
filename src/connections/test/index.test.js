/* global test, expect, describe, beforeAll, beforeEach, afterAll, TMP_PATH, generateId, Buffer */

import Logger from '../../logger'
import makeConnections from '../index'
import makePreferences from '../../preferences'
import makeStorages from '../../storages'
import WebSocket from 'ws'
import * as helpers from './helpers'
import envConfigs from '../../test/configs'
import Passport from '../../passport'
import Connection, { bufferToUint8ArrayLike } from '../connection'

const core = Object.create(null)
const preferencesStorageName = generateId()

core.logger = new Logger(TMP_PATH)
core.storages = makeStorages.call(core, { path: TMP_PATH })
core.preferences = makePreferences.call(core, { name: preferencesStorageName })

const webSocketOptions = { perMessageDeflate: true }
const webSocketServerOptions = {
  host: '127.0.0.1',
  port: 9998,
  perMessageDeflate: true
}
const webSocketServer = new WebSocket.Server(webSocketServerOptions)

webSocketServerOptions.address = `ws://${webSocketServerOptions.host}:${webSocketServerOptions.port}`

let connectionsPreference

async function getSomeSockets (size = 1, id) {
  return helpers.getSomeSockets.call({
    webSocketServerOptions: id ? {
      ...webSocketServerOptions,
      address: `${webSocketServerOptions.address}/?id=${id}`
    } : webSocketServerOptions,
    webSocketOptions,
    webSocketServer
  }, size)
}

async function getSomeMessages (size = 1, ws) {
  return helpers.getSomeMessages.call(ws, size)
}

beforeAll(async () => new Promise(resolve => {
  if (!webSocketServer._server.listening) webSocketServer._server.once('listening', resolve)
  else resolve()
}))

beforeEach(() => jest.setTimeout(envConfigs.timeout))

describe('makeConnections', () => {
  describe('Success', () => {
    test('Must initialize storage with default values', () => {
      ;(() => makeConnections.call(core))()

      const preference = core.preferences.get('connections')

      expect(preference.body).toEqual(expect.objectContaining({
        authenticationFactors: expect.objectContaining({
          confirmation: expect.any(Boolean),
          passport: expect.any(Boolean)
        }),
        removeTimeout: expect.any(Number)
      }))
    })

    test('Must return connections module without error', () => {
      const connections = makeConnections.call(core)

      expect(connections).toEqual(expect.objectContaining({
        authenticationFactors: expect.objectContaining({
          confirmation: expect.any(Boolean),
          passport: expect.any(Boolean)
        }),
        removeTimeout: expect.any(Number),
        add: expect.any(Function),
        remove: expect.any(Function),
        get: expect.any(Function),
        send: expect.any(Function)
      }))
    })
  })

  afterAll(() => {
    core.connections = makeConnections.call(core)

    connectionsPreference = core.preferences.get('connections')
  })
})

describe('connections properties', () => {
  describe('authenticationFactors', () => {
    test('confirmation property default value must be true', () => {
      expect(core.connections.authenticationFactors.confirmation).toBe(true)
    })

    test('confirmation property must ignore non boolean/null value types', () => {
      core.connections.authenticationFactors.confirmation = 'wrong'

      expect(core.connections.authenticationFactors.confirmation).toBe(true)

      core.connections.authenticationFactors.confirmation = [ 'wrong' ]

      expect(core.connections.authenticationFactors.confirmation).toBe(true)

      core.connections.authenticationFactors.confirmation = 123

      expect(core.connections.authenticationFactors.confirmation).toBe(true)
    })

    test('confirmation property must throw error when setted to false and there is not any active authentication factor', () => {
      const ERROR = 'One authentication factor require at least'

      expect(() => {
        core.connections.authenticationFactors.confirmation = false
      }).toThrow(ERROR)
    })

    test('passport property default value must be false', () => {
      expect(core.connections.authenticationFactors.passport).toBe(false)
    })

    test('passport property must ignore non boolean/null value types', () => {
      core.connections.authenticationFactors.passport = 'wrong'

      expect(core.connections.authenticationFactors.passport).toBe(false)

      core.connections.authenticationFactors.passport = [ 'wrong' ]

      expect(core.connections.authenticationFactors.passport).toBe(false)

      core.connections.authenticationFactors.passport = 123

      expect(core.connections.authenticationFactors.passport).toBe(false)
    })

    test('passport property must write/read boolean values into/from preference', () => {
      core.connections.authenticationFactors.passport = true

      expect(connectionsPreference.body.authenticationFactors.passport).toBe(true)

      expect(core.connections.authenticationFactors.passport).toBe(true)

      core.connections.authenticationFactors.passport = false

      expect(connectionsPreference.body.authenticationFactors.passport).toBe(false)

      expect(core.connections.authenticationFactors.passport).toBe(false)
    })

    test('passport property must reset to its default value when setted to null', () => {
      core.connections.authenticationFactors.passport = true
      core.connections.authenticationFactors.passport = null

      expect(connectionsPreference.body.authenticationFactors.passport)
        .toBe(connectionsPreference.defaults.authenticationFactors.passport)

      expect(core.connections.authenticationFactors.passport)
        .toBe(connectionsPreference.defaults.authenticationFactors.passport)
    })

    test('confirmation property must write/read boolean values into/from preference', () => {
      core.connections.authenticationFactors.passport = true

      core.connections.authenticationFactors.confirmation = false

      expect(connectionsPreference.body.authenticationFactors.confirmation).toBe(false)

      expect(core.connections.authenticationFactors.confirmation).toBe(false)

      core.connections.authenticationFactors.confirmation = true

      expect(connectionsPreference.body.authenticationFactors.confirmation).toBe(true)

      expect(core.connections.authenticationFactors.confirmation).toBe(true)

      core.connections.authenticationFactors.passport = null
    })

    test('confirmation property must reset to its default value when setted to null', () => {
      core.connections.authenticationFactors.passport = true

      core.connections.authenticationFactors.confirmation = false
      core.connections.authenticationFactors.confirmation = null

      expect(connectionsPreference.body.authenticationFactors.confirmation)
        .toBe(connectionsPreference.defaults.authenticationFactors.confirmation)

      expect(core.connections.authenticationFactors.confirmation)
        .toBe(connectionsPreference.defaults.authenticationFactors.confirmation)

      core.connections.authenticationFactors.passport = null
    })

    test('passport property must throw error when setted to false and there is not any active authentication factor', () => {
      const ERROR = 'One authentication factor require at least'

      core.connections.authenticationFactors.passport = true
      core.connections.authenticationFactors.confirmation = false

      expect(() => {
        core.connections.authenticationFactors.passport = false
      }).toThrow(ERROR)

      core.connections.authenticationFactors.confirmation = null
      core.connections.authenticationFactors.passport = null
    })
  })

  describe('removeTimeout', () => {
    test('Default value must be 1800000(ms)', () => {
      expect(core.connections.removeTimeout).toBe(1800000)
    })

    test('Must ignore non number/null value types', () => {
      core.connections.removeTimeout = 'wrong'

      expect(core.connections.removeTimeout).toBe(1800000)

      core.connections.removeTimeout = [ 'wrong' ]

      expect(core.connections.removeTimeout).toBe(1800000)

      core.connections.removeTimeout = false

      expect(core.connections.removeTimeout).toBe(1800000)
    })

    test('Must write/read number values into/from preference', () => {
      core.connections.removeTimeout = 123

      expect(connectionsPreference.body.removeTimeout).toBe(123)

      expect(core.connections.removeTimeout).toBe(123)

      core.connections.removeTimeout = 1800000
    })

    test('Must reset to its default value when setted to null', () => {
      core.connections.removeTimeout = 123
      core.connections.removeTimeout = null

      expect(connectionsPreference.body.removeTimeout)
        .toBe(connectionsPreference.defaults.removeTimeout)

      expect(core.connections.removeTimeout)
        .toBe(connectionsPreference.defaults.removeTimeout)
    })
  })

  describe('passport', () => {
    test('Default value must be undefined', () => {
      expect(core.connections.passport).toBeUndefined()
    })

    test('Must ignore non passport/null value types', () => {
      core.connections.passport = 'wrong'

      expect(core.connections.passport).toBeUndefined()

      core.connections.passport = [ 'wrong' ]

      expect(core.connections.passport).toBeUndefined()

      core.connections.passport = 123

      expect(core.connections.passport).toBeUndefined()

      core.connections.passport = false

      expect(core.connections.passport).toBeUndefined()
    })

    test('Must write/read passport values into/from preference', () => {
      const password = 'aB_54321'
      const passport = new Passport('password', password)

      core.connections.passport = passport

      expect(connectionsPreference.body.passport).toEqual(expect.objectContaining({
        type: passport.type,
        hash: passport.hash.toJSON().data,
        salt: passport.salt.toJSON().data
      }))

      expect(core.connections.passport.isEqual(password)).toBe(true)
    })

    test('Must reset to its default value when setted to null', () => {
      const password = 'aB_54321'
      const passport = new Passport('password', password)

      core.connections.passport = passport
      core.connections.passport = null

      expect(connectionsPreference.body.passport)
        .toBe(connectionsPreference.defaults.passport)

      expect(core.connections.passport)
        .toBe(connectionsPreference.defaults.passport)
    })

    test('Must return same instance of Passport on every setting and getting', () => {
      const password = 'aB_54321'
      const passport = new Passport('password', password)

      core.connections.passport = passport

      expect(core.connections.passport).toBe(passport)
    })

    afterAll(() => {
      core.connections.passport = null
    })
  })

  afterAll(() => {
    core.connections.removeTimeout = envConfigs.connectionsRemoveTimeout
  })
})

describe('connections add method', () => {
  describe('Errors', () => {
    test('Must throw error when socket parameter is not ws.WebSocket/Connection', () => {
      const ERROR = 'socket parameter is required and must be ws.WebSocket/Connection'

      expect(core.connections.add.bind(core.connections)).toThrow(ERROR)
      expect(core.connections.add.bind(core.connections, 'wrong')).toThrow(ERROR)
    })

    test('Must throw error when socket parameter is ws.WebSocket and request parameter is not http.IncomingMessage', async () => {
      expect.assertions(2)

      const ERROR = 'request parameter is required and must be http.IncomingMessage'
      const socket = (await getSomeSockets())[0]

      expect(core.connections.add.bind(core.connections, socket)).toThrow(ERROR)
      expect(core.connections.add.bind(core.connections, socket, 'wrong')).toThrow(ERROR)
    })

    test('Must throw error when socket requested id is not exist and close socket with 4001 code', async done => {
      expect.assertions(3)

      const ERROR = 'Previous connection that requested is not exist'
      const socket = (await getSomeSockets(1, 'wrong'))[0]
      const request = socket.request
      const webSocket = socket.__webSocket__
      const CLOSE_CODE = 4001

      webSocket.once('close', (code, description) => {
        expect(code).toBe(CLOSE_CODE)
        expect(description).toBe(ERROR)

        done()
      })

      expect(core.connections.add.bind(core.connections, socket, request)).toThrow(ERROR)
    })

    test('Must throw error when socket requested id is already connect and close socket with 4002 code', async done => {
      expect.assertions(3)

      const ERROR = 'Previous connection that requested is already connect'
      const CLOSE_CODE = 4002

      let connection = (await getSomeSockets())[0]

      connection = core.connections.add(connection, connection.request)

      const socket = (await getSomeSockets(1, connection.id))[0]
      const request = socket.request
      const webSocket = socket.__webSocket__

      expect(core.connections.add.bind(core.connections, socket, request)).toThrow(ERROR)

      webSocket.once('close', (code, description) => {
        expect(code).toBe(CLOSE_CODE)
        expect(description).toBe(ERROR)

        done()
      })
    })
  })

  describe('Success', () => {
    test('Initial/Add new connection via ws.WebSocket instance', async () => {
      expect.assertions(2)

      const socket = (await getSomeSockets())[0]
      const request = socket.request
      const connection = core.connections.add(socket, request)

      expect(connection).toBeInstanceOf(Connection)
      expect(connection.socket).toBe(socket)
    })

    test('Add connection via Connection instance', async () => {
      expect.assertions(1)

      const socket = (await getSomeSockets())[0]
      const connection = new Connection({ socket })

      expect(core.connections.add(connection)).toBe(connection)
    })

    test('Change previous disconnected connection socket via id', async () => {
      expect.assertions(3)

      let socket = (await getSomeSockets())[0]
      let request = socket.request

      const firstConnection = core.connections.add(socket, request)

      firstConnection.disconnect()

      socket = (await getSomeSockets(1, firstConnection.id))[0]
      request = socket.request

      const secondConnection = core.connections.add(socket, request)

      expect(secondConnection).toBe(firstConnection)
      expect(secondConnection.socket).toBe(socket)
      expect(secondConnection.isConnect).toBe(true)
    })
  })
})

describe('connections get method', () => {
  test('Must throw error when id parameter is not string', () => {
    const ERROR = 'id parameter must be string'

    expect(core.connections.get.bind(core.connections, 123)).toThrow(ERROR)
    expect(core.connections.get.bind(core.connections, [ 'wrong' ])).toThrow(ERROR)
  })

  describe('Success', () => {
    beforeEach(() => {
      for (const connection of core.connections.get()) {
        connection.disconnect()
      }
    })

    test('Must return undefined when id is not exist', async () => {
      expect.assertions(1)

      expect(core.connections.get('wrong')).toBeUndefined()
    })

    test('Must return connection by id', async () => {
      expect.assertions(1)

      const socket = (await getSomeSockets())[0]
      const request = socket.request
      const connection = core.connections.add(socket, request)

      expect(core.connections.get(connection.id)).toBe(connection)
    })

    test('Must return an object without any key and length prototype property and it must be iterable', () => {
      const connections = core.connections.get()

      expect(Object.keys(connections).length).toBe(0)
      expect(connections.length).toBe(0)
      expect(connections[Symbol.iterator]).toBeInstanceOf(Function)
      expect(connections[Symbol.iterator]().next).toBeInstanceOf(Function)
    })

    test('Must return connected connections', async () => {
      expect.assertions(8)

      const sockets = await getSomeSockets(3)
      const connections = Object.create({ length: sockets.length })

      for (const socket of sockets) {
        const connection = core.connections.add(socket, socket.request)

        connections[connection.id] = connection
      }

      const connectedConnections = core.connections.get()

      expect(connectedConnections.length).toBe(connections.length)
      expect(Object.keys(connectedConnections).length).toBe(connections.length)

      for (const connectionId of Object.keys(connectedConnections)) {
        expect(connectedConnections[connectionId]).toBe(connections[connectionId])
      }

      for (const connection of connectedConnections) {
        expect(connection).toBe(connections[connection.id])
      }
    })
  })
})

describe('connections remove method', () => {
  test('Must throw error when connection parameter is not Connection/string', () => {
    const ERROR = 'connection parameter is required and must be Connection/string'

    expect(core.connections.remove.bind(core.connections)).toThrow(ERROR)
    expect(core.connections.remove.bind(core.connections, [ 'wrong' ])).toThrow(ERROR)
  })

  describe('Success', () => {
    test('Must return false when id is not exist', async () => {
      expect.assertions(2)

      expect(core.connections.remove('wrong')).toBe(false)

      const socket = (await getSomeSockets())[0]
      const connection = new Connection({ socket })

      expect(core.connections.remove(connection)).toBe(false)
    })

    test('Must remove connection and return true when id is exist', async () => {
      expect.assertions(4)

      const sockets = await getSomeSockets(4)
      const connections = [
        core.connections.add(sockets[0], sockets[0].request),
        core.connections.add(sockets[1], sockets[1].request)
      ]

      expect(core.connections.remove(connections[0])).toBe(true)
      expect(core.connections.get(connections[0].id)).toBeUndefined()
      expect(core.connections.remove(connections[1].id)).toBe(true)
      expect(core.connections.get(connections[1].id)).toBeUndefined()
    })

    test('Must disconnect connection when remove it', async () => {
      expect.assertions(1)

      const socket = (await getSomeSockets())[0]
      const connection = core.connections.add(socket, socket.request)

      core.connections.remove(connection)

      expect(connection.isConnect).toBe(false)
    })
  })
})

describe('connections send method', () => {
  test('Must throw error when name parameter is not string', () => {
    const ERROR = 'name parameter is required and must be string'

    expect(core.connections.send.bind(core.connections)).toThrow(ERROR)
    expect(core.connections.send.bind(core.connections, [ 'wrong' ])).toThrow(ERROR)
  })

  describe('Success', () => {
    beforeEach(() => {
      for (const connection of core.connections.get()) {
        connection.disconnect()
      }
    })

    test('Must not send message when connection(s) is not authenticate', async done => {
      const numberOfConnections = 3

      let counter = 0

      expect.assertions(0)

      setTimeout(() => {
        if (counter === numberOfConnections) done()
      }, envConfigs.timeout / 2)

      const sockets = await getSomeSockets(3)

      for (const socket of sockets) {
        core.connections.add(socket, socket.request)

        getSomeMessages(1, socket.__webSocket__)
          .then(() => {
            counter++

            getSomeMessages(1, socket.__webSocket__)
              .then(() => counter++)
          })
      }

      await core.connections.send('test')
    })

    test('Must send message via name', async done => {
      const numberOfConnections = 3

      expect.assertions(numberOfConnections)

      const sockets = await getSomeSockets(3)

      let counter = 0

      for (const socket of sockets) {
        core.connections.add(socket, socket.request).confirm()

        getSomeMessages(numberOfConnections + 1, socket.__webSocket__)
          .then(([ ,,, [ name ] ]) => {
            expect(name).toBe('test')

            counter++

            if (counter >= numberOfConnections) done()
          })
      }

      await core.connections.send('test')
    })

    test('Must send message via name and body', async done => {
      const numberOfConnections = 3

      expect.assertions(numberOfConnections * 3)

      const sockets = await getSomeSockets(3)

      let counter = 0

      const body = [ 'Some data', Buffer.from('test') ]

      for (const socket of sockets) {
        core.connections.add(socket, socket.request).confirm()

        getSomeMessages(numberOfConnections + 1, socket.__webSocket__)
          .then(([ ,,, [ name, data ] ]) => {
            expect(name).toBe('test')
            expect(data[0]).toBe(body[0])
            expect(data[1]).toEqual(bufferToUint8ArrayLike(body[1]))

            counter++

            if (counter >= numberOfConnections) done()
          })
      }

      await core.connections.send('test', ...body)
    })

    test('Must send message via name and callback', async done => {
      const numberOfConnections = 3

      expect.assertions(numberOfConnections * 2)

      const sockets = await getSomeSockets(3)

      let counter = 0

      for (const socket of sockets) {
        core.connections.add(socket, socket.request).confirm()

        getSomeMessages(numberOfConnections + 1, socket.__webSocket__)
          .then(([ ,,, [ name ] ]) => {
            expect(name).toBe('test')

            socket.__webSocket__.send(JSON
              .stringify([ 'test', [ 'client' ] ]))
          })
      }

      await core.connections.send('test', function callback (data) {
        expect(data).toBe('client')

        counter++

        if (counter >= numberOfConnections) done()
      })
    })

    test('Must send message via name and body and callback', async done => {
      const numberOfConnections = 3

      expect.assertions((numberOfConnections * 2) * 3)

      const sockets = await getSomeSockets(3)

      let counter = 0

      const body = [ 'Some data', Buffer.from('test') ]

      for (const socket of sockets) {
        core.connections.add(socket, socket.request).confirm()

        getSomeMessages(numberOfConnections + 1, socket.__webSocket__)
          .then(([ ,,, [ name, data ] ]) => {
            expect(name).toBe('test')
            expect(data[0]).toBe(body[0])
            expect(data[1]).toEqual(bufferToUint8ArrayLike(body[1]))

            socket.__webSocket__.send(JSON
              .stringify([ 'test', [ 'client', bufferToUint8ArrayLike(body[1]) ] ]))
          })
      }

      await core.connections.send('test', ...body, function callback (...data) {
        expect(data[0]).toBe('client')
        expect(data[1]).toBeInstanceOf(Buffer)
        expect(data[1].equals(body[1])).toBe(true)

        counter++

        if (counter >= numberOfConnections) done()
      })
    })
  })
})

describe('connections events', () => {
  test('Must emit added event when new connection added', async () => {
    expect.assertions(2)

    const socket = (await getSomeSockets())[0]
    const request = socket.request
    const connection = []

    core.connections.once('added', con => {
      expect(con).toBeInstanceOf(Connection)

      connection[1] = con
    })

    connection[0] = core.connections.add(socket, request)

    expect(connection[1]).toBe(connection[0])
  })

  test('Must emit connected event when new connection added', async () => {
    expect.assertions(1)

    const socket = (await getSomeSockets())[0]
    const request = socket.request
    const connection = core.connections.add(socket, request)

    await new Promise(resolve => core.connections.once('connected', con => {
      expect(con).toBe(connection)

      resolve()
    }))
  })

  test('Must emit connected event when connection socket changed', async () => {
    expect.assertions(2)

    const socket = (await getSomeSockets())[0]
    const request = socket.request
    const connection = core.connections.add(socket, request)

    await new Promise(resolve => core.connections.once('connected', con => {
      expect(con).toBe(connection)

      resolve()
    }))

    connection.socket = (await getSomeSockets())[0]

    await new Promise(resolve => core.connections.once('connected', con => {
      expect(con).toBe(connection)

      resolve()
    }))
  })

  test('Must emit removed event when connection removed', async () => {
    expect.assertions(1)

    const socket = (await getSomeSockets())[0]
    const request = socket.request
    const connection = core.connections.add(socket, request)

    core.connections.once('removed', con => expect(con).toBeInstanceOf(Connection))

    core.connections.remove(connection)

    await new Promise(resolve => connection.once('disconnected', resolve))
  })

  test('Must emit disconnected event when connection disconnected', async () => {
    expect.assertions(1)

    const socket = (await getSomeSockets())[0]
    const request = socket.request
    const connection = core.connections.add(socket, request)

    connection.once('connected', connection.disconnect.bind(connection))

    await new Promise(resolve => core.connections.once('disconnected', con => {
      expect(con).toBe(connection)

      resolve()
    }))
  })
})

afterAll(async () => {
  const connectedConnections = core.connections.get().length

  await new Promise(resolve => webSocketServer.close(resolve))

  await new Promise(resolve => {
    let counter = 0

    if (counter >= connectedConnections) return resolve()

    core.connections.on('removed', () => {
      counter++

      if (counter >= connectedConnections) resolve()
    })
  })

  return core.storages.remove(preferencesStorageName)
})
