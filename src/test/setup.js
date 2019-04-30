
import path from 'path'
import { promisify } from 'util'
import fs from 'fs'

const TMP_PATH = path.join(__dirname, 'tmp')
const idHolderName = path.join(TMP_PATH, 'lastId.tmp')

export default async function setup () {
  // Make temporary directory
  try { await promisify(fs.mkdir.bind(fs))(TMP_PATH) } catch (e) {}
  // Make last id holder file
  try { await promisify(fs.writeFile.bind(fs))(idHolderName, undefined) } catch (e) {}
}
