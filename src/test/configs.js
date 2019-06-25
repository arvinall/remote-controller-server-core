
export default {
  timeout: process.env.TIMEOUT
    ? Number(process.env.TIMEOUT)
    : 5000,
  connectionsRemoveTimeout: process.env.CONNECTIONS_REMOVE_TIMEOUT
    ? Number(process.env.CONNECTIONS_REMOVE_TIMEOUT)
    : 500,
  log: Number(process.env.LOG) === 1
}
