
/**
 * @module helpers
 */

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
   * Check context is an inheritance of Target parameter
   *
   * @param {Function} Target
   *
   * @return {boolean}
   */
  inheritOf (Target) {
    let prototype = Object.getPrototypeOf(this)

    return (function inheritOf () { // eslint-disable-line no-extra-parens
      if (prototype === null) return false
      else if (prototype === Target ||
        prototype.constructor === Target) return true

      prototype = Object.getPrototypeOf(prototype)

      return inheritOf()
    }).call(this)
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
    return target => {
      Object.defineProperty(target.prototype, Symbol.toStringTag, {
        get () {
          return name || target.name || Object.getPrototypeOf(target).constructor.name
        }
      })

      return target
    }
  }
}
