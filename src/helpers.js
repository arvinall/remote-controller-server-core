
/**
 * @module helpers
 */

import { logSymbol } from './logger'

/**
 * Object helpers
 *
 * @namespace
 */
export const object = {
  /**
   * Iterate over context object's values
   */
  iterateOverValues () {
    return Object.values(this)[Symbol.iterator]()
  },

  /**
   * Make custom class for logging
   *
   * @param {Function} constructor
   * @param {object} [logObject={}] Initial object
   *
   * @return {Function}
   */
  makeLoggableClass (constructor, logObject = Object.create(null)) {
    logObject = JSON.parse(JSON.stringify(logObject))

    /**
     * Custom class for logging
     */
    class Loggable extends constructor {
      /**
       * @type {object}
       */
      #logObject = Object.create(null)

      get [logSymbol] () {
        return {
          ...logObject,
          ...this.#logObject
        }
      }

      /**
       * Set log object
       *
       * @param {object} [logObject]
       *
       * @return {module:helpers.object.makeLoggableClass~Loggable}
       */
      setLogObject (logObject) {
        if (typeof logObject === 'object' &&
          logObject !== null) this.#logObject = JSON.parse(JSON.stringify(logObject))

        return this
      }

      /**
       * Assign object to log object
       *
       * @param {object} [logObject]
       *
       * @return {module:helpers.object.makeLoggableClass~Loggable}
       */
      assignLogObject (logObject) {
        if (typeof logObject === 'object' &&
          logObject !== null) Object.assign(this.#logObject, logObject)

        return this
      }

      /**
       * Set initial log object
       *
       * @param {object} [_logObject]
       *
       * @return {module:helpers.object.makeLoggableClass~Loggable}
       */
      static setLogObject (_logObject) {
        if (typeof _logObject === 'object' &&
          _logObject !== null) logObject = JSON.parse(JSON.stringify(_logObject))

        return this
      }

      /**
       * Assign object to initial log object
       *
       * @param {object} [_logObject]
       *
       * @return {module:helpers.object.makeLoggableClass~Loggable}
       */
      static assignLogObject (_logObject) {
        if (typeof _logObject === 'object' &&
          _logObject !== null) Object.assign(logObject, _logObject)

        return this
      }
    }

    Object.defineProperty(Loggable, 'name', {
      value: 'Loggable' + constructor.name
    })

    return Loggable
  }
}

/**
 * Decorator helpers (for future usage)
 *
 * @namespace
 */
export const decorator = {
  /**
   * Set class Symbol.toStringTag property. default is "target.name"
   *
   * @param {string} [name]
   *
   * @return {function(object): object}
   */
  setStringTag (name) {
    return target => Object
      .defineProperty(target.prototype, Symbol.toStringTag, {
        get () {
          return name || target.name
        }
      })
  }
}
