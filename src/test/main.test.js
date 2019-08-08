/* global test, expect, TMP_PATH, afterAll */

import makeCore from '../main'

const serverCore = makeCore({
  storagePath: TMP_PATH,
  loggerPath: TMP_PATH,
  pluginPath: TMP_PATH
})

test('Core must return core module correctly', () => {
  expect(serverCore).toEqual(expect.objectContaining({
    plugins: expect.any(Object),
    logger: expect.any(Object),
    storages: expect.any(Object),
    preferences: expect.any(Object),
    connections: expect.any(Object),
    engine: expect.any(Object)
  }))
})

afterAll(() => serverCore.storages.get('preferences').remove())
