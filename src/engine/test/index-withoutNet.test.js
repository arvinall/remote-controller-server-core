/* global test, expect, describe, jest, TMP_PATH */

import Logger from '../../logger'
import makeEngine from '../index'

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

const core = {
  logger: new Logger(TMP_PATH),
  connections: {
    add () {},
    on () {}
  }
}

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
