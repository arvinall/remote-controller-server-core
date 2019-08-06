/* global test, expect, describe, afterAll, TMP_PATH, generateId */

import PluginPreferences from '../pluginPreferences'
import Logger from '../../logger'
import makeStorages from '../../storages'
import makePreferences from '../../preferences'
import EventEmitter from 'events'
import Preference from '../../preferences/preference'

// Reset Object class to ES spec instead jest customized class
Object.defineProperty(global, 'Object', {
  value: Object.getPrototypeOf(Object.getPrototypeOf(EventEmitter.constructor)).constructor
})

const core = {}

let preferencesStorageName
let preferences
let preferenceName
let pluginPreferences

describe('Constructor', () => {
  describe('Errors', () => {
    test('Must throw error when configs parameter is not object', () => {
      const ERROR = 'configs parameter is required and must be object'

      expect(() => new PluginPreferences()).toThrow(ERROR)
      expect(() => new PluginPreferences('wrong')).toThrow(ERROR)
    })

    test('Must throw error when configs.name property is not string', () => {
      const ERROR = 'configs.name is required and must be string'

      expect(() => new PluginPreferences({})).toThrow(ERROR)
      expect(() => new PluginPreferences({ name: 123 })).toThrow(ERROR)
    })

    test('Must throw error when configs.preferences property is not Preferences', () => {
      const ERROR = 'configs.preferences is required and must be Preferences'

      expect(() => new PluginPreferences({ name: 'test' })).toThrow(ERROR)
      expect(() => new PluginPreferences({ name: 'test', preferences: 'wrong' })).toThrow(ERROR)
    })

    afterAll(() => {
      core.logger = new Logger(TMP_PATH)
      core.storages = makeStorages.call(core, { path: TMP_PATH })

      preferencesStorageName = generateId()
      preferences = makePreferences.call(core, { name: preferencesStorageName })
    })
  })

  test('Initial PluginPreferences without error', () => {
    const configs = {
      name: 'test',
      preferences
    }
    const pluginPreferences = new PluginPreferences(configs)

    expect(pluginPreferences).toEqual(expect.any(Object))
    expect(pluginPreferences).toEqual(expect.objectContaining({
      get: expect.any(Function),
      add: expect.any(Function),
      remove: expect.any(Function),
      removeSync: expect.any(Function),
      has: expect.any(Function)
    }))
    expect(pluginPreferences + '').toBe('[object PluginPreferences]')
  })

  afterAll(() => {
    preferenceName = 'pluginPreferences-test-' + generateId()

    pluginPreferences = new PluginPreferences({
      name: preferenceName,
      preferences
    })
  })
})

describe('add Method', () => {
  describe('Success', () => {
    test('Must return Preference without body', () => {
      const preference = pluginPreferences.add()

      expect(preference).toBeInstanceOf(Preference)
      expect(preference.name).toBe(preferenceName)

      preferences.removeSync(preference)
    })

    test('Must return Preference with correct body', () => {
      const body = { pluginPreferences: 'add with body' }
      const preference = pluginPreferences.add(body)

      expect(preference).toBeInstanceOf(Preference)
      expect(preference.body).toEqual(body)

      preferences.removeSync(preference)
    })
  })
})

describe('get Method', () => {
  test('Must return previously created Preference', () => {
    const preference = pluginPreferences.add()

    expect(pluginPreferences.get()).toBe(preference)

    preferences.removeSync(preference)
  })
})

describe('remove Method', () => {
  test('Must remove previously created Preference', async () => {
    const preference = pluginPreferences.add()

    await pluginPreferences.remove()

    expect(preference.name).toBeUndefined()
    expect(preference.body).toBeUndefined()
  })
})

describe('removeSync Method', () => {
  test('Must remove previously created Preference', () => {
    const preference = pluginPreferences.add()

    pluginPreferences.removeSync()

    expect(preference.name).toBeUndefined()
    expect(preference.body).toBeUndefined()
  })
})

describe('has Method', () => {
  describe('Success', () => {
    test('Must return false when Preference is not exist', () => {
      expect(pluginPreferences.has()).toBe(false)
    })

    test('Must return true when Preference is exist', () => {
      preferences.remove(pluginPreferences.add())

      expect(pluginPreferences.has()).toBe(true)
    })
  })
})

afterAll(() => core.storages.removeSync(preferencesStorageName))
