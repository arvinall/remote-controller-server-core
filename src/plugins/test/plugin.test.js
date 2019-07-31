/* global test, expect, describe */

import Plugin from '../plugin'

describe('Constructor', () => {
  test('Prototype must contain state functions (empty)', () => {
    const states = [ 'plugging', 'plugged', 'unplugging', 'unplugged' ]

    for (const state of states) {
      expect(Plugin.prototype[state]).toBeInstanceOf(Function)
    }
  })

  test('Must set all configs parameter properties to instance context', () => {
    const configs = {
      test1: 'test1',
      test2: 'test2',
      test3: 'test3'
    }
    const plugin = new Plugin(configs)

    expect(plugin + '').toBe('[object Plugin]')

    expect(plugin).toEqual(expect.objectContaining(configs))
  })

  test('Must call every state method on it\'s event', async () => new Promise(resolve => {
    let callCounter = 0

    const MAX_CALL = 4
    const states = [ 'plugging', 'plugged', 'unplugging', 'unplugged' ]

    function count () {
      callCounter++

      if (callCounter >= MAX_CALL) resolve()
    }

    const testPlugin = new (class testPlugin extends Plugin {
      plugging () {
        super.plugging()

        count()
      }

      plugged () {
        super.plugged()

        count()
      }

      unplugging () {
        super.unplugging()

        count()
      }

      unplugged () {
        super.unplugged()

        count()
      }
    })()

    for (const state of states) {
      testPlugin.emit(state)
    }
  }))
})
