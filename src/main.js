
const PACKAGE_JSON = require('../package')

/**
 * Main Server Core class
 */
export default class serverCore {
  /**
   * Make the core ready
   *
   * @param {object} configs
   * @param {string} [configs.mode='production'] (production|development) If set to development, developmentTool parameter attached to developmentServer start a new activity
   */
  constructor (configs = {}) {
    this.version = PACKAGE_JSON.version
    this.mode = configs.mode || 'production'
  }
}
