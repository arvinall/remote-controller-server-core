/* global test, expect, describe, generateId, TMP_PATH */

import path from 'path'
import Storage from '../storage'
import fs from 'fs'

describe('Storage constructor', () => {
  describe('Errors', () => {
    test('Must throw error when configs parameter is not object', () => {
      const ERROR = 'configs parameter is required and must be object'

      expect(() => new Storage()).toThrow(ERROR)
      expect(() => new Storage('wrong')).toThrow(ERROR)
    })

    test('Must throw error when configs.name property is not string', () => {
      expect(() => new Storage({
        name: 7
      })).toThrow('configs.name is required and must be string')
    })

    test('Must throw error when configs.body property is not undefined/object', () => {
      expect(() => new Storage({
        name: 'testBodyProperty',
        body: 'Hello from test'
      })).toThrow('configs.body must be object')
    })

    test('Must throw error when configs.path property is not string', () => {
      expect(() => new Storage({
        name: 'testPathProperty',
        body: { test: 'Hello from test' },
        path: 7
      })).toThrow('configs.path must be string')
    })

    test('Must throw error when there is no initial content and storage is not accessible', () => {
      let configs = { name: 'testAccessibility' }

      expect(() => new Storage(configs)).toThrow(`${configs.name} is not accessible`)
    })

    test('Must throw error when initial content provided but storage is already exist', () => {
      let configs = {
        name: 'package',
        body: {
          name: 'test-storage-constructor'
        }
      }

      expect(() => new Storage(configs)).toThrow(`${configs.name} is already exist`)
    })
  })

  describe('Success', () => {
    test('Initial storage without error', () => {
      let configs = {
        name: generateId(),
        body: {
          test: 'Initial storage successfully'
        },
        path: TMP_PATH
      }
      let storageInstance = new Storage(configs)

      expect(storageInstance).toBeInstanceOf(Storage)
      expect(storageInstance).toHaveProperty('body', configs.body)
      expect(storageInstance + '').toBe('[object Storage]')

      fs.unlinkSync(path.join(TMP_PATH, configs.name + '.json'))
    })

    test('Read storage without error', () => {
      let configs = {
        name: 'package'
      }
      let storageInstance = new Storage(configs)

      expect(storageInstance).toBeInstanceOf(Storage)
      expect(storageInstance.body.repository.type).toBe('git')
    })
  })
})

describe('Storage remove method', () => {
  describe('Errors', () => {
    test('Must throw error when remove a removed storage (sync)', () => {
      let body = { test: 'Remove twice storage (sync)' }
      let storage = new Storage({
        name: generateId(),
        path: TMP_PATH,
        body
      })

      storage.removeSync()

      expect(storage.body).toBeUndefined()
      expect(storage.removeSync.bind(storage)).toThrow('Storage is not accessible')
    })

    test('Must throw error when remove a removed storage (async)', async () => {
      expect.assertions(2)

      let body = { test: 'Remove twice storage (async)' }
      let storage = new Storage({
        name: generateId(),
        path: TMP_PATH,
        body
      })

      await storage.remove()

      expect(storage.body).toBeUndefined()

      try {
        await storage.remove()
      } catch (error) {
        expect(error.message).toBe('Storage is not accessible')
      }
    })
  })

  describe('Success', () => {
    test('Remove storage without error (sync)', () => {
      let body = {
        test: 'Remove storage without error (sync)'
      }
      let storage = new Storage({
        name: generateId(),
        path: TMP_PATH,
        body
      })

      expect(storage.removeSync()).toBeUndefined()

      expect(storage.body).toBeUndefined()
    })

    test('Remove storage without error (async)', async () => {
      expect.assertions(2)

      let body = {
        test: 'Remove storage without error (async)'
      }
      let storage = new Storage({
        name: generateId(),
        path: TMP_PATH,
        body
      })

      expect(await storage.remove()).toBeUndefined()

      expect(storage.body).toBeUndefined()
    })
  })
})

