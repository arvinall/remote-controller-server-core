/** global global, setTimeout */

/**
 * @module activities
 */

import EventEmitter from 'events'
import * as helpers from '../helpers'
import Activity from './activity'
import Connection from '../connections/connection'
import Plugin from '../plugins/plugin'
import { makeClassLoggable } from '../logger'

// Error classes
const logObject = {
  scope: 'makeActivities',
  module: 'activities',
  event: undefined
}
const TypeError = makeClassLoggable(global.TypeError, logObject)

/**
 * makeActivities creates activities module
 *
 * @param {object} [configs={}]
 *
 * @return {module:activities~Activities}
 */
export default function makeActivities (configs = Object.create(null)) {
  if (typeof configs !== 'object') throw new TypeError('configs parameter must be object')

  const connections = this.connections
  const plugins = this.plugins
  const activitiesList = {}

  class Activities extends EventEmitter {
    /**
     * Handle activities messages
     */
    constructor () {
      super()

      const self = this

      async function connectionsOnAddActivity (configs) {
        let Plugin = plugins.get(configs.plugin)
        let activity
        let result

        if (Plugin === undefined) {
          result = {
            status: 2,
            error: configs.plugin + ' plugin not found',
            plugin: configs.plugin,
            id: configs.id
          }

          await this.send('addActivity', result)

          self.emit('addActivity', result)
        } else {
          Plugin = Plugin.Plugin
          activity = activitiesList[configs.id]

          if (configs.status !== 0 && activity === undefined) {
            result = {
              status: 2,
              error: 'Activity not found',
              plugin: configs.plugin,
              id: configs.id
            }

            await this.send('addActivity', result)

            self.emit('addActivity', result)
          } else {
            switch (configs.status) {
              case 0:
                activity = self.add(this, Plugin)

                result = {
                  status: 0,
                  id: activity.id,
                  plugin: configs.plugin
                }

                await this.send('addActivity', result)

                self.emit('addActivity', result)
                break
              case 1:
                activity.emit('init')

                result = {
                  status: 1,
                  id: activity.id,
                  plugin: configs.plugin
                }

                this.send('addActivity', result)
                  .then(() => self.emit('addActivity', result))

                activity.emit('ready')
                break
              case 2:
                self.remove(activity)
                break
            }
          }
        }
      }
      async function connectionsOnRemoveActivity (configs) {
        let activity = activitiesList[configs.id]
        let result

        if (activity === undefined) {
          result = {
            status: 2,
            error: 'Activity not found',
            id: configs.id
          }

          await this.send('removeActivity', result)

          self.emit('removeActivity', result)
        } else {
          switch (configs.status) {
            case 0:
              activity.emit('cleanup')

              result = {
                status: 0,
                id: activity.id
              }

              await this.send('removeActivity', result)

              self.emit('removeActivity', result)
              break
            case 1:
              self.remove(activity)

              result = {
                status: 1,
                id: activity.id
              }

              await this.send('removeActivity', result)

              self.emit('removeActivity', result)
              break
            case 2:
              self.remove(activity)
              break
          }
        }
      }

      connections.on('connected', connection => {
        const onAddActivity = connectionsOnAddActivity.bind(connection)
        const onRemoveActivity = connectionsOnRemoveActivity.bind(connection)

        connection.on('authentication', ({ status, factor }) => {
          if (!factor) {
            switch (status) {
              case 1:
                connection.on('addActivity', onAddActivity)
                connection.on('removeActivity', onRemoveActivity)

                connection.once('disconnected', () => {
                  if (connection.listenerCount('addActivity')) {
                    connection.off('addActivity', onAddActivity)
                    connection.off('removeActivity', onRemoveActivity)

                    // Close connection's activities on disconnected event
                    for (const activityId in activitiesList) {
                      const activity = activitiesList[activityId]

                      if (!activitiesList.hasOwnProperty(activityId) ||
                        activity.connection !== connection) continue

                      if (activity.status === 'init' ||
                        activity.status === 'ready') activity.emit('cleanup')
                      if (activity.status !== 'close') activity.emit('close')
                    }

                    // Remove connection's activities base-on connections removeTimeout
                    setTimeout(() => {
                      if (!connection.isConnect) {
                        for (const activityId in activitiesList) {
                          if (!activitiesList.hasOwnProperty(activityId) ||
                            activitiesList[activityId].connection !== connection) continue

                          this.remove(activitiesList[activityId])
                        }
                      }
                    }, connections.removeTimeout)
                  }
                })
                break
              case 2:
                connection.off('addActivity', onAddActivity)
                connection.off('removeActivity', onRemoveActivity)
                break
            }
          }
        })
      })
    }

    /**
     * @summary Get specific Activity or all Activities list
     * @description
     * When call this method without ActivityId parameter, returned object is iterable (over values) <br>
     * `Object.values({@link module:activities~activity#get|activity.get()})[Symbol.iterator]`
     * is same as
     * `{@link module:activities~activity#get|activity.get()}[Symbol.iterator]`
     *
     * @param {string} [activityId]
     *
     * @return {(module:activities~activity|object<string, module:activities~activity>)}
     */
    get (activityId) {
      if (activityId !== undefined &&
        typeof activityId !== 'string') throw new TypeError('pluginName parameter must be string')

      if (activityId) return activitiesList[activityId]

      const activitiesListPrototype = {
        length: 0,
        [Symbol.iterator]: helpers.object.iterateOverValues
      }
      const _activitiesList = Object.create(activitiesListPrototype)

      for (const [ key, value ] of Object.entries(activitiesList)) {
        _activitiesList[key] = value

        activitiesListPrototype.length++
      }

      return _activitiesList
    }

    /**
     * Add and initial Activity
     *
     * @param {(module:connections/connection|module:activities/activity)} connection
     * @param {module:plugins/plugin} [_Plugin] Plugin extended class
     *
     * @emits module:activities/activity#event:added
     *
     * @return {module:activities/activity}
     */
    add (connection, _Plugin) {
      if (!(connection instanceof Activity) &&
        !(connection instanceof Connection)) throw new TypeError('connection parameter is required and must be Activity/Connection')
      else if (connection instanceof Connection &&
        Object.getPrototypeOf(_Plugin) !== Plugin) throw new TypeError('Plugin parameter is required and must be Plugin extended class')

      if (connection instanceof Connection) {
        connection = new Activity({
          connection,
          Plugin: _Plugin
        })
      }

      activitiesList[connection.id] = connection

      /**
       * Activity added event
       *
       * @event module:activities/activity#event:added
       *
       * @type {module:activities/activity}
       */
      this.emit('added', connection)

      return connection
    }

    /**
     * Remove activity from list
     *
     * @param {(module:activities/activity|string)} activity Activity instance or id
     *
     * @emits module:activities/activity#event:removed
     *
     * @return {boolean}
     */
    remove (activity) {
      if (!(activity instanceof Activity) &&
        typeof activity !== 'string') throw new TypeError('activity parameter is required and must be Activity/string')

      if (typeof activity === 'string') activity = activitiesList[activity]

      let result = false

      if (activity instanceof Activity) {
        if (activity.status === 'init' ||
          activity.status === 'ready') activity.emit('cleanup')
        if (activity.status !== 'close') activity.emit('close')

        result = delete activitiesList[activity.id]
      }

      /**
       * Activity removed event
       *
       * @event module:activities/activity#event:removed
       *
       * @type {module:activities/activity}
       */
      if (result) this.emit('removed', activity)

      return result
    }

    /**
     * Check Activity is already exist
     *
     * @param {string} activityId Activity's id to check
     *
     * @return {boolean}
     */
    has (activityId) {
      return activitiesList.hasOwnProperty(activityId)
    }
  }

  // Set string tag
  helpers.decorator.setStringTag()(Activities)

  return new Activities()
}

export Activity from './activity'
