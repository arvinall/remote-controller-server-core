/* global global, Buffer */

/**
 * @module passport
 */

import * as helpers from '../helpers'
import { makeClassLoggable } from '../logger'

// Error classes
const logObject = {
  scope: 'passport',
  class: 'Passport',
  event: undefined,
  module: undefined
}
const TypeError = makeClassLoggable(global.TypeError, logObject)

const GLOBAL_ERRORS = {
  passportInputRequired: new TypeError('passportInput parameter is required')
}
const passports = {
  password: require('./password').default
}

export default class Passport {
  /**
   * @type {string}
   */
  #type
  /**
   * @type {Buffer}
   */
  #hash
  /**
   * @type {Buffer}
   */
  #salt

  /**
   * passport holder and manager
   *
   * @param {string} type
   * @param {*} passportInput Depend on passport's type
   * @param {{salt: Buffer, hash: Buffer}} [passport]
   */
  constructor (type, passportInput, passport) {
    const Error = makeClassLoggable(global.Error, logObject)
      .assignLogObject({ method: 'constructor' })

    if (typeof type !== 'string') throw new TypeError('type parameter is required and must be string')
    else if (!passports.hasOwnProperty(type)) throw new Error('type parameter must be one of the passport types')
    else if (passportInput === undefined) {
      throw GLOBAL_ERRORS.passportInputRequired.setLogObject({ method: 'constructor' })
    } else if (passportInput === null &&
      (typeof passport !== 'object' ||
        !(passport.hash instanceof Buffer) ||
        !(passport.hash instanceof Buffer))) {
      throw new TypeError('passport parameter must be an encryption object')
    }

    this.#type = type

    if (passportInput !== null) passport = passports[this.#type](passportInput)

    this.#hash = passport.hash
    this.#salt = passport.salt
  }

  /**
   * Check passport equality
   *
   * @param {*} passportInput This parameter can be a encryption object or passport[type] input
   *
   * @return {boolean}
   */
  isEqual (passportInput) {
    if (passportInput === undefined || passportInput === null) {
      throw GLOBAL_ERRORS.passportInputRequired.setLogObject({ method: 'isEqual' })
    }

    const passport = passportInput.hash instanceof Buffer
      ? passportInput
      : passports[this.type](passportInput, this.salt)

    return this.hash.equals(passport.hash)
  }

  /**
   * Create instance from hash
   *
   * @param {string} type
   * @param {{salt: (Buffer|Buffer#toJSON), hash: (Buffer|Buffer#toJSON)}} passport
   */
  static from (type, passport) {
    if (typeof passport === 'object') {
      if (typeof passport.salt === 'object' && !(passport.salt instanceof Buffer)) {
        passport.salt = Buffer.from(passport.salt)
      } if (typeof passport.hash === 'object' && !(passport.hash instanceof Buffer)) {
        passport.hash = Buffer.from(passport.hash)
      }
    }

    return new Passport(type, null, passport)
  }

  /**
   * @type {string}
   */
  get type () {
    return this.#type
  }

  /**
   * @type {(Buffer|string)}
   */
  get hash () {
    return this.#hash
  }

  /**
   * @type {(Buffer|string)}
   */
  get salt () {
    return this.#salt
  }
}

// Set string tag
helpers.decorator.setStringTag()(Passport)

export { pattern as passwordPattern } from './password'
