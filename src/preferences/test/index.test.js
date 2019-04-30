/* global test, expect, describe, afterAll, generateId, TMP_PATH */

import makeStorages from '../../storages'
import preferencesMaker from '../index'
import Preference from '../preference'

const storages = makeStorages({ path: TMP_PATH })
const core = { storages }
const makePreferences = preferencesMaker.bind(core)

let preferencesStorageName
let preferences

describe('makePreferences', () => {
  describe('Errors', () => {
    test('Must throw error when configs parameter is not object', () => {
      const ERROR = 'configs parameter is required and must be object'

      expect(makePreferences.bind(null, 'wrong')).toThrow(ERROR)
      expect(makePreferences).toThrow(ERROR)
    })

    test('Must throw error when configs.name is not string', () => {
      const ERROR = 'configs.name must be string'
      const configs = { name: ['wrong'] }

      expect(makePreferences.bind(null, configs)).toThrow(ERROR)

      configs.name = undefined

      expect(makePreferences.bind(null, configs)).toThrow(ERROR)
    })

    test('Must throw error when another instance using this preferences name', () => {
      const configs = { name: generateId() }
      const ERROR = `${configs.name} is already in use`

      makePreferences(configs)

      expect(makePreferences.bind(null, configs)).toThrow(ERROR)

      storages.remove(configs.name)
    })
  })

  test('Must return preferences module without error', () => {
    const configs = { name: generateId() }

    expect(makePreferences(configs)).toEqual(expect.objectContaining({
      get: expect.any(Function),
      initialize: expect.any(Function),
      remove: expect.any(Function),
      has: expect.any(Function)
    }))

    storages.remove(configs.name)
  })

  afterAll(() => {
    preferencesStorageName = generateId()
    preferences = makePreferences({ name: preferencesStorageName })
  })
})

describe('preferences get method', () => {
  test('Must throw error when name parameter is not string', () => {
    const ERROR = 'name parameter is required and must be string'

    expect(preferences.get.bind(preferences, ['wrong'])).toThrow(ERROR)
    expect(preferences.get.bind(preferences)).toThrow(ERROR)
  })

  describe('Success', () => {
    test('Return Preference without error', () => {
      const configs = {
        name: generateId(),
        storage: storages.get(preferencesStorageName),
        body: { test: 'preferences get method test' }
      }

      let preference = new Preference(configs)

      preference = preferences.get(configs.name)

      expect(preference).toEqual(expect.objectContaining({
        name: configs.name,
        body: configs.body
      }))
    })

    test('Return same Preference when call get twice', () => {
      const configs = {
        name: generateId(),
        storage: storages.get(preferencesStorageName),
        body: { test: 'preferences get method caching test' }
      }

      let preference1 = new Preference(configs)

      preference1 = preferences.get(configs.name)

      let preference2 = preferences.get(configs.name)

      expect(preference1).toBe(preference2)
    })
  })
})

describe('preferences initialize method', () => {
  describe('Errors', () => {
    test('Must throw error when name parameter is not string', () => {
      const ERROR = 'name parameter is required and must be string'

      expect(preferences.initialize.bind(preferences, ['wrong'])).toThrow(ERROR)
      expect(preferences.initialize.bind(preferences)).toThrow(ERROR)
    })

    test('Must throw error when body parameter is defined but not string', () => {
      const ERROR = 'body parameter must be object'

      expect(preferences.initialize.bind(preferences, generateId(), 'wrong')).toThrow(ERROR)
    })

    test('Must throw error when initializing an existing Preference', () => {
      const name = generateId()
      const ERROR = `${name} is already exist`

      let preference = new Preference({
        name,
        storage: storages.get(preferencesStorageName),
        body: { test: 'Initialize an existing Preference' }
      })

      preferences.get(name)

      expect(preferences.initialize.bind(preferences, name, preference.body)).toThrow(ERROR)
    })
  })

  test('Initialize and return Preference without error', () => {
    const name = generateId()
    const body = { test: 'Initialize Preference successfully' }
    const preference = preferences.initialize(name, body)

    expect(preference.name).toBe(name)
    expect(preference.body).toEqual(body)
  })
})

