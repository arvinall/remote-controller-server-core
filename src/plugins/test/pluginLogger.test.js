/* global test, expect, describe, afterAll, TMP_PATH, generateId */

import PluginLogger from '../pluginLogger'
import Logger, {
  logSymbol,
  makeClassLoggable
} from '../../logger'

let logger
let pluginName
let pluginLogger

describe('Constructor', () => {
  describe('Errors', () => {
    test('Must throw error when configs parameter is not object', () => {
      const ERROR = 'configs parameter is required and must be object'

      expect(() => new PluginLogger()).toThrow(ERROR)
      expect(() => new PluginLogger('wrong')).toThrow(ERROR)
    })

    test('Must throw error when configs.name property is not string', () => {
      const ERROR = 'configs.name is required and must be string'

      expect(() => new PluginLogger({})).toThrow(ERROR)
      expect(() => new PluginLogger({ name: 123 })).toThrow(ERROR)
    })

    test('Must throw error when configs.logger property is not Logger', () => {
      const ERROR = 'configs.logger is required and must be Logger'

      expect(() => new PluginLogger({ name: 'test' })).toThrow(ERROR)
      expect(() => new PluginLogger({ name: 'test', logger: 'wrong' })).toThrow(ERROR)
    })

    afterAll(() => {
      logger = new Logger(TMP_PATH)
    })
  })

  test('Initial PluginLogger without error', () => {
    const configs = {
      name: 'test',
      logger
    }
    const pluginLogger = new PluginLogger(configs)

    expect(pluginLogger).toEqual(expect.any(Object))
    expect(pluginLogger).toEqual(expect.objectContaining({
      info: expect.any(Function),
      warn: expect.any(Function),
      error: expect.any(Function)
    }))
    expect(pluginLogger + '').toBe('[object PluginLogger]')
  })

  afterAll(() => {
    pluginName = 'pluginLogger-test-' + generateId()
    pluginLogger = new PluginLogger({
      name: pluginName,
      logger: logger
    })
  })
})

describe.each([ [ 'info' ], [ 'warn' ], [ 'error' ] ])(
  '%s Method',
  methodName => {
    test('Must set scope property to scope parameter', () => {
      const scope = generateId() + 'test'

      expect(pluginLogger[methodName](scope).scope).toBe(scope)
    })

    test('Must push data parameters to messages property', () => {
      const data = [
        generateId(),
        generateId(),
        generateId()
      ]

      expect(pluginLogger[methodName](generateId(), ...data).messages).toEqual(data)
    })

    test('Must set pluginName property to pluginLogger\'s name in logObject', () => {
      expect(pluginLogger[methodName](generateId()).pluginName).toBe(pluginName)
    })
  }
)

test('logSymbol Static method', () => expect(PluginLogger.logSymbol)
  .toBe(logSymbol))

test('makeClassLoggable Static method', () => expect(PluginLogger.makeClassLoggable)
  .toBe(makeClassLoggable))
