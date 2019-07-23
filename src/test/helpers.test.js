/* global describe, test, expect */

import * as helpers from '../helpers'

describe('object namespace', () => {
  describe('iterateOverValues method', () => {
    test('must iterate over its context and return values', () => {
      const context = {
        zero: 0,
        one: 1,
        two: 2,

        [Symbol.iterator]: helpers.object.iterateOverValues
      }

      let counter = 0

      for (const value of context) {
        expect(value).toBe(counter++)
      }
    })
  })

  describe('inheritOf method', () => {
    test('Must return false when context doesnt extends Target parameter', () => {
      const Target = class Target {}
      const Context = class Context {}

      expect(helpers.object.inheritOf.call(Context, Target)).toBe(false)
    })

    test('Must return true when context extends Target parameter', () => {
      const Target = class Target {}
      const Context = class Context extends Target {}

      expect(helpers.object.inheritOf.call(Context, Target)).toBe(true)
      expect(helpers.object.inheritOf.call(Context, Object)).toBe(true)
    })
  })
})

describe('decorator namespace', () => {
  describe('setStringTag method', () => {
    test('Must return function', () => {
      expect(helpers.decorator.setStringTag()).toBeInstanceOf(Function)
    })

    test('Must set [Symbol.toStringTag] property on object\'s prototype with specific name', () => {
      class Klass {}

      helpers.decorator.setStringTag('Test')(Klass)

      expect(new Klass() + '').toBe('[object Test]')
    })

    test('Must set [Symbol.toStringTag] property on object\'s prototype with its name property when name parameter is not set', () => {
      class Klass {}

      helpers.decorator.setStringTag()(Klass)

      expect(new Klass() + '').toBe('[object Klass]')
    })

    test('Must set [Symbol.toStringTag] property on object\'s prototype with its constructor name property when name parameter is not set and there is no name property', () => {
      const Klass = helpers.decorator.setStringTag()(class {})

      expect(new Klass() + '').toBe('[object Function]')
    })
  })
})
