/* global test, expect, describe, global, afterAll, TMP_PATH, afterEach, beforeAll */

import Logger, {
  logSymbol,
  createInfoObject,
  createErrorObject,
  makeClassLoggable
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
      date: expect.any(String)
    })
  })

  test('Must insert scope parameter to messages array key ' +
    'when scope is string and no other data provided', () => {
    const SCOPE = 'test'
    const infoObject = createInfoObject(SCOPE)

    expect(infoObject).toEqual({
      date: expect.any(String),
      messages: [ SCOPE ]
    })
  })

  test('Must set scope parameter\'s value to scope key in returned object ' +
    'when scope parameter is string', () => {
    const SCOPE = 'test'
    const infoObject = createInfoObject(SCOPE, {})

    expect(infoObject).toEqual({
      scope: SCOPE,
      date: expect.any(String)
    })
  })

  test('Must assign objects that passed', () => {
    const SCOPE = 'test'
    const infoObject = createInfoObject(SCOPE, { test1: 1 }, { test: 0 }, { test1: 2 })

    expect(infoObject).toEqual({
      scope: SCOPE,
      date: expect.any(String),
      test: 0,
      test1: 2
    })
  })

  test('Must assign scope parameter when it is an object', () => {
    const SCOPE = { test2: 0 }
    const infoObject = createInfoObject(SCOPE, { test1: 2 }, { test: 1 }, { test1: 3 })

    expect(infoObject).toEqual({
      date: expect.any(String),
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
      date: expect.any(String),
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
      date: expect.any(String),
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
      date: expect.any(String),
      messages: [ SCOPE[logSymbol] ]
    })

    SCOPE[logSymbol] = { test: 'test' }

    infoObject = createInfoObject(SCOPE)

    expect(infoObject).toEqual({
      date: expect.any(String),
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
      date: expect.any(String)
    })
  })

  test('Must insert scope parameter to messages array key ' +
    'when scope is string and no other data provided', () => {
    const SCOPE = 'test'
    const errorObject = createErrorObject(SCOPE)

    expect(errorObject).toEqual({
      date: expect.any(String),
      messages: [ SCOPE ]
    })
  })

  test('Must set scope parameter\'s value to scope key in returned object ' +
    'when scope parameter is string', () => {
    const SCOPE = 'test'
    const errorObject = createErrorObject(SCOPE, {})

    expect(errorObject).toEqual({
      scope: SCOPE,
      date: expect.any(String)
    })
  })

  test('Must assign objects that passed', () => {
    const SCOPE = 'test'
    const errorObject = createErrorObject(SCOPE, { test1: 1 }, { test: 0 }, { test1: 2 })

    expect(errorObject).toEqual({
      scope: SCOPE,
      date: expect.any(String),
      test: 0,
      test1: 2
    })
  })

  test('Must assign scope parameter when it is an object', () => {
    const SCOPE = { test2: 0 }
    const errorObject = createErrorObject(SCOPE, { test1: 2 }, { test: 1 }, { test1: 3 })

    expect(errorObject).toEqual({
      date: expect.any(String),
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
      date: expect.any(String),
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
      date: expect.any(String),
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
      date: expect.any(String),
      messages: [ SCOPE[logSymbol] ]
    })

    SCOPE[logSymbol] = { test: 'test' }

    errorObject = createErrorObject(SCOPE)

    expect(errorObject).toEqual({
      date: expect.any(String),
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

    test('Must make info.log file and write to it', async () => {
      expect.assertions(1)

      const MESSAGE = 'Initial info log'

      await logger.info(MESSAGE)._promise

      expect(readLog()).toEqual([
        {
          date: expect.any(String),
          messages: [ MESSAGE ]
        }
      ])
    })

    test('Must append logs to info.log file', async () => {
      expect.assertions(3)

      const messages = [
        'initial log',
        'append 1',
        'append 2'
      ]

      for (const message of messages) {
        await logger.info(message)._promise
      }

      const logs = readLog()

      for (const log of logs) {
        const index = logs.indexOf(log)

        expect(log).toEqual({
          date: expect.any(String),
          messages: [ messages[index] ]
        })
      }
    })

    afterEach(() => {
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

    test('Must make warn.log file and write to it', async () => {
      expect.assertions(1)

      const MESSAGE = 'Initial warn log'

      await logger.warn(MESSAGE)._promise

      expect(readLog()).toEqual([
        {
          date: expect.any(String),
          messages: [ MESSAGE ]
        }
      ])
    })

    test('Must append logs to warn.log file', async () => {
      expect.assertions(3)

      const messages = [
        'initial log',
        'append 1',
        'append 2'
      ]

      for (const message of messages) {
        await logger.warn(message)._promise
      }

      const logs = readLog()

      for (const log of logs) {
        const index = logs.indexOf(log)

        expect(log).toEqual({
          date: expect.any(String),
          messages: [ messages[index] ]
        })
      }
    })

    afterEach(() => {
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

    test('Must make error.log file and write to it', async () => {
      expect.assertions(1)

      const MESSAGE = 'Initial error log'

      await logger.error(MESSAGE)._promise

      expect(readLog()).toEqual([
        {
          date: expect.any(String),
          messages: [ MESSAGE ]
        }
      ])
    })

    test('Must append logs to error.log file', async () => {
      expect.assertions(3)

      const messages = [
        'initial log',
        'append 1',
        'append 2'
      ]

      for (const message of messages) {
        await logger.error(message)._promise
      }

      const logs = readLog()

      for (const log of logs) {
        const index = logs.indexOf(log)

        expect(log).toEqual({
          date: expect.any(String),
          messages: [ messages[index] ]
        })
      }
    })

    afterEach(() => {
      try {
        fs.unlinkSync(path.join(DIRECTORY, 'error.log'))
      } catch (error) {}
    })
  })

  describe('Events', () => {
    test('Must emit infoLogged when info log append to it\'s file', done => {
      expect.assertions(1)

      const infoObject = logger.info('infoLogged')

      logger.once('infoLogged', logObject => {
        expect(logObject).toBe(infoObject)

        done()
      })
    })

    test('Must emit warnLogged when warn log append to it\'s file', done => {
      expect.assertions(1)

      const warnObject = logger.warn('warnLogged')

      logger.once('warnLogged', logObject => {
        expect(logObject).toBe(warnObject)

        done()
      })
    })

    test('Must emit errorLogged when error log append to it\'s file', done => {
      expect.assertions(1)

      const errorObject = logger.error('errorLogged')

      logger.once('errorLogged', logObject => {
        expect(logObject).toBe(errorObject)

        done()
      })
    })
  })

  afterAll(() => {
    for (const type of [ 'info', 'warn', 'error' ]) {
      try {
        fs.unlinkSync(path.join(DIRECTORY, type + '.log'))
      } catch (error) {}
    }

    try {
      if (fs.statSync(DIRECTORY).isDirectory()) {
        fs.rmdirSync(DIRECTORY)
      }
    } catch (error) {}
  })
})

describe('makeClassLoggable exported function', () => {
  let LoggableTest
  let loggableTest

  describe('Function', () => {
    test('Must return function that it\'s name prefixed by Loggable ' +
      'and it\'s prototype setted to constructor parameter', () => {
      const NonLoggableTest = class Test {}
      const LoggableTest = makeClassLoggable(NonLoggableTest)

      expect(LoggableTest.name).toBe('LoggableTest')
      expect(Object.getPrototypeOf(LoggableTest)).toBe(NonLoggableTest)
    })

    test('Must set log object to logObject parameter', () => {
      const logObject = { test: 'test' }
      const LoggableTest = makeClassLoggable(class Test {}, logObject)
      const loggableTest = new LoggableTest()

      expect(loggableTest[logSymbol]).toEqual(logObject)
    })

    afterAll(() => {
      LoggableTest = makeClassLoggable(class Test {})
      loggableTest = new LoggableTest()
    })
  })

  describe('Loggable class', () => {
    describe('setLogObject static method', () => {
      test('Must return Loggable class to chaining', () => {
        expect(LoggableTest.setLogObject()).toBe(LoggableTest)
      })

      test('Must not set log object when _logObject parameter is not object', () => {
        LoggableTest.setLogObject('wrong')

        expect(loggableTest[logSymbol]).toEqual({})
      })

      test('Must set log object to _logObject parameter', () => {
        const logObject = { class: 'test' }

        LoggableTest.setLogObject(logObject)

        expect(loggableTest[logSymbol]).toEqual(logObject)
      })

      afterAll(() => LoggableTest.setLogObject({}))
    })

    describe('assignLogObject static method', () => {
      test('Must return Loggable class to chaining', () => {
        expect(LoggableTest.assignLogObject()).toBe(LoggableTest)
      })

      test('Must not assign log object when _logObject parameter is not object', () => {
        LoggableTest.assignLogObject('wrong')

        expect(loggableTest[logSymbol]).toEqual({})
      })

      test('Must assign _logObject parameter to log object', () => {
        const logObject1 = { class1: 'test' }
        const logObject2 = { class2: 'test' }

        LoggableTest.setLogObject(logObject1)
        LoggableTest.assignLogObject(logObject2)

        expect(loggableTest[logSymbol]).toEqual({ ...logObject1, ...logObject2 })
      })

      afterAll(() => LoggableTest.setLogObject({}))
    })

    describe('setLogObject method', () => {
      const classLogObject = { class: 'test' }

      beforeAll(() => LoggableTest.setLogObject(classLogObject))

      test('Must return it\'s instance to chaining', () => {
        expect(loggableTest.setLogObject()).toBe(loggableTest)
      })

      test('Must not set log object when logObject parameter is not object', () => {
        loggableTest.setLogObject('wrong')

        expect(loggableTest[logSymbol]).toEqual(classLogObject)
      })

      test('Must set log object to logObject parameter', () => {
        const logObject = { instance: 'test' }

        loggableTest.setLogObject(logObject)

        expect(loggableTest[logSymbol]).toEqual({ ...classLogObject, ...logObject })
      })

      afterAll(() => {
        LoggableTest.setLogObject({})
        loggableTest.setLogObject({})
      })
    })

    describe('assignLogObject method', () => {
      const classLogObject = { class: 'test' }

      beforeAll(() => LoggableTest.setLogObject(classLogObject))

      test('Must return it\'s instance to chaining', () => {
        expect(loggableTest.assignLogObject()).toBe(loggableTest)
      })

      test('Must not assign log object when logObject parameter is not object', () => {
        loggableTest.assignLogObject('wrong')

        expect(loggableTest[logSymbol]).toEqual(classLogObject)
      })

      test('Must assign logObject parameter to log object', () => {
        const logObject1 = { instance1: 'test' }
        const logObject2 = { instance2: 'test' }

        loggableTest.setLogObject(logObject1)
        loggableTest.assignLogObject(logObject2)

        expect(loggableTest[logSymbol]).toEqual({ ...classLogObject, ...logObject1, ...logObject2 })
      })

      afterAll(() => {
        LoggableTest.setLogObject({})
        loggableTest.setLogObject({})
      })
    })
  })
})
