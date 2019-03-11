
/**
 * @module passport/password
 */

import encrypt from './encryption'

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
  if (!pattern.test(password)) throw new Error('password is not secure')

  return encrypt(password, salt)
}
