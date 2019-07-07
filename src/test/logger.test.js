/* global test, expect, describe, global, afterAll, TMP_PATH */

import Logger, {
  logSymbol,
  createInfoObject,
  createErrorObject
} from '../logger'
import fs from 'fs'
import path from 'path'

test('logSymbol must be a symbol with "log" description', () => {
  expect(typeof logSymbol).toBe('symbol')
  expect(logSymbol.toString()).toBe('Symbol(log)')
})

describe('createInfoObject exported function', () => {
  test('Must return undefined when data doesn\'t pass', () => {
    const infoObject = createInfoObject()

    expect(infoObject).toBeUndefined()
  })

  test('Must return an object with just one key as date and value must be instance of Date ' +
    'when scope parameter is an empty object', () => {
    const infoObject = createInfoObject({})

    expect(infoObject).toEqual({
      date: expect.any(Date)
    })
  })

  test('Must insert scope parameter to messages array key ' +
    'when scope is string and no other data provided', () => {
    const SCOPE = 'test'
    const infoObject = createInfoObject(SCOPE)

    expect(infoObject).toEqual({
      date: expect.any(Date),
      messages: [ SCOPE ]
    })
  })

  test('Must set scope parameter\'s value to scope key in returned object ' +
    'when scope parameter is string', () => {
    const SCOPE = 'test'
    const infoObject = createInfoObject(SCOPE, {})

    expect(infoObject).toEqual({
      scope: SCOPE,
      date: expect.any(Date)
    })
  })

  test('Must assign objects that passed', () => {
    const SCOPE = 'test'
    const infoObject = createInfoObject(SCOPE, { test1: 1 }, { test: 0 }, { test1: 2 })

    expect(infoObject).toEqual({
      scope: SCOPE,
      date: expect.any(Date),
      test: 0,
      test1: 2
    })
  })

  test('Must assign scope parameter when it is an object', () => {
    const SCOPE = { test2: 0 }
    const infoObject = createInfoObject(SCOPE, { test1: 2 }, { test: 1 }, { test1: 3 })

    expect(infoObject).toEqual({
      date: expect.any(Date),
      test2: 0,
      test: 1,
      test1: 3
    })
  })

  test('Must insert all non objects to messages array key', () => {
    const SCOPE = 'test'
    const infoObject = createInfoObject(SCOPE, SCOPE, [
      'te', 'st'
    ], 123, true, null, undefined, Symbol.for(SCOPE))

    expect(infoObject).toEqual({
      scope: SCOPE,
      date: expect.any(Date),
      messages: [
        SCOPE,
        [ 'te', 'st' ],
        123,
        true,
        null,
        undefined,
        Symbol.for(SCOPE)
      ]
    })
  })

  test('Must insert scope parameter to messages array key when its not string', () => {
    const SCOPE = [ 'test' ]
    const infoObject = createInfoObject(SCOPE, SCOPE[0])

    expect(infoObject).toEqual({
      date: expect.any(Date),
      messages: [
        SCOPE,
        SCOPE[0]
      ]
    })
  })

  test('Must use [logSymbol] property instead object when available', () => {
    const SCOPE = { [logSymbol]: 'test' }

    let infoObject = createInfoObject(SCOPE)

    expect(infoObject).toEqual({
      date: expect.any(Date),
      messages: [ SCOPE[logSymbol] ]
    })

    SCOPE[logSymbol] = { test: 'test' }

    infoObject = createInfoObject(SCOPE)

    expect(infoObject).toEqual({
      date: expect.any(Date),
      [SCOPE[logSymbol].test]: SCOPE[logSymbol].test
    })
  })
})

