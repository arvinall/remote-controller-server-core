/* global test, expect, Buffer */

import crypto from 'crypto'
import * as passGenerator from './passGenerator'
import encryption from '../encryption'

test('Must throw error when password parameter is not string', () => {
  const ERROR = 'password parameter is required and must be string'

  expect(encryption).toThrow(ERROR)
  expect(encryption.bind(null, [ 'wrong' ])).toThrow(ERROR)
})

test('Must throw error when password parameter characters are less than 2', () => {
  const ERROR = 'password parameter must have at least two characters'

  expect(encryption.bind(null, '')).toThrow(ERROR)
  expect(encryption.bind(null, '1')).toThrow(ERROR)
})

test('Encrypt password without error', () => {
  const salt = crypto.randomBytes(32)
  const password = passGenerator.password(8)

  let encryptedPass = encryption(password, salt)

  expect(encryptedPass).toEqual(expect.objectContaining({
    salt: expect.any(Buffer),
    hash: expect.any(Buffer)
  }))
  expect(encryptedPass.salt.compare(salt)).toBe(0)
  expect(encryptedPass.hash.length).toBe(salt.length * password.length)
})
