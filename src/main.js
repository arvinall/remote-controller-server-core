
import packageJson from '../package'

/**
 * Main Server Core class
 */
export default class ServerCore {
  /**
   * Make the core ready
   *
   * @param {object} configs
   * @param {string} [configs.mode='production'] (production|development) If set to development, development.tool attached to development.server and start a new activity
   */
  constructor (configs = {}) {
    this.version = packageJson.version
    this.mode = configs.mode || 'production'
  }
}
