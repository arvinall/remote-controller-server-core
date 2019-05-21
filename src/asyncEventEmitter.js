/* global setImmediate */

/**
 * @module asyncEventEmitter
 */

import EventEmitter from 'events'

/**
 * This class emit all events asynchronously by default
 *
 * @mixes module:remote-controller-server-core~external:EventEmitter
 */
export default class AsyncEventEmitter extends EventEmitter {
  /**
   * @param {...*} parameters
   *
   * @return {Promise<boolean>}
   *
   * @see {@link https://nodejs.org/api/events.html#events_emitter_emit_eventname_args|EventEmitter#emit}
   */
  async emit (...parameters) {
    return new Promise(resolve => setImmediate(() => {
      resolve(EventEmitter.prototype.emit.call(this, ...parameters))
    }))
  }

  /**
   * @param {...*} parameters
   *
   * @return {boolean}
   *
   * @see {@link https://nodejs.org/api/events.html#events_emitter_emit_eventname_args|EventEmitter#emit}
   */
  syncEmit (...parameters) {
    return EventEmitter.prototype.emit.call(this, ...parameters)
  }
}