describe('createErrorObject exported function', () => {
  test('Must return undefined when data doesn\'t pass', () => {
    const errorObject = createErrorObject()

    expect(errorObject).toBeUndefined()
  })

  test('Must return an object with just one key as date and value must be instance of Date ' +
    'when scope parameter is an empty object', () => {
    const errorObject = createErrorObject({})

    expect(errorObject).toEqual({
      date: expect.any(Date)
    })
  })

  test('Must insert scope parameter to messages array key ' +
    'when scope is string and no other data provided', () => {
    const SCOPE = 'test'
    const errorObject = createErrorObject(SCOPE)

    expect(errorObject).toEqual({
      date: expect.any(Date),
      messages: [ SCOPE ]
    })
  })

  test('Must set scope parameter\'s value to scope key in returned object ' +
    'when scope parameter is string', () => {
    const SCOPE = 'test'
    const errorObject = createErrorObject(SCOPE, {})

    expect(errorObject).toEqual({
      scope: SCOPE,
      date: expect.any(Date)
    })
  })

  test('Must assign objects that passed', () => {
    const SCOPE = 'test'
    const errorObject = createErrorObject(SCOPE, { test1: 1 }, { test: 0 }, { test1: 2 })

    expect(errorObject).toEqual({
      scope: SCOPE,
      date: expect.any(Date),
      test: 0,
      test1: 2
    })
  })

  test('Must assign scope parameter when it is an object', () => {
    const SCOPE = { test2: 0 }
    const errorObject = createErrorObject(SCOPE, { test1: 2 }, { test: 1 }, { test1: 3 })

    expect(errorObject).toEqual({
      date: expect.any(Date),
      test2: 0,
      test: 1,
      test1: 3
    })
  })

  test('Must insert all non objects (except Error instances) to messages array key', () => {
    const SCOPE = 'test'
    const errorObject = createErrorObject(SCOPE, SCOPE, [
      'te', 'st'
    ], 123, true, null, undefined, Symbol.for(SCOPE))

    expect(errorObject).toEqual({
      scope: SCOPE,
      date: expect.any(Date),
      messages: [
        SCOPE,
        [ 'te', 'st' ],
        123,
        true,
        null,
        undefined,
        Symbol.for(SCOPE)
      ]
    })
  })

  test('Must insert scope parameter to messages array key when its not string', () => {
    const SCOPE = [ 'test' ]
    const errorObject = createErrorObject(SCOPE, SCOPE[0])

    expect(errorObject).toEqual({
      date: expect.any(Date),
      messages: [
        SCOPE,
        SCOPE[0]
      ]
    })
  })

  test('Must use [logSymbol] property instead object when available', () => {
    const SCOPE = { [logSymbol]: 'test' }

    let errorObject = createErrorObject(SCOPE)

    expect(errorObject).toEqual({
      date: expect.any(Date),
      messages: [ SCOPE[logSymbol] ]
    })

    SCOPE[logSymbol] = { test: 'test' }

    errorObject = createErrorObject(SCOPE)

    expect(errorObject).toEqual({
      date: expect.any(Date),
      [SCOPE[logSymbol].test]: SCOPE[logSymbol].test
    })
  })

  test('Must insert Error instances to _errors array key', () => {
    const errors = [
      new Error('test'),
      new TypeError('test')
    ]

    const errorObject = createErrorObject(errors[0], errors[1])

    expect(errorObject._errors).toEqual([ ...errors ])
  })

  test('Must set/assign Error instances [logSymbol] property to returned object or messages property', () => {
    const Error = class Error extends global.Error { [logSymbol] = { test1: 'Error' } }
    const TypeError = class TypeError extends global.TypeError { [logSymbol] = { test2: 'TypeError' } }
    const errors = [
      new Error('test'),
      new TypeError('test')
    ]

    const errorObject = createErrorObject(errors[0], errors[1])

    expect(errorObject).toEqual(expect.objectContaining({
      ...errors[0][logSymbol],
      ...errors[1][logSymbol]
    }))
  })

  test('Must insert Error instances properties (prototype and itself) to errors array key', () => {
    const errors = [
      new Error('test'),
      new TypeError('test')
    ]
    const safeErrors = []

    const errorObject = createErrorObject(errors[0], errors[1])

    for (const error of errors) {
      const safeError = safeErrors[safeErrors.push(Object.create(null)) - 1]

      for (const key of Object.getOwnPropertyNames(Object.getPrototypeOf(error))) {
        safeError[key] = error[key]
      }
      for (const key of Object.getOwnPropertyNames(error)) {
        safeError[key] = error[key]
      }
    }

    expect(errorObject.errors).toEqual(safeErrors)
  })
})
/* eslint-disable no-unused-vars */ // Temporary
describe('Logger exported class', () => {
  const DIRECTORY = path.join(TMP_PATH, 'logger')

  let logger

  function readLogFrom (type) {
    let log = fs.readFileSync(path.join(DIRECTORY, type + '.log'), { encoding: 'utf8' })
      .trim()
      .slice(0, -1)

    log = JSON.parse('[' + log + ']')

    return log
  }

  describe('Constructor', () => {
    test('Initial without error', () => {
      const logger = new Logger()

      expect(logger).toBeInstanceOf(Logger)
      expect(logger + '').toBe('[object Logger]')
    })

    afterAll(() => {
      try {
        fs.accessSync(DIRECTORY, fs.constants.F_OK | fs.constants.W_OK)
      } catch (error) {
        fs.mkdirSync(DIRECTORY)
      }

      logger = new Logger(DIRECTORY)
    })
  })

  describe('Info method', () => {
    const readLog = readLogFrom.bind(null, 'info')

    test('Must return undefined when directory parameter is not define', () => {
      const logger = new Logger()

      expect(logger.info('info', 'test')).toBeUndefined()
    })

    afterAll(() => {
      try {
        fs.unlinkSync(path.join(DIRECTORY, 'info.log'))
      } catch (error) {}
    })
  })

  describe('Warn method', () => {
    const readLog = readLogFrom.bind(null, 'warn')

    test('Must return undefined when directory parameter is not define', () => {
      const logger = new Logger()

      expect(logger.warn('warn', 'test')).toBeUndefined()
    })

    afterAll(() => {
      try {
        fs.unlinkSync(path.join(DIRECTORY, 'warn.log'))
      } catch (error) {}
    })
  })

  describe('Error method', () => {
    const readLog = readLogFrom.bind(null, 'error')

    test('Must return undefined when directory parameter is not define', () => {
      const logger = new Logger()

      expect(logger.error('error', 'test')).toBeUndefined()
    })

    afterAll(() => {
      try {
        fs.unlinkSync(path.join(DIRECTORY, 'error.log'))
      } catch (error) {}
    })
  })

  afterAll(() => {
    try {
      if (fs.statSync(DIRECTORY).isDirectory()) {
        fs.rmdirSync(DIRECTORY)
      }
    } catch (error) {}
  })
})
