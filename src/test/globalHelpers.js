
import path from 'path'
import fs from 'fs'
import idGenerator, { keyCodesList } from '../idGenerator'

const TMP_PATH = path.join(__dirname, 'tmp')
const HELPERS = []

// Define id generator function global as generateId
HELPERS.push(function setupIidGenerator () {
  const lastIdHolderName = path.resolve(TMP_PATH, 'lastId.tmp')

  // Read lsat id
  let lastId = fs.readFileSync(lastIdHolderName, { encoding: 'utf8' })

  if (lastId === 'undefined') lastId = undefined

  const generateId = idGenerator([keyCodesList[1]], lastId)

  Object.defineProperty(global, 'generateId', {
    value: () => {
      const ID = generateId()

      fs.writeFileSync(lastIdHolderName, ID)

      return ID + String(Date.now()).slice(-2) + Math.floor(Math.random() * 100)
    },
    writable: false,
    configurable: false
  })
})

// Define temporary directory global as TMP_PATH
HELPERS.push(function setupTmpPath () {
  Object.defineProperty(global, 'TMP_PATH', {
    value: TMP_PATH,
    writable: false,
    configurable: false
  })
})

for (const helper of HELPERS) { helper() }