describe('Storage update method', () => {
  describe('Errors', () => {
    test('Must throw error when body parameter is undefined', () => {
      let body = {
        test: 'Update storage without body parameter'
      }
      let storage = new Storage({
        name: generateId(),
        path: TMP_PATH,
        body
      })

      expect(storage.update.bind(storage)).toThrow('body parameter is required and must be object/function')
      expect(storage.updateSync.bind(storage)).toThrow('body parameter is required and must be object/function')

      storage.removeSync()
    })

    test('Must throw error when body parameter is not object/function', () => {
      let body = {
        test: 'Update storage with non object/function body parameter'
      }
      let storage = new Storage({
        name: generateId(),
        path: TMP_PATH,
        body
      })

      expect(storage.update.bind(storage, body.test)).toThrow('body parameter is required and must be object/function')
      expect(storage.updateSync.bind(storage, body.test)).toThrow('body parameter is required and must be object/function')

      storage.remove()
    })

    test('Must throw error when storage is deleted and not accessible (sync)', () => {
      let body = {
        test: 'Update deleted storage (sync)'
      }
      let storage = new Storage({
        name: generateId(),
        path: TMP_PATH,
        body
      })

      storage.removeSync()

      expect(storage.updateSync.bind(storage, Object.assign({}, body, {
        update: 'Ops'
      }))).toThrow('Storage is not accessible')
    })

    test('Must throw error when storage is deleted and not accessible (async)', async () => {
      expect.assertions(1)

      let body = {
        test: 'Update deleted storage (async)'
      }
      let storage = new Storage({
        name: generateId(),
        path: TMP_PATH,
        body
      })

      await storage.remove()

      try {
        await storage.update(storage, Object.assign({}, body, {
          update: 'Ops'
        }))
      } catch (error) {
        expect(error.message).toBe('Storage is not accessible')
      }
    })
  })

  describe('Success', () => {
    test('Update via object without error (sync)', () => {
      let body = {
        test: 'Update storage with object body parameter (sync)'
      }
      let storage = new Storage({
        name: generateId(),
        path: TMP_PATH,
        body
      })

      expect(storage.updateSync(Object.assign(body, {
        update: 'Updated'
      }))).toBeUndefined()

      expect(storage.body).toEqual(body)

      storage.removeSync()
    })

    test('Update via object without error (async)', async () => {
      expect.assertions(2)

      let body = {
        test: 'Update storage with object body parameter (async)'
      }
      let storage = new Storage({
        name: generateId(),
        path: TMP_PATH,
        body
      })

      expect(await storage.updateSync(Object.assign(body, {
        update: 'Updated'
      }))).toBeUndefined()

      expect(storage.body).toEqual(body)

      await storage.removeSync()
    })

    test('Update via function without error (sync)', () => {
      let updatedBody
      let body = {
        test: 'Update storage with function body parameter (sync)'
      }
      let storage = new Storage({
        name: generateId(),
        path: TMP_PATH,
        body
      })

      expect(storage.updateSync(body => {
        body.update = 'Updated'

        updatedBody = body

        return body
      })).toBeUndefined()

      expect(storage.body).toEqual(updatedBody)

      storage.removeSync()
    })

    test('Update via function without error (async)', async () => {
      expect.assertions(2)

      let updatedBody
      let body = {
        test: 'Update storage with function body parameter (async)'
      }
      let storage = new Storage({
        name: generateId(),
        path: TMP_PATH,
        body
      })

      expect(await storage.update(body => {
        body.update = 'Updated'

        updatedBody = body

        return body
      })).toBeUndefined()

      expect(storage.body).toEqual(updatedBody)

      await storage.remove()
    })
  })
})

describe('Storage events', () => {
  test('Must emit removed event when Storage removed (sync)', done => {
    expect.assertions(1)

    const configs = {
      name: generateId(),
      body: { test: 'removed event' },
      path: TMP_PATH
    }
    const storage = new Storage(configs)

    storage.once('removed', event => {
      expect(event).toEqual({
        name: configs.name,
        body: configs.body
      })

      done()
    })

    storage.removeSync()
  })

  test('Must emit removed event when Storage removed (async)', async done => {
    expect.assertions(1)

    const configs = {
      name: generateId(),
      body: { test: 'removed event' },
      path: TMP_PATH
    }
    const storage = new Storage(configs)

    storage.once('removed', event => {
      expect(event).toEqual({
        name: configs.name,
        body: configs.body
      })

      done()
    })

    await storage.remove()
  })

  test('Must emit updated event when Storage updated (sync)', done => {
    expect.assertions(1)

    const configs = {
      name: generateId(),
      body: { test: 'updated event' },
      path: TMP_PATH
    }
    const storage = new Storage(configs)

    let updatedBody = Object.assign({}, configs.body, {
      update: 'Updated successfully'
    })

    storage.once('updated', event => {
      expect(event).toEqual({
        lastBody: configs.body,
        updatedBody
      })

      done()
    })

    storage.updateSync(updatedBody)

    storage.removeSync()
  })

  test('Must emit updated event when Storage updated (async)', async done => {
    expect.assertions(1)

    const configs = {
      name: generateId(),
      body: { test: 'updated event' },
      path: TMP_PATH
    }
    const storage = new Storage(configs)

    let updatedBody = Object.assign({}, configs.body, {
      update: 'Updated successfully'
    })

    storage.once('updated', event => {
      expect(event).toEqual({
        lastBody: configs.body,
        updatedBody
      })

      done()
    })

    await storage.update(updatedBody)

    await storage.remove()
  })
})
