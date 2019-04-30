/* global test, expect, TMP_PATH, afterAll */

import makeCore from '../main'

const serverCore = makeCore({
  storagePath: TMP_PATH
})

test('Core must return core module correctly', () => {
  expect(serverCore).toEqual(expect.objectContaining({
    storages: expect.any(Object),
    preferences: expect.any(Object),
    engine: expect.any(Object)
  }))
})

afterAll(() => serverCore.storages.get('preferences').remove())
