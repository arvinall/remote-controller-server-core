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
    test('must throw error without configs parameter', () => {
      expect(() => new Storage()).toThrow('configs parameter is require')
    })

    test('must throw error when configs.name property is not string', () => {
      expect(() => new Storage({
        name: 7
      })).toThrow('configs.name is required and must be string')
    })

    test('must throw error when configs.body property is not undefined/object', () => {
      expect(() => new Storage({
        name: 'testBodyProperty',
        body: 'Hello from test'
      })).toThrow('configs.body must be object')
    })

    test('must throw error when configs.path property is not string', () => {
      expect(() => new Storage({
        name: 'testPathProperty',
        body: { test: 'Hello from test' },
        path: 7
      })).toThrow('configs.path must be string')
    })

    test('must throw error when there is no initial content and storage is not accessible', () => {
      let configs = { name: 'testAccessibility' }

      expect(() => new Storage(configs)).toThrow(`${configs.name} is not accessible`)
    })

    test('must throw error when initial content provided but storage is already exist', () => {
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
    test('Initial storage', () => {
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

    test('Read storage', () => {
      let configs = {
        name: 'package'
      }
      let storageInstance = new Storage(configs)

      expect(storageInstance).toBeInstanceOf(Storage)
      expect(storageInstance.body.repository.type).toBe('git')
    })
  })
})
