/* global test, expect */

import idGenerator, { keyCodesList } from '../idGenerator'

test('idGenerator must return function that returns string', () => {
  let generateId
  let parameters

  // Without parameters
  generateId = idGenerator()

  expect(generateId).toBeInstanceOf(Function)
  expect(typeof generateId()).toBe('string')

  // With charCodesList parameter
  generateId = idGenerator([keyCodesList[0]])

  expect(generateId).toBeInstanceOf(Function)
  expect(typeof generateId()).toBe('string')

  // With lastId parameter
  parameters = new Array(2)
  parameters[1] = 'ZY'
  generateId = idGenerator.apply(null, parameters)

  expect(generateId).toBeInstanceOf(Function)

  generateId = generateId()

  expect(typeof generateId).toBe('string')
  expect(generateId).toBe('0Z')
})

test('idGenerator must generate ids between A to C only', () => {
  const generateId = idGenerator([[65, 67]])
  const results = [
    'A', 'B', 'C',

    'AA', 'BA', 'CA',
    'AB', 'BB', 'CB',
    'AC', 'BC', 'CC',

    'AAA', 'BAA', 'CAA',
    'ABA', 'BBA', 'CBA',
    'ACA', 'BCA', 'CCA',

    'AAB', 'BAB', 'CAB',
    'ABB', 'BBB', 'CBB',
    'ACB', 'BCB', 'CCB',

    'AAC', 'BAC', 'CAC',
    'ABC', 'BBC', 'CBC',
    'ACC', 'BCC', 'CCC'
  ]

  for (const result of results) {
    expect(generateId()).toBe(result)
  }
})
