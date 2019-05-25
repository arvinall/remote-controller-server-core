/* global test, expect, describe, afterAll, generateId, TMP_PATH */

import Preference from '../preference'
import Storage from '../../storages/storage'

const preferencesStorage = (() => {
  let configs = {
    name: generateId(),
    path: TMP_PATH
  }

  try {
    return new Storage(configs)
  } catch (error) {
    configs.body = {}

    return new Storage(configs)
  }
})()

describe('Preference constructor', () => {
  let initializedPreference

  describe('Errors', () => {
    test('Must throw error when configs parameter is not object', () => {
      const ERROR = 'configs parameter is required and must be object'

      expect(() => new Preference()).toThrow(ERROR)
      expect(() => new Preference('worng')).toThrow(ERROR)
    })

    test('Must throw error when configs.name property is not string', () => {
      const ERROR = 'configs.name is required and must be string'
      const configs = {}

      expect(() => new Preference(configs)).toThrow(ERROR)

      configs.name = ['wrong']

      expect(() => new Preference(configs)).toThrow(ERROR)
    })

    test('Must throw error when configs.storage property is not Storage', () => {
      const ERROR = 'configs.storage is required and must be Storage'
      const configs = { name: 'wrongStorage' }

      expect(() => new Preference(configs)).toThrow(ERROR)

      configs.storage = new function () {}()

      expect(() => new Preference(configs)).toThrow(ERROR)
    })

    test('Must throw error when Storage is deleted before', () => {
      const ERROR = 'Storage is not accessible'
      const configs = { name: 'deletedStorage' }
      const storage = new Storage({
        name: generateId(),
        body: {},
        path: TMP_PATH
      })

      configs.storage = storage

      storage.removeSync()

      expect(() => new Preference(configs)).toThrow(ERROR)
    })

    test('Must throw error when configs.body is defined but type is not object', () => {
      const ERROR = 'configs.body must be object'
      const configs = {
        name: 'nonObjectBody',
        storage: preferencesStorage,
        body: 'wrong'
      }

      expect(() => new Preference(configs)).toThrow(ERROR)
    })

    test('Must throw error when configs.body is defined but Preference is already exist', () => {
      const configs = {
        name: generateId(),
        storage: preferencesStorage,
        body: { name: 'initializedPreference', test: 'Existing error' }
      }
      const ERROR = `${configs.name} is already exist`

      let preference = new Preference(configs)

      expect(() => new Preference(configs)).toThrow(ERROR)

      preference.removeSync()
    })

    test('Must throw error when configs.body is undefined and Preference is not accessible', () => {
      const configs = {
        name: generateId(),
        storage: preferencesStorage
      }
      const ERROR = `${configs.name} is not accessible`

      expect(() => new Preference(configs)).toThrow(ERROR)
    })
  })

  describe('Success', () => {
    test('Initial without error', () => {
      const configs = {
        name: generateId(),
        storage: preferencesStorage,
        body: { test: 'Initialized Successful' }
      }

      initializedPreference = new Preference(configs)

      expect(initializedPreference).toBeInstanceOf(Preference)
      expect(initializedPreference).toHaveProperty('body', initializedPreference.body)
    })

    test('Read without error', () => {
      const configs = {
        name: initializedPreference.name,
        storage: preferencesStorage
      }

      let previousPreference = new Preference(configs)

      expect(previousPreference).toBeInstanceOf(Preference)
      expect(previousPreference).toHaveProperty('body', initializedPreference.body)
    })
  })
})

describe('Preference remove method', () => {
  describe('Errors', () => {
    test('Must throw error when remove a removed Preference (sync)', () => {
      const ERROR = 'Preference is not accessible'
      const configs = {
        name: generateId(),
        storage: preferencesStorage,
        body: { test: 'Remove a removed Preference' }
      }
      const preference = new Preference(configs)

      preference.removeSync()

      expect(preference.body).toBeUndefined()
      expect(preference.removeSync.bind(preference)).toThrow(ERROR)
    })

    test('Must throw error when remove a removed Preference (async)', async () => {
      expect.assertions(2)

      const ERROR = 'Preference is not accessible'
      const configs = {
        name: generateId(),
        storage: preferencesStorage,
        body: { test: 'Remove a removed Preference' }
      }
      const preference = new Preference(configs)

      await preference.remove()

      expect(preference.body).toBeUndefined()

      try {
        await preference.remove()
      } catch (error) {
        expect(error.message).toBe(ERROR)
      }
    })
  })

  describe('Success', () => {
    test('Remove without error (sync)', () => {
      const configs = {
        name: generateId(),
        storage: preferencesStorage,
        body: { test: 'Remove (sync)' }
      }
      const preference = new Preference(configs)

      expect(preference.removeSync()).toBeUndefined()
      expect(preference.body).toBeUndefined()
    })

    test('Remove without error (async)', async () => {
      expect.assertions(2)

      const configs = {
        name: generateId(),
        storage: preferencesStorage,
        body: { test: 'Remove (async)' }
      }
      const preference = new Preference(configs)

      expect(await preference.remove()).toBeUndefined()
      expect(preference.body).toBeUndefined()
    })
  })
})

