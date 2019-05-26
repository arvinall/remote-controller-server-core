/* global test, expect, describe, jest, afterAll, TMP_PATH, generateId */

import makeEngine from '../index'
import makeStorages from '../../storages'
import makePreferences from '../../preferences'
import makeConnections from '../../connections'

jest.mock('os', () => {
  const os = require.requireActual('os')
  const networkInterfacesCache = os.networkInterfaces()
  const firstNetworkInterface = Object.keys(networkInterfacesCache)[0]

  const networkInterfaces = () => ({
    [firstNetworkInterface]: [networkInterfacesCache[firstNetworkInterface][0]]
  })

  os.networkInterfaces = networkInterfaces

  return os
})

const core = Object.create(null)

core.storages = makeStorages.call(core, { path: TMP_PATH })
core.__preferencesStorageName = generateId()
core.preferences = makePreferences.call(core, { name: core.__preferencesStorageName })
core.connections = makeConnections.call(core)

const engine = makeEngine.call(core)

describe('engine start method', () => {
  test('Must throw error when network is not available (async)', async () => {
    expect.assertions(1)

    const ERROR = 'Network is not available'

    try {
      await engine.start()
    } catch (error) {
      expect(error.message).toBe(ERROR)
    }
  })
})

afterAll(async () => core.storages.remove(core.__preferencesStorageName))
