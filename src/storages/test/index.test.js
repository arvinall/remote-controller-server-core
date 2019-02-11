/* global test, expect, describe */

import path from 'path'
import Storage from '../storage'
import storagesMaker from '../index'

const TMP_PATH = path.join(process.cwd(), 'tmp')

function timestamp () {
  return String(Date.now())
}

test('storages default must return storages module without error', () => {
  let storages = storagesMaker({ path: TMP_PATH })

  expect(storages).toEqual(expect.any(Object))
  expect(storages).toEqual(expect.objectContaining({
    get: expect.any(Function),
    initialize: expect.any(Function),
    remove: expect.any(Function)
  }))
})

const storages = storagesMaker({ path: TMP_PATH })

describe('storages get method', () => {
  describe('Errors', () => {
    test('Must throw error when name parameter is not string', () => {
      const ERROR = 'name parameter is required and must be string'

      expect(storages.get.bind(storages)).toThrow(ERROR)
      expect(storages.get.bind(storages, 111)).toThrow(ERROR)
    })
  })

  describe('Success', () => {
    test('Read storage without error', () => {
      let configs = {
        name: timestamp(),
        body: { test: 'Read storage via storages module' },
        path: TMP_PATH
      }
      // Create Storage to test
      let storage1 = new Storage(configs)

      let storage2 = storages.get(configs.name)

      expect(storage2).toEqual(expect.objectContaining({
        name: configs.name,
        body: configs.body
      }))

      storage1.remove()
    })
  })
})

describe('storages initialize method', () => {
  describe('Errors', () => {
    test('Must throw error when name parameter is not string', () => {
      expect(storages.initialize
        .bind(storages, Number(timestamp())))
        .toThrow('name parameter is required and must be string')
    })

    test('Must throw error when body parameter is not undefined/object', () => {
      expect(storages.initialize
        .bind(storages, timestamp(), 'Test string body to initialize'))
        .toThrow('body parameter must be object')
    })

    test('Must throw error when initialize existing storage', () => {
      const configs = {
        name: timestamp(),
        body: { test: 'Initialize storage twice' }
      }
      const storage = storages.initialize(configs.name, configs.body)

      expect(storages.initialize
        .bind(storages, configs.name, configs.body))
        .toThrow(`${configs.name} is already exist`)

      storage.remove()
    })
  })

  describe('Success', () => {
    test('Initialize storage without error', () => {
      const configs = {
        name: timestamp(),
        body: { test: 'Initialize storage via storages' }
      }
      const storage = storages.initialize(configs.name, configs.body)

      expect(storage).toEqual(expect.objectContaining(configs))

      storage.remove()
    })
  })
})

describe('storages remove method', () => {
  describe('Errors', () => {
    test('Must throw error when storage parameter is not string/Storage', () => {
      const ERROR = 'storage parameter is required and must be string/Storage'

      expect(storages.remove.bind(storages)).toThrow(ERROR)
      expect(storages.remove.bind(storages, 111)).toThrow(ERROR)
    })

    test('Must throw error when storage parameter is instance of Storage and deleted before (sync)', () => {
      const ERROR = 'storage is not accessible'
      let storage = new Storage({
        name: timestamp(),
        body: { test: 'Delete a deleted storage (sync)' },
        path: TMP_PATH
      })

      storage.remove()

      expect(storages.remove.bind(storages, storage)).toThrow(ERROR)
    })

    test('Must throw error when storage parameter is instance of Storage and deleted before (async)', async () => {
      expect.assertions(1)

      const ERROR = 'storage is not accessible'
      let storage = new Storage({
        name: timestamp(),
        body: { test: 'Delete a deleted storage (sync)' },
        path: TMP_PATH
      })

      await storage.remove({ sync: false })

      try {
        await storages.remove(storage, { sync: false })
      } catch (error) {
        expect(error.message).toBe(ERROR)
      }
    })

    test('Must throw error when Storage is not exist in list (sync)', () => {
      const name = timestamp()
      const ERROR = `${name} is not exist in list`

      expect(storages.remove.bind(storages, name)).toThrow(ERROR)
    })

    test('Must throw error when Storage is not exist in list (async)', async () => {
      expect.assertions(1)

      const name = timestamp()
      const ERROR = `${name} is not exist in list`

      try {
        await storages.remove(name, { sync: false })
      } catch (error) {
        expect(error.message).toBe(ERROR)
      }
    })
  })

  describe('Success', () => {
    test('Remove storage via name without error (sync)', () => {
      const name = timestamp()

      storages.initialize(name, { test: 'Delete Storage via name (sync)' })

      expect(storages.remove(name)).toBeUndefined()
    })

    test('Remove storage via name without error (async)', async () => {
      expect.assertions(1)

      const name = timestamp()

      storages.initialize(name, { test: 'Delete Storage via name (async)' })

      expect(await storages.remove(name, { sync: false })).toBeUndefined()
    })

    test('Remove storage via Storage instance without error (sync)', () => {
      const name = timestamp()
      const storage = storages.initialize(name, { test: 'Delete Storage via Storage instance (sync)' })

      expect(storages.remove(storage)).toBeUndefined()
      expect(storage.name).toBeUndefined()
      expect(storage.body).toBeUndefined()
    })

    test('Remove storage via Storage instance without error (async)', async () => {
      expect.assertions(3)

      const name = timestamp()
      const storage = storages.initialize(name, { test: 'Delete Storage via Storage instance (async)' })

      expect(await storages.remove(storage, { sync: false })).toBeUndefined()
      expect(storage.name).toBeUndefined()
      expect(storage.body).toBeUndefined()
    })
  })
})
