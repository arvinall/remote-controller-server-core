/* global test, expect, describe */

import path from 'path'
import Storage from '../storage'

const TMP_PATH = path.join(process.cwd(), 'tmp')

function timestamp (length = 6) {
  let timeStamp = String(Date.now())

  return timeStamp.slice(timeStamp.length - length, timeStamp.length)
}

describe('Storage constructor', () => {
  describe('Errors', () => {
    test('Must throw error without configs parameter', () => {
      expect(() => new Storage()).toThrow('configs parameter is require')
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

      expect(storage.body).toEqual(body)

      storage.remove()

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

      expect(storage.body).toEqual(body)

      await storage.remove()

      try {
        await storage.remove()
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

      expect(storage.body).toEqual(body)

      expect(storage.remove()).toBeUndefined()

      expect(storage.body).toBeUndefined()
    })

    test('Remove storage without error (async)', async () => {
      expect.assertions(3)

      let body = {
        test: 'Remove storage without error (async)'
      }
      let storage = new Storage({
        name: timestamp(),
        path: TMP_PATH,
        body
      })

      expect(storage.body).toEqual(body)

      try {
        expect(await storage.remove({ sync: false })).toBeUndefined()
      } catch (error) {
        throw error
      }

      expect(storage.body).toBeUndefined()
    })
  })
})
