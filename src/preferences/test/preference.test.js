/* global test, expect, describe */

import Preference from '../preference'
import path from 'path'
import Storage from '../../storages/storage'

const TMP_PATH = path.join(process.cwd(), 'tmp')
const preferencesStorage = (() => {
  let configs = {
    name: 'PreferenceTest',
    path: TMP_PATH
  }

  try {
    return new Storage(configs)
  } catch (error) {
    configs.body = {}

    return new Storage(configs)
  }
})()

function timestamp () {
  return String(Date.now())
}

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
        name: timestamp(),
        body: {},
        path: TMP_PATH
      })

      configs.storage = storage

      storage.remove()

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
        name: timestamp(),
        storage: preferencesStorage,
        body: { name: 'initializedPreference', test: 'Existing error' }
      }
      const ERROR = `${configs.name} is already exist`

      let preference = new Preference(configs)

      expect(() => new Preference(configs)).toThrow(ERROR)

      preference.remove()
    })

    test('Must throw error when configs.body is undefined and Preference is not accessible', () => {
      const configs = {
        name: timestamp(),
        storage: preferencesStorage
      }
      const ERROR = `${configs.name} is not accessible`

      expect(() => new Preference(configs)).toThrow(ERROR)
    })
  })

  describe('Success', () => {
    test('Initial without error', () => {
      const configs = {
        name: timestamp(),
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
    test('Must throw error when remove a removed Preference', () => {
      const ERROR = 'Preference is not accessible'
      const configs = {
        name: timestamp(),
        storage: preferencesStorage,
        body: { test: 'Remove a removed Preference' }
      }
      const preference = new Preference(configs)

      preference.remove()

      expect(preference.body).toBeUndefined()
      expect(preference.remove.bind(preference)).toThrow(ERROR)
    })
  })

  describe('Success', () => {
    test('Remove without error (sync)', () => {
      const configs = {
        name: timestamp(),
        storage: preferencesStorage,
        body: { test: 'Remove (sync)' }
      }
      const preference = new Preference(configs)

      expect(preference.remove()).toBeUndefined()
      expect(preference.body).toBeUndefined()
    })

    test('Remove without error (async)', async () => {
      expect.assertions(2)

      const configs = {
        name: timestamp(),
        storage: preferencesStorage,
        body: { test: 'Remove (async)' }
      }
      const preference = new Preference(configs)

      expect(await preference.remove({ sync: false })).toBeUndefined()
      expect(preference.body).toBeUndefined()
    })
  })
})

describe('Preference update method', () => {
  describe('Errors', () => {
    test('Must throw error when body parameter is not object/function', () => {
      const ERROR = 'body parameter is required and must be object/function'
      const configs = {
        name: timestamp(),
        storage: preferencesStorage,
        body: { test: 'Update without body' }
      }
      const preference = new Preference(configs)

      expect(preference.update.bind(preference, 'wrong')).toThrow(ERROR)

      preference.remove()
    })

    test('Must throw error when update a removed Preference', () => {
      const ERROR = 'Preference is not accessible'
      const configs = {
        name: timestamp(),
        storage: preferencesStorage,
        body: { test: 'Update a removed Preference' }
      }
      const preference = new Preference(configs)

      preference.remove()

      expect(preference.body).toBeUndefined()

      configs.body.test = 'wrong'

      expect(preference.update.bind(preference, configs.body)).toThrow(ERROR)
    })
  })

  describe('Success', () => {
    test('update via object without error (sync)', () => {
      const configs = {
        name: timestamp(),
        storage: preferencesStorage,
        body: { test: 'update via object (sync)' }
      }
      const preference = new Preference(configs)

      configs.body.update = 'Update successfully'

      expect(preference.update(configs.body)).toBeUndefined()
      expect(preference.body).toEqual(configs.body)

      preference.remove()
    })

    test('update via object without error (async)', async () => {
      expect.assertions(2)

      const configs = {
        name: timestamp(),
        storage: preferencesStorage,
        body: { test: 'update via object (async)' }
      }
      const preference = new Preference(configs)

      configs.body.update = 'Update successfully'

      expect(await preference.update(configs.body, { sync: false })).toBeUndefined()
      expect(preference.body).toEqual(configs.body)

      await preference.remove({ sync: false })
    })

    test('update via function without error (sync)', () => {
      const configs = {
        name: timestamp(),
        storage: preferencesStorage,
        body: { test: 'update via function (sync)' }
      }
      const preference = new Preference(configs)

      expect(preference.update(body => {
        body.update = 'Update successfully'

        configs.body = body

        return body
      })).toBeUndefined()
      expect(preference.body).toEqual(configs.body)

      preference.remove()
    })

    test('update via function without error (async)', async () => {
      expect.assertions(2)

      const configs = {
        name: timestamp(),
        storage: preferencesStorage,
        body: { test: 'update via function (async)' }
      }
      const preference = new Preference(configs)

      expect(await preference.update(body => {
        body.update = 'Update successfully'

        configs.body = body

        return body
      }, { sync: false })).toBeUndefined()
      expect(preference.body).toEqual(configs.body)

      await preference.remove({ sync: false })
    })
  })
})

describe('Preference events', () => {
  test('Must emit removed event when Preference removed', done => {
    expect.assertions(1)

    const configs = {
      name: timestamp(),
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
    preference.remove()
  })

  test('Must emit updated event when Preference updated', done => {
    expect.assertions(1)

    const configs = {
      name: timestamp(),
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
    preference.update(updatedBody)
  })
})