describe('preferences remove method', () => {
  describe('Errors', () => {
    test('Must throw error when preference parameter is not string/Preference', () => {
      const ERROR = 'preference parameter is required and must be string/Preference'

      expect(preferences.remove.bind(preferences, ['wrong'])).toThrow(ERROR)
      expect(preferences.remove.bind(preferences)).toThrow(ERROR)
    })

    test('Must throw error when Preference removed before (sync)', () => {
      const ERROR = 'Preference is not accessible'
      const preference = new Preference({
        name: generateId(),
        storage: storages.get(preferencesStorageName),
        body: { test: 'Remove a removed Preference (sync)' }
      })

      preference.remove()

      expect(preferences.remove.bind(preferences, preference)).toThrow(ERROR)
    })

    test('Must throw error when Preference removed before (async)', async () => {
      expect.assertions(1)

      const ERROR = 'Preference is not accessible'
      const preference = new Preference({
        name: generateId(),
        storage: storages.get(preferencesStorageName),
        body: { test: 'Remove a removed Preference (async)' }
      })

      await preference.remove({ sync: false })

      try {
        await preferences.remove(preference, { sync: false })
      } catch (error) {
        expect(error.message).toBe(ERROR)
      }
    })

    test('Must throw error when Preference doesnt exist in preferences module list (sync)', () => {
      const preference = new Preference({
        name: generateId(),
        storage: storages.get(preferencesStorageName),
        body: { test: 'Remove a Preference that doesnt exist in list (sync)' }
      })
      const ERROR = `${preference.name} is not exist in list`

      expect(preferences.remove.bind(preferences, preference)).toThrow(ERROR)
      expect(preferences.remove.bind(preferences, preference.name)).toThrow(ERROR)
    })

    test('Must throw error when Preference doesnt exist in preferences module list (async)', async () => {
      expect.assertions(2)

      const preference = new Preference({
        name: generateId(),
        storage: storages.get(preferencesStorageName),
        body: { test: 'Remove a Preference that doesnt exist in list (async)' }
      })
      const ERROR = `${preference.name} is not exist in list`

      try {
        await preferences.remove(preference, { sync: false })
      } catch (error) {
        expect(error.message).toBe(ERROR)
      }

      try {
        await preferences.remove(preference.name, { sync: false })
      } catch (error) {
        expect(error.message).toBe(ERROR)
      }
    })
  })

  describe('Success', () => {
    test('Remove Preference via name without error (sync)', () => {
      const preference = preferences.initialize(generateId(), {
        test: 'Remove via name (sync)'
      })

      expect(preferences.remove(preference.name)).toBeUndefined()
      expect(preference).toEqual(expect.objectContaining({
        name: undefined,
        body: undefined
      }))
    })

    test('Remove Preference via name without error (async)', async () => {
      expect.assertions(2)

      const preference = preferences.initialize(generateId(), {
        test: 'Remove via name (async)'
      })

      expect(await preferences.remove(preference.name, { sync: false })).toBeUndefined()
      expect(preference).toEqual(expect.objectContaining({
        name: undefined,
        body: undefined
      }))
    })

    test('Remove Preference via Preference instance without error (sync)', () => {
      const preference = preferences.initialize(generateId(), {
        test: 'Remove via Preference instance (sync)'
      })

      expect(preferences.remove(preference)).toBeUndefined()
      expect(preference).toEqual(expect.objectContaining({
        name: undefined,
        body: undefined
      }))
    })

    test('Remove Preference via Preference instance without error (async)', async () => {
      expect.assertions(2)

      const preference = preferences.initialize(generateId(), {
        test: 'Remove via Preference instance (async)'
      })

      expect(await preferences.remove(preference, { sync: false })).toBeUndefined()
      expect(preference).toEqual(expect.objectContaining({
        name: undefined,
        body: undefined
      }))
    })
  })
})

test('preferences has method must return right value', () => {
  const preference = preferences.initialize(generateId(), { test: 'has method' })
  const name = preference.name

  expect(preferences.has(name)).toBe(true)

  preferences.remove(name)

  expect(preferences.has(name)).toBe(false)
})

describe('preferences events', () => {
  test('Must emit removed event when a Preference removed', done => {
    expect.assertions(1)

    const name = generateId()
    const body = { test: 'removed event' }
    const preference = preferences.initialize(name, body)

    preferences.once('removed', event => {
      expect(event).toEqual({
        name: name,
        body: body
      })

      done()
    })
    preference.remove()
  })

  test('Must emit updated event when a Preference updated', done => {
    expect.assertions(1)

    const name = generateId()
    const body = { test: 'updated event' }
    const preference = preferences.initialize(name, body)
    const updatedBody = Object.assign({}, body, {
      update: 'Updated successfully'
    })

    preferences.once('updated', event => {
      expect(event).toEqual({
        name,
        lastBody: body,
        updatedBody
      })

      done()
    })
    preference.update(updatedBody)
  })
})

afterAll(() => storages.remove(preferencesStorageName))
