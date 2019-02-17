/* global test, expect, describe */

import path from 'path'
import Storage from '../storage'

const TMP_PATH = path.join(process.cwd(), 'tmp')

function timestamp () {
  return String(Date.now())
}

describe('Storage constructor', () => {
  describe('Errors', () => {
    test('Must throw error when configs parameter is not object', () => {
      const ERROR = 'configs parameter is required and must be object'

      expect(() => new Storage()).toThrow(ERROR)
      expect(() => new Storage('wrong')).toThrow(ERROR)
    })

    test('Must throw error when configs.name property is not string', () => {
      expect(() => new Storage({
        name: 7
      })).toThrow('configs.name is required and must be string')
    })

    test('Must throw error when configs.body property is not undefined/object', () => {
      expect(() => new Storage({
        name: 'testBodyProperty',
        body: 'Hello from test'
      })).toThrow('configs.body must be object')
    })

    test('Must throw error when configs.path property is not string', () => {
      expect(() => new Storage({
        name: 'testPathProperty',
        body: { test: 'Hello from test' },
        path: 7
      })).toThrow('configs.path must be string')
    })

    test('Must throw error when there is no initial content and storage is not accessible', () => {
      let configs = { name: 'testAccessibility' }

      expect(() => new Storage(configs)).toThrow(`${configs.name} is not accessible`)
    })

    test('Must throw error when initial content provided but storage is already exist', () => {
      let configs = {
        name: 'package',
        body: {
          name: 'test-storage-constructor'
        }
      }

      expect(() => new Storage(configs)).toThrow(`${configs.name} is already exist`)
    })
  })

  describe('Success', () => {
    test('Initial storage without error', () => {
      let configs = {
        name: timestamp(),
        body: {
          test: 'Initial storage successfully'
        },
        path: TMP_PATH
      }
      let storageInstance = new Storage(configs)

      expect(storageInstance).toBeInstanceOf(Storage)
      expect(storageInstance).toHaveProperty('body', configs.body)
    })

    test('Read storage without error', () => {
      let configs = {
        name: 'package'
      }
      let storageInstance = new Storage(configs)

      expect(storageInstance).toBeInstanceOf(Storage)
      expect(storageInstance.body.repository.type).toBe('git')
    })
  })
})

describe('Storage remove method', () => {
  describe('Errors', () => {
    test('Must throw error when remove a removed storage (sync)', () => {
      let body = { test: 'Remove twice storage (sync)' }
      let storage = new Storage({
        name: timestamp(),
        path: TMP_PATH,
        body
      })

      storage.remove()

      expect(storage.body).toBeUndefined()
      expect(storage.remove.bind(storage)).toThrow('Storage is not accessible')
    })

    test('Must throw error when remove a removed storage (async)', async () => {
      expect.assertions(2)

      let body = { test: 'Remove twice storage (async)' }
      let storage = new Storage({
        name: timestamp(),
        path: TMP_PATH,
        body
      })

      await storage.remove({ sync: false })

      expect(storage.body).toBeUndefined()

      try {
        await storage.remove({ sync: false })
      } catch (error) {
        expect(error.message).toBe('Storage is not accessible')
      }
    })
  })

  describe('Success', () => {
    test('Remove storage without error (sync)', () => {
      let body = {
        test: 'Remove storage without error (sync)'
      }
      let storage = new Storage({
        name: timestamp(),
        path: TMP_PATH,
        body
      })

      expect(storage.remove()).toBeUndefined()

      expect(storage.body).toBeUndefined()
    })

    test('Remove storage without error (async)', async () => {
      expect.assertions(2)

      let body = {
        test: 'Remove storage without error (async)'
      }
      let storage = new Storage({
        name: timestamp(),
        path: TMP_PATH,
        body
      })

      expect(await storage.remove({ sync: false })).toBeUndefined()

      expect(storage.body).toBeUndefined()
    })
  })
})

describe('Storage update method', () => {
  describe('Errors', () => {
    test('Must throw error when body parameter is undefined', () => {
      let body = {
        test: 'Update storage without body parameter'
      }
      let storage = new Storage({
        name: timestamp(),
        path: TMP_PATH,
        body
      })

      expect(storage.update.bind(storage)).toThrow('body parameter is required and must be object/function')

      storage.remove()
    })

    test('Must throw error when body parameter is not object/function', () => {
      let body = {
        test: 'Update storage with non object/function body parameter'
      }
      let storage = new Storage({
        name: timestamp(),
        path: TMP_PATH,
        body
      })

      expect(storage.update.bind(storage, body.test)).toThrow('body parameter is required and must be object/function')

      storage.remove()
    })

    test('Must throw error when storage is deleted and not accessible (sync)', () => {
      let body = {
        test: 'Update deleted storage (sync)'
      }
      let storage = new Storage({
        name: timestamp(),
        path: TMP_PATH,
        body
      })

      storage.remove()

      expect(storage.update.bind(storage, Object.assign({}, body, {
        update: 'Ops'
      }))).toThrow('Storage is not accessible')
    })

    test('Must throw error when storage is deleted and not accessible (async)', async () => {
      expect.assertions(1)

      let body = {
        test: 'Update deleted storage (async)'
      }
      let storage = new Storage({
        name: timestamp(),
        path: TMP_PATH,
        body
      })

      await storage.remove({ sync: false })

      try {
        await storage.update(storage, Object.assign({}, body, {
          update: 'Ops'
        }), { sync: false })
      } catch (error) {
        expect(error.message).toBe('Storage is not accessible')
      }
    })
  })

  describe('Success', () => {
    test('Update via object without error (sync)', () => {
      let body = {
        test: 'Update storage with object body parameter (sync)'
      }
      let storage = new Storage({
        name: timestamp(),
        path: TMP_PATH,
        body
      })

      expect(storage.update(Object.assign(body, {
        update: 'Updated'
      }))).toBeUndefined()

      expect(storage.body).toEqual(body)

      storage.remove()
    })

    test('Update via object without error (async)', async () => {
      expect.assertions(2)

      let body = {
        test: 'Update storage with object body parameter (async)'
      }
      let storage = new Storage({
        name: timestamp(),
        path: TMP_PATH,
        body
      })

      expect(await storage.update(Object.assign(body, {
        update: 'Updated'
      }), { sync: false })).toBeUndefined()

      expect(storage.body).toEqual(body)

      await storage.remove({ sync: false })
    })

    test('Update via function without error (sync)', () => {
      let updatedBody
      let body = {
        test: 'Update storage with function body parameter (sync)'
      }
      let storage = new Storage({
        name: timestamp(),
        path: TMP_PATH,
        body
      })

      expect(storage.update(body => {
        body.update = 'Updated'

        updatedBody = body

        return body
      })).toBeUndefined()

      expect(storage.body).toEqual(updatedBody)

      storage.remove()
    })

    test('Update via function without error (async)', async () => {
      expect.assertions(2)

      let updatedBody
      let body = {
        test: 'Update storage with function body parameter (async)'
      }
      let storage = new Storage({
        name: timestamp(),
        path: TMP_PATH,
        body
      })

      expect(await storage.update(body => {
        body.update = 'Updated'

        updatedBody = body

        return body
      }, { sync: false })).toBeUndefined()

      expect(storage.body).toEqual(updatedBody)

      await storage.remove()
    })
  })
})
