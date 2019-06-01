
import WebSocket from 'ws'

export async function getSocket () {
  return new Promise(resolve => {
    this.once('connection', (...args) => resolve(args))
  })
}

export async function getSomeSockets (size = 1) {
  const sockets = []

  for (let counter = 1; counter <= size; counter++) {
    let webSocket = new WebSocket(this.webSocketServerOptions.address, this.webSocketOptions)

    webSocket.once('error', () => {})

    let socket = await getSocket.call(this.webSocketServer)
    socket[0].request = socket[1]
    socket = socket[0]
    socket.__webSocket__ = webSocket

    sockets.push(socket)
  }

  return sockets
}

export async function getSomeMessages (size = 1) {
  return new Promise(resolve => {
    const result = []

    this.on('message', function getData (data) {
      result.push(JSON.parse(data))

      if (result.length >= size) {
        this.off('message', getData)

        resolve(result)
      }
    })
  })
}
