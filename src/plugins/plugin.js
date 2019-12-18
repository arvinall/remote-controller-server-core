
/**
 * @module plugins/plugin
 */

import EventEmitter from 'events'
import * as helpers from '../helpers'
import { logSymbol } from '../logger'

/**
 * Interface for plugins
 *
 * @interface
 *
 * @mixes module:remote-controller-server-core~external:EventEmitter
 */
export default class Plugin extends EventEmitter {
  /**
   * Assign configs properties to context as non enumerable getters
   *
   * @param [configs]
   */
  constructor (configs = Object.create(null)) {
    if (typeof configs !== 'object') throw new TypeError('configs parameter must be object')

    super()

    for (const key in configs) {
      if (!configs.hasOwnProperty(key)) continue

      Object.defineProperty(this, key, {
        enumerable: false,
        get () {
          return configs[key]
        }
      })
    }

    const states = [ 'plugging', 'plugged', 'unplugging', 'unplugged' ]

    for (const state of states) {
      // Call state methods event base
      this.on(state, this[state].bind(this))
    }
  }

  /**
   * Calls right before plug the plugin
   *
   * @return {(Promise<*>|*)}
   */
  plugging () {}

  /**
   * Calls right after plug the plugin
   *
   * @return {(Promise<*>|*)}
   */
  plugged () {}

  /**
   * Calls right before unplug the plugin
   *
   * @return {(Promise<*>|*)}
   */
  unplugging () {}

  /**
   * Calls right after unplug the plugin
   *
   * @return {(Promise<*>|*)}
   */
  unplugged () {}

  get [logSymbol] () {
    return {
      plugin: {
        activityId: this.activityId
      }
    }
  }
}

// Set string tag
helpers.decorator.setStringTag()(Plugin)
