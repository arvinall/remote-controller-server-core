/* global test, expect */

import AsyncEventEmitter from '../asyncEventEmitter'

const asyncEventEmitter = new AsyncEventEmitter()

test('AsyncEventEmitter emit method must emit events asynchronously and resolve boolean', async () => {
  expect.assertions(5)

  const results = []
  const DATA = 'test'
  const LISTENERS = 3

  for (let counter = 1; counter <= LISTENERS; counter++) {
    asyncEventEmitter.once('test', data => results.push(data))
  }

  expect(await asyncEventEmitter.emit('test', DATA)).toBe(true)
  expect(results.length).toBe(LISTENERS)
  for (const data of results) {
    expect(data).toBe(DATA)
  }
})

test('AsyncEventEmitter emitSync method must emit events synchronously and return boolean', () => {
  const results = []
  const DATA = 'test'
  const LISTENERS = 3

  for (let counter = 1; counter <= LISTENERS; counter++) {
    asyncEventEmitter.once('test', data => results.push(data))
  }

  expect(asyncEventEmitter.emitSync('test', DATA)).toBe(true)
  expect(results.length).toBe(LISTENERS)
  for (const data of results) {
    expect(data).toBe(DATA)
  }
})
