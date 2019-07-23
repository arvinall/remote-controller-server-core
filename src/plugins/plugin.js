
/**
 * @module plugins/plugin
 */

import EventEmitter from 'events'
import * as helpers from '../helpers'

/**
 * Interface for plugins
 *
 * @interface
 */
export default class Plugin extends EventEmitter {
  /**
   * Assign configs properties to context as non enumerable getters
   *
   * @param [configs]
   */
  constructor (configs = Object.create(null)) {
    super()

    for (const key in configs) {
      Object.defineProperty(this, key, {
        enumerable: false,
        get () {
          return configs[key]
        }
      })
    }

    this.once('plugging', this.plugging.bind(this))
    this.once('plugged', this.plugged.bind(this))
    this.once('unplugging', this.unplugging.bind(this))
    this.once('unplugged', this.unplugged.bind(this))
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
}

// Set string tag
helpers.decorator.setStringTag()(Plugin)
