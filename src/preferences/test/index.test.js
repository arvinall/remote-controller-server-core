/* global test, expect, describe */

import path from 'path'
import storagesMaker from '../../storages'
import preferencesMaker from '../index'

const storages = storagesMaker({ path: path.join(process.cwd(), 'tmp') })

function timestamp () {
  return String(Date.now())
}

describe('preferencesMaker', () => {
  describe('Errors', () => {
    test('Must throw error when configs parameter is not object', () => {
      const ERROR = 'configs parameter is required and must be object'

      expect(preferencesMaker.bind(null, 'wrong')).toThrow(ERROR)
      expect(preferencesMaker).toThrow(ERROR)
    })

    test('Must throw error when configs.storages is not object or doesnt have initialize method', () => {
      const ERROR = 'configs.storages is required and must be storages'
      const configs = { storages: 'wrong' }

      expect(preferencesMaker.bind(null, configs)).toThrow(ERROR)

      configs.storages = {}

      expect(preferencesMaker.bind(null, configs)).toThrow(ERROR)

      configs.storages = undefined

      expect(preferencesMaker.bind(null, configs)).toThrow(ERROR)
    })

    test('Must throw error when configs.name is not string', () => {
      const ERROR = 'configs.name is required and must be string'
      const configs = {
        storages,
        name: ['wrong']
      }

      expect(preferencesMaker.bind(null, configs)).toThrow(ERROR)

      configs.name = undefined

      expect(preferencesMaker.bind(null, configs)).toThrow(ERROR)
    })

    test('Must throw error when another instance using this preferences name', () => {
      const configs = {
        storages,
        name: timestamp()
      }
      const ERROR = `${configs.name} is already in use`

      preferencesMaker(configs)

      expect(preferencesMaker.bind(null, configs)).toThrow(ERROR)

      storages.remove(configs.name)
    })
  })

  test('Must return preferences module without error', () => {
    const configs = {
      name: timestamp(),
      storages
    }

    expect(preferencesMaker(configs)).toEqual(expect.objectContaining({
      get: expect.any(Function),
      initialize: expect.any(Function),
      remove: expect.any(Function),
      has: expect.any(Function)
    }))

    storages.remove(configs.name)
  })
})

const preferences = preferencesMaker({
  name: timestamp(),
  storages
})

describe('preferences get method', () => {
  test('Must throw error when name parameter is not string', () => {
    const ERROR = 'name parameter is required and must be string'

    expect(preferences.get.bind(preferences, ['wrong'])).toThrow(ERROR)
    expect(preferences.get.bind(preferences)).toThrow(ERROR)
  })
})
