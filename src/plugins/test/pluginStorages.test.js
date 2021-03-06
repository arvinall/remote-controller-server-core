/* global test, expect, describe, afterAll, TMP_PATH, generateId */

import PluginStorages, {
  NAME_SEPARATOR
} from '../pluginStorages'
import Logger from '../../logger'
import makeStorages from '../../storages'
import Storage from '../../storages/storage'
import EventEmitter from 'events'

// Reset Object class to ES spec instead jest customized class
Object.defineProperty(global, 'Object', {
  value: Object.getPrototypeOf(Object.getPrototypeOf(EventEmitter.constructor)).constructor
})

const core = {}

let storages
let pluginStorages
let prefix

describe('Constructor', () => {
  describe('Errors', () => {
    test('Must throw error when configs parameter is not object', () => {
      const ERROR = 'configs parameter is required and must be object'

      expect(() => new PluginStorages()).toThrow(ERROR)
      expect(() => new PluginStorages('wrong')).toThrow(ERROR)
    })

    test('Must throw error when configs.name property is not string', () => {
      const ERROR = 'configs.name is required and must be string'

      expect(() => new PluginStorages({})).toThrow(ERROR)
      expect(() => new PluginStorages({ name: 123 })).toThrow(ERROR)
    })

    test('Must throw error when configs.storages property is not Storages', () => {
      const ERROR = 'configs.storages is required and must be Storages'

      expect(() => new PluginStorages({ name: 'test' })).toThrow(ERROR)
      expect(() => new PluginStorages({ name: 'test', storages: 'wrong' })).toThrow(ERROR)
    })

    afterAll(() => {
      core.logger = new Logger(TMP_PATH)

      storages = makeStorages.call(core, { path: TMP_PATH })
    })
  })

  test('Initial pluginStorages without error', () => {
    const configs = {
      name: 'test',
      storages
    }
    const pluginStorages = new PluginStorages(configs)

    expect(pluginStorages).toEqual(expect.any(Object))
    expect(pluginStorages).toEqual(expect.objectContaining({
      get: expect.any(Function),
      add: expect.any(Function),
      remove: expect.any(Function),
      removeSync: expect.any(Function),
      has: expect.any(Function),
      path: TMP_PATH
    }))
    expect(pluginStorages + '').toBe('[object PluginStorages]')
  })

  afterAll(() => {
    const name = 'pluginStorages-test-' + generateId()

    pluginStorages = new PluginStorages({
      name,
      storages
    })

    prefix = name + NAME_SEPARATOR
  })
})

describe('add Method', () => {
  test('Must throw error when name parameter is not string', () => {
    const ERROR = 'name parameter is required and must be string'

    expect(() => pluginStorages.add()).toThrow(ERROR)
    expect(() => pluginStorages.add(132)).toThrow(ERROR)
  })

  describe('Success', () => {
    test('Must return Storage with correct name', () => {
      const name = generateId()
      const storage = pluginStorages.add(name)

      expect(storage).toBeInstanceOf(Storage)
      expect(storage.name).toBe(prefix + name)

      storage.removeSync()
    })

    test('Must return Storage with correct body', () => {
      const name = generateId()
      const body = { pluginStorages: 'add with body' }
      const storage = pluginStorages.add(name, body)

      expect(storage).toBeInstanceOf(Storage)
      expect(storage.body).toEqual(body)

      storage.removeSync()
    })
  })
})

describe('get Method', () => {
  test('Must throw error when name parameter is not string', () => {
    const ERROR = 'name parameter is required and must be string'

    expect(() => pluginStorages.get()).toThrow(ERROR)
    expect(() => pluginStorages.get(132)).toThrow(ERROR)
  })

  test('Must return target Storage', () => {
    const name = generateId()
    const storage = pluginStorages.add(name)

    expect(pluginStorages.get(name)).toBe(storage)

    storage.removeSync()
  })
})

describe('remove Method', () => {
  test('Must throw error when storage parameter is not string/Storage', () => {
    const ERROR = 'storage parameter is required and must be string/Storage'

    expect(() => pluginStorages.remove()).toThrow(ERROR)
    expect(() => pluginStorages.remove({})).toThrow(ERROR)
  })

  describe('Success', () => {
    test('Must remove storage correctly via name', async () => {
      const name = generateId()
      const storage = pluginStorages.add(name)

      expect(await pluginStorages.remove(name)).toBeUndefined()
      expect(storage.name).toBeUndefined()
    })

    test('Must remove storage correctly via storage instance', async () => {
      const storage = pluginStorages.add(generateId())

      expect(await pluginStorages.remove(storage)).toBeUndefined()
      expect(storage.name).toBeUndefined()
    })
  })
})

describe('removeSync Method', () => {
  test('Must throw error when storage parameter is not string/Storage', () => {
    const ERROR = 'storage parameter is required and must be string/Storage'

    expect(() => pluginStorages.removeSync()).toThrow(ERROR)
    expect(() => pluginStorages.removeSync({})).toThrow(ERROR)
  })

  describe('Success', () => {
    test('Must remove storage correctly via name', () => {
      const name = generateId()
      const storage = pluginStorages.add(name)

      expect(pluginStorages.removeSync(name)).toBeUndefined()
      expect(storage.name).toBeUndefined()
    })

    test('Must remove storage correctly via storage instance', () => {
      const storage = pluginStorages.add(generateId())

      expect(pluginStorages.removeSync(storage)).toBeUndefined()
      expect(storage.name).toBeUndefined()
    })
  })
})

describe('has Method', () => {
  describe('Success', () => {
    test('Must return false when target storage is not exist', () => {
      expect(pluginStorages.has('test')).toBe(false)
    })

    test('Must return true when target storage is exist', () => {
      const name = generateId()
      const storage = pluginStorages.add(name)

      expect(pluginStorages.has(name)).toBe(true)

      storage.removeSync()
    })
  })
})

describe('Events', () => {
  test('Must emit added event when a Storage added', () => {
    const name = generateId()
    const body = { test: 'added event' }
    const _storages = []

    pluginStorages.once('added', _storages.push.bind(_storages))

    _storages.push(pluginStorages.add(name, body))

    expect(_storages[0]).toBe(_storages[1])

    _storages[1].removeSync()
  })

  test('Must emit removed event when a Storage removed', () => {
    const name = generateId()
    const body = { test: 'removed event' }
    const storage = pluginStorages.add(name, body)

    pluginStorages.once('removed', (_storage, event) => {
      expect(_storage).toBe(storage)
      expect(event).toEqual({
        name: prefix + name,
        body: body
      })
    })

    storage.removeSync()
  })

  test('Must emit updated event when a Storage updated', () => {
    const name = generateId()
    const body = { test: 'updated event' }
    const storage = pluginStorages.add(name, body)
    const updatedBody = Object.assign({}, body, {
      update: 'Updated successfully'
    })

    pluginStorages.once('updated', (_storage, event) => {
      expect(_storage).toBe(storage)
      expect(event).toEqual({
        lastBody: body,
        updatedBody
      })
    })

    storage.updateSync(updatedBody)
    storage.removeSync()
  })
})
