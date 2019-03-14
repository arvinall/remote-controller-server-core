/* global test, expect */

import * as passGenerator from './passGenerator'
import password from '../password'
import encryption from '../encryption'

test('Must throw error when password is not match with pattern', () => {
  const ERROR = 'password is not secure'

  expect(password).toThrow(ERROR)
  expect(password.bind(null, '')).toThrow(ERROR)
  expect(password.bind(null, '12345678')).toThrow(ERROR)
})

test('Encrypt password without error', () => {
  const pass = passGenerator.password()
  const selfPasswordHash = encryption(pass)
  let passwordHash = password(pass, selfPasswordHash.salt)

  expect(passwordHash).toEqual(expect.objectContaining({
    salt: expect.any(Buffer),
    hash: expect.any(Buffer)
  }))
  expect(selfPasswordHash.hash.compare(passwordHash.hash)).toBe(0)
})
