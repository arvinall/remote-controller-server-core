/* global test, expect, describe */

import * as passGenerator from './passGenerator'
import Passport from '../index'

const passports = {
  password: require('../password').default
}

passports.types = Object.keys(passports)

describe('Passport constructor', () => {
  describe('Errors', () => {
    test('Must throw error when type parameter is not string or none of passport types', () => {
      const ERROR = 'type parameter is required and must be string and one of passport types'

      expect(() => new Passport()).toThrow(ERROR)
      expect(() => new Passport(2)).toThrow(ERROR)
      expect(() => new Passport('wrong')).toThrow(ERROR)
    })

    test('Must throw error when passportInput parameter is undefined', () => {
      const ERROR = 'passportInput parameter is required'

      expect(() => new Passport(passports.types[0])).toThrow(ERROR)
    })

    test('Must throw error when passport parameter is not an encryption object', () => {
      const ERROR = 'passport parameter must be an encryption object'

      expect(() => new Passport(passports.types[0], null)).toThrow(ERROR)
      expect(() => new Passport(passports.types[0], null, {})).toThrow(ERROR)
    })
  })

  test('Create passport without error', () => {
    for (let type of passports.types) {
      let pass = passGenerator[type]()
      let passport = new Passport(type, pass)
      let preEncrypted = passports[type](pass, passport.salt)

      expect(passport).toEqual(expect.objectContaining({
        type,
        salt: preEncrypted.salt,
        hash: expect.any(Buffer)
      }))
      expect(passport.hash.compare(preEncrypted.hash)).toBe(0)
    }
  })
})

describe('Passport isEqual method', () => {
  const pass = passGenerator[passports.types[0]]()
  const passport = new Passport(passports.types[0], pass)

  test('Must throw error when passportInput parameter is undefined/null', () => {
    const ERROR = 'passportInput parameter is required'

    expect(passport.isEqual.bind(passport)).toThrow(ERROR)
    expect(passport.isEqual.bind(passport, null)).toThrow(ERROR)
  })

  test('Compare passports without error', () => {
    const newPassport = passports[passports.types[0]](pass, passport.salt)

    expect(passport.isEqual(pass)).toBe(true)
    expect(passport.isEqual(newPassport)).toBe(true)
  })
})

describe('Passport from static method', () => {
  const passport = new Passport(passports.types[0], passGenerator[passports.types[0]]())

  test('Create passport from buffers without error', () => {
    const newPassport = Passport.from(passport.type, passport)

    expect(newPassport).toBeInstanceOf(Passport)
    expect(newPassport).toEqual(expect.objectContaining({
      type: passport.type,
      salt: passport.salt,
      hash: passport.hash
    }))
  })

  test('Create passport from buffers that converted to json without error', () => {
    const converted = {
      salt: passport.salt.toJSON(),
      hash: passport.hash.toJSON()
    }
    const newPassport = Passport.from(passport.type, converted)

    expect(newPassport).toBeInstanceOf(Passport)
    expect(newPassport).toEqual(expect.objectContaining({
      type: passport.type,
      salt: expect.any(Buffer),
      hash: expect.any(Buffer)
    }))
    expect(newPassport.salt.compare(passport.salt)).toBe(0)
    expect(newPassport.hash.compare(passport.hash)).toBe(0)
  })
})
