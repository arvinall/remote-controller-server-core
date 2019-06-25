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
})