describe('Preference update method', () => {
  describe('Errors', () => {
    test('Must throw error when body parameter is not object/function', () => {
      const ERROR = 'body parameter is required and must be object/function'
      const configs = {
        name: generateId(),
        storage: preferencesStorage,
        body: { test: 'Update without body' }
      }
      const preference = new Preference(configs)

      expect(preference.update.bind(preference, 'wrong')).toThrow(ERROR)
      expect(preference.updateSync.bind(preference, 'wrong')).toThrow(ERROR)

      preference.remove()
    })

    test('Must throw error when update a removed Preference (sync)', () => {
      const ERROR = 'Preference is not accessible'
      const configs = {
        name: generateId(),
        storage: preferencesStorage,
        body: { test: 'Update a removed Preference' }
      }
      const preference = new Preference(configs)

      preference.removeSync()

      expect(preference.body).toBeUndefined()

      configs.body.test = 'wrong'

      expect(preference.updateSync.bind(preference, configs.body)).toThrow(ERROR)
    })

    test('Must throw error when update a removed Preference', async () => {
      expect.assertions(2)

      const ERROR = 'Preference is not accessible'
      const configs = {
        name: generateId(),
        storage: preferencesStorage,
        body: { test: 'Update a removed Preference' }
      }
      const preference = new Preference(configs)

      await preference.remove()

      expect(preference.body).toBeUndefined()

      configs.body.test = 'wrong'

      try {
        await preference.update(configs.body)
      } catch (error) {
        expect(error.message).toBe(ERROR)
      }
    })
  })

  describe('Success', () => {
    test('update via object without error (sync)', () => {
      const configs = {
        name: generateId(),
        storage: preferencesStorage,
        body: { test: 'update via object (sync)' }
      }
      const preference = new Preference(configs)

      configs.body.update = 'Update successfully'

      expect(preference.updateSync(configs.body)).toBeUndefined()
      expect(preference.body).toEqual(configs.body)

      preference.removeSync()
    })

    test('update via object without error (async)', async () => {
      expect.assertions(2)

      const configs = {
        name: generateId(),
        storage: preferencesStorage,
        body: { test: 'update via object (async)' }
      }
      const preference = new Preference(configs)

      configs.body.update = 'Update successfully'

      expect(await preference.update(configs.body)).toBeUndefined()
      expect(preference.body).toEqual(configs.body)

      await preference.remove()
    })

    test('update via function without error (sync)', () => {
      const configs = {
        name: generateId(),
        storage: preferencesStorage,
        body: { test: 'update via function (sync)' }
      }
      const preference = new Preference(configs)

      expect(preference.updateSync(body => {
        body.update = 'Update successfully'

        configs.body = body

        return body
      })).toBeUndefined()
      expect(preference.body).toEqual(configs.body)

      preference.removeSync()
    })

    test('update via function without error (async)', async () => {
      expect.assertions(2)

      const configs = {
        name: generateId(),
        storage: preferencesStorage,
        body: { test: 'update via function (async)' }
      }
      const preference = new Preference(configs)

      expect(await preference.update(body => {
        body.update = 'Update successfully'

        configs.body = body

        return body
      })).toBeUndefined()
      expect(preference.body).toEqual(configs.body)

      await preference.remove()
    })
  })
})

describe('Preference events', () => {
  test('Must emit removed event when Preference removed', done => {
    expect.assertions(1)

    const configs = {
      name: generateId(),
      storage: preferencesStorage,
      body: { test: 'removed event' }
    }
    const preference = new Preference(configs)

    preference.once('removed', event => {
      expect(event).toEqual({
        name: configs.name,
        body: configs.body
      })

      done()
    })
    preference.removeSync()
  })

  test('Must emit updated event when Preference updated', done => {
    expect.assertions(1)

    const configs = {
      name: generateId(),
      storage: preferencesStorage,
      body: { test: 'updated event' }
    }
    const preference = new Preference(configs)
    const updatedBody = Object.assign({}, configs.body, {
      update: 'Updated successfully'
    })

    preference.once('updated', event => {
      expect(event).toEqual({
        lastBody: configs.body,
        updatedBody
      })

      done()
    })
    preference.updateSync(updatedBody)
  })
})

afterAll(() => preferencesStorage.removeSync())
