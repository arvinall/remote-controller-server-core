/* global test, expect, describe, beforeAll, beforeEach, afterAll, TMP_PATH, generateId */

import makeConnections from '../index'
import makePreferences from '../../preferences'
import makeStorages from '../../storages'
import WebSocket from 'ws'
import * as helpers from './helpers'
import envConfigs from '../../test/configs'

const core = Object.create(null)
const preferencesStorageName = generateId()

core.storages = makeStorages({ path: TMP_PATH })
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
/*
async function getSomeMessages (size = 1, ws) {
  return helpers.getSomeMessages.call(ws, size)
}
*/
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
