/* global test, expect */

import main from '../main'

test('Just say hello world', () => {
  expect(main()).toBe('Hello world')
})
