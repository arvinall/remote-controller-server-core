
import path from 'path'
import { promisify } from 'util'
import fs from 'fs'
import envConfigs from './configs'

const TMP_PATH = path.join(__dirname, 'tmp')
const idHolderName = path.join(TMP_PATH, 'lastId.tmp')
const logFilesName = [
  path.join(TMP_PATH, 'info.log'),
  path.join(TMP_PATH, 'error.log'),
  path.join(TMP_PATH, 'warn.log')
]

export default async function teardown () {
  // Remove last id holder file
  try { await promisify(fs.unlink.bind(fs))(idHolderName) } catch (e) {}
  // Remove log files
  if (!envConfigs.log) {
    for (const file of logFilesName) {
      try { await promisify(fs.unlink.bind(fs))(file) } catch (e) {}
    }
  }
  // Remove temporary directory
  try { await promisify(fs.rmdir.bind(fs))(TMP_PATH) } catch (e) {}
}
