
export default {
  timeout: process.env.timeout
    ? Number(process.env.timeout)
    : 5000,
  connectionsRemoveTimeout: process.env.connectionsRemoveTimeout
    ? Number(process.env.connectionsRemoveTimeout)
    : 500
}
