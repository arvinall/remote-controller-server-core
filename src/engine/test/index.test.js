/* global test, expect, describe, jest, afterAll, afterEach */

import envConfigs from './configs'
import engineIOClient from 'engine.io-client'
import engineMaker from '../index'

const engineConfigs = { port: 8888, path: '/test' }

let engine

afterEach(() => jest.setTimeout(5000))

describe('engineMaker', () => {
  describe('Errors', () => {
    test('Must throw error when configs parameter is not object', () => {
      const ERROR = 'configs parameter must be object'

      expect(engineMaker.bind(null, 'wrong')).toThrow(ERROR)
    })

    test('Must throw error when configs.port property is not number', () => {
      const ERROR = 'configs.port must be number'
      const configs = { port: 'wrong' }

      expect(engineMaker.bind(null, configs)).toThrow(ERROR)
    })

    test('Must throw error when configs.path property is not string and dont starts with "/"', () => {
      const ERROR = 'configs.path must be string and starts with "/"'
      const configs = { path: 'wrong' }

      expect(engineMaker.bind(null, configs)).toThrow(ERROR)
      configs.path = false
      expect(engineMaker.bind(null, configs)).toThrow(ERROR)
    })
  })

  test('engineMaker must return engine module without error', () => {
    const configs = {
      port: 8888
    }
    const engine = engineMaker(configs)

    expect(engine).toEqual(expect.any(Object))
    expect(engine).toEqual(expect.objectContaining({
      start: expect.any(Function),
      stop: expect.any(Function),
      address: expect.any(Object),
      isActive: expect.any(Boolean)
    }))
    expect(engine.address).toEqual(expect.any(Object))
    expect(engine.address.port).toBe(configs.port)
    expect(typeof engine.address.ip === 'string' || engine.address.ip === null).toBe(true)
  })

  afterAll(() => { engine = engineMaker(engineConfigs) })
})

describe('engine start method', () => {
  describe('Errors', () => {
    test('Must throw error when port parameter is not number', () => {
      const ERROR = 'port parameter must be number'

      expect(engine.start.bind(engine, 'wrong')).toThrow(ERROR)
    })

    test('Must throw error if engine already started (async)', async () => {
      expect.assertions(1)

      const ERROR = 'Engine already started'

      await engine.start()

      try {
        await engine.start()
      } catch (error) {
        expect(error.message).toBe(ERROR)
      }

      await engine.stop()
    })
  })

  test('Start webSocket server without error (async)', async () => {
    expect.assertions(3)

    jest.setTimeout(envConfigs.timeout)

    expect(await engine.start()).toBeUndefined()
    expect(engine.isActive).toBe(true)

    const webSocketClient = new engineIOClient
      .Socket(`ws://${engine.address.ip}:${engine.address.port}`, {
        path: engineConfigs.path,
        transports: ['websocket']
      })

    return new Promise(resolve => webSocketClient.on('open', resolve))
      .then(() => expect(webSocketClient.readyState).toBe('open'))
      .then(async () => {
        webSocketClient.close()
        await engine.stop()
      })
  })
})

describe('engine stop method', () => {
  test('Must throw error if engine already stopped', async () => {
    expect.assertions(1)

    const ERROR = 'Engine already stopped'

    if (engine.isActive) await engine.stop()

    try {
      await engine.stop()
    } catch (error) {
      expect(error.message).toBe(ERROR)
    }
  })

  test('Stop webSocket server without error (async)', async () => {
    expect.assertions(2)

    jest.setTimeout(envConfigs.timeout)

    await engine.start()

    const webSocketClient = new engineIOClient
      .Socket(`ws://${engine.address.ip}:${engine.address.port}`, {
        path: engineConfigs.path,
        transports: ['websocket']
      })

    await new Promise(resolve => webSocketClient.on('open', resolve))
      .then(async () => expect(await engine.stop()).toBeUndefined())

    return new Promise(resolve => webSocketClient.on('close', resolve))
      .then(() => expect(webSocketClient.readyState).toBe('closed'))
  })
})

describe('engine events', () => {
  test('Must emit started event when engine started', async done => {
    engine.once('started', done)

    await engine.start()
    await engine.stop()
  })

  test('Must emit stopped event when engine stopped', async done => {
    engine.once('stopped', done)

    await engine.start()
    await engine.stop()
  })
})

afterAll(async () => { if (engine.isActive) await engine.stop() })
