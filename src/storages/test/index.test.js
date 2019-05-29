/* global test, expect, describe, afterAll, generateId, TMP_PATH */

import Storage from '../storage'
import makeStorages from '../index'

let storages

describe('makeStorages', () => {
  test('must return storages module without error', () => {
    let storages = makeStorages({ path: TMP_PATH })

    expect(storages).toEqual(expect.any(Object))
    expect(storages).toEqual(expect.objectContaining({
      get: expect.any(Function),
      add: expect.any(Function),
      remove: expect.any(Function)
    }))
  })

  afterAll(() => { storages = makeStorages({ path: TMP_PATH }) })
})

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
        name: generateId(),
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

describe('storages add method', () => {
  describe('Errors', () => {
    test('Must throw error when storage parameter is not Storage/string', () => {
      expect(storages.add
        .bind(storages, Number(generateId())))
        .toThrow('storage parameter is required and must be Storage/string')
    })

    test('Must throw error when body parameter is not undefined/object', () => {
      expect(storages.add
        .bind(storages, generateId(), 'Test string body to add'))
        .toThrow('body parameter must be object')
    })

    test('Must throw error when add existing storage', () => {
      const configs = {
        name: generateId(),
        body: { test: 'Initialize storage twice' }
      }
      const storage = storages.add(configs.name, configs.body)

      expect(storages.add
        .bind(storages, configs.name, configs.body))
        .toThrow(`${configs.name} is already exist`)

      storage.remove()
    })
  })

  describe('Success', () => {
    test('Add storage without error', () => {
      const configs = {
        name: generateId(),
        body: { test: 'Initialize storage via storages' }
      }
      const storage = storages.add(new Storage({
        ...configs,
        path: TMP_PATH
      }))

      expect(storage).toEqual(expect.objectContaining(configs))
      expect(storages.get(storage.name)).toBe(storage)

      storage.remove()
    })

    test('Initialize storage without error', () => {
      const configs = {
        name: generateId(),
        body: { test: 'Initialize storage via storages' }
      }
      const storage = storages.add(configs.name, configs.body)

      expect(storage).toEqual(expect.objectContaining(configs))
      expect(storages.get(storage.name)).toBe(storage)

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
      expect(storages.removeSync.bind(storages)).toThrow(ERROR)
      expect(storages.removeSync.bind(storages, 111)).toThrow(ERROR)
    })

    test('Must throw error when storage parameter is instance of Storage and deleted before (sync)', () => {
      const ERROR = 'Storage is not accessible'
      let storage = new Storage({
        name: generateId(),
        body: { test: 'Delete a deleted storage (sync)' },
        path: TMP_PATH
      })

      storage.removeSync()

      expect(storages.removeSync.bind(storages, storage)).toThrow(ERROR)
    })

    test('Must throw error when storage parameter is instance of Storage and deleted before (async)', async () => {
      expect.assertions(1)

      const ERROR = 'Storage is not accessible'
      let storage = new Storage({
        name: generateId(),
        body: { test: 'Delete a deleted storage (sync)' },
        path: TMP_PATH
      })

      await storage.remove()

      try {
        await storages.remove(storage)
      } catch (error) {
        expect(error.message).toBe(ERROR)
      }
    })

    test('Must throw error when Storage is not exist in list (sync)', () => {
      const name = generateId()
      const ERROR = `${name} is not exist in list`

      expect(storages.removeSync.bind(storages, name)).toThrow(ERROR)
    })

    test('Must throw error when Storage is not exist in list (async)', async () => {
      expect.assertions(1)

      const name = generateId()
      const ERROR = `${name} is not exist in list`

      try {
        await storages.remove(name)
      } catch (error) {
        expect(error.message).toBe(ERROR)
      }
    })
  })

  describe('Success', () => {
    test('Remove storage via name without error (sync)', () => {
      const storage = storages.add(generateId(), { test: 'Delete Storage via name (sync)' })

      expect(storages.removeSync(storage.name)).toBeUndefined()
      expect(storage).toEqual(expect.objectContaining({
        name: undefined,
        body: undefined
      }))
    })

    test('Remove storage via name without error (async)', async () => {
      expect.assertions(2)

      const storage = storages.add(generateId(), { test: 'Delete Storage via name (async)' })

      expect(await storages.remove(storage.name)).toBeUndefined()
      expect(storage).toEqual(expect.objectContaining({
        name: undefined,
        body: undefined
      }))
    })

    test('Remove storage via Storage instance without error (sync)', () => {
      const storage = storages.add(generateId(), {
        test: 'Delete Storage via Storage instance (sync)'
      })

      expect(storages.removeSync(storage)).toBeUndefined()
      expect(storage).toEqual(expect.objectContaining({
        name: undefined,
        body: undefined
      }))
    })

    test('Remove storage via Storage instance without error (async)', async () => {
      expect.assertions(2)

      const storage = storages.add(generateId(), { test: 'Delete Storage via Storage instance (async)' })

      expect(await storages.remove(storage)).toBeUndefined()
      expect(storage).toEqual(expect.objectContaining({
        name: undefined,
        body: undefined
      }))
    })
  })
})

test('storages has method must return right value', () => {
  const storage = storages.add(generateId(), { test: 'has method' })
  const name = storage.name

  expect(storages.has(name)).toBe(true)

  storages.removeSync(name)

  expect(storages.has(name)).toBe(false)
})

test(`storages path property must return ${TMP_PATH}`, () => {
  expect(storages.path).toBe(TMP_PATH)
})
