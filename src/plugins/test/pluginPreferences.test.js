/* global test, expect, describe */

import PluginPreferences from '../pluginPreferences'

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
  })
})
