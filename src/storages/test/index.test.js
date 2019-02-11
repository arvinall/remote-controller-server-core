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
