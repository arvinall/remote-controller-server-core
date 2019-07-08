/* global global */

/**
 * @module passport/encryption
 */

import { makeClassLoggable } from '../logger'
import crypto from 'crypto'

// Error classes
const logObject = {
  scope: 'encryption',
  event: undefined,
  module: undefined
}
const Error = makeClassLoggable(global.Error, logObject)
const TypeError = makeClassLoggable(global.TypeError, logObject)

/**
 * encryption is a password encryptor
 *
 * @param {string} password password must have at least two character
 * @param {(string|Buffer|TypedArray|DataView)} [salt=crypto.randomBytes(32)]
 *
 * @return {{salt: Buffer, hash: Buffer}}
 */
export default (password, salt) => {
  if (typeof password !== 'string') throw new TypeError('password parameter is required and must be string')
  else if (password.length < 2) {
    throw new Error('password parameter must have at least two characters')
      .setLogObject({ length: password.length })
  }

  const result = Object.create(null)

  result.salt = salt !== undefined ? salt : crypto.randomBytes(32)
  result.hash = crypto.scryptSync(password, result.salt, result.salt.length * password.length)

  return result
}
