
import path from 'path'
import { promisify } from 'util'
import fs from 'fs'

const TMP_PATH = path.join(__dirname, 'tmp')
const idHolderName = path.join(TMP_PATH, 'lastId.tmp')

export default async function teardown () {
  // Remove last id holder file
  try { await promisify(fs.unlink.bind(fs))(idHolderName) } catch (e) {}
  // Remove temporary directory
  try { await promisify(fs.rmdir.bind(fs))(TMP_PATH) } catch (e) {}
}
