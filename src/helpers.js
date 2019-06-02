
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
  }
}
