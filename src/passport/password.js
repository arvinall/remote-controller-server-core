/* global global */

/**
 * @module passport/password
 */

import { makeClassLoggable } from '../logger'
import encrypt from './encryption'

// Error classes
const logObject = {
  scope: 'password',
  event: undefined,
  module: undefined
}
const Error = makeClassLoggable(global.Error, logObject)
const TypeError = makeClassLoggable(global.TypeError, logObject)

export const pattern = /(?=^.{8,}$)((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/

/**
 * * Minimum eight characters
 * * At least one uppercase letter
 * * At least one lowercase letter
 * * At least one number
 * * At least one special character
 *
 * @param {string} password
 * @param [salt] same as encryption salt parameter
 *
 * @throws Will throw an error if the password doesn't math with pattern
 *
 * @return {{salt: Buffer, hash: Buffer}}
 */
export default (password, salt) => {
  if (typeof password !== 'string') {
    throw new TypeError('password parameter is required and must be string')
  }

  if (!pattern.test(password)) throw new Error('Password is not secure')

  return encrypt(password, salt)
}
