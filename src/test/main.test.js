/* global test, expect */

import path from 'path'
import Core from '../main'

const TMP_PATH = path.join(process.cwd(), 'tmp')

test('Core must return core module correctly', () => {
  let core = Core({
    storagePath: TMP_PATH
  })

  expect(core).toEqual(expect.objectContaining({
    preferences: expect.any(Object)
  }))
})
