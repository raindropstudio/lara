import type { Server } from 'elysia/universal/server'
import type { AddressInfo } from 'node:net'

import type { createApp } from './app.js'

type App = ReturnType<typeof createApp>

type NodeAdapterServer = Server & {
  raw?: {
    ready?: () => Promise<unknown>
    node?: {
      server?: {
        address: () => AddressInfo | string | null
      }
    }
  }
}

export type ListenOptions = {
  hostname: string
  port: number
}

export const startServer = async (app: App, options: ListenOptions) => {
  const server = await new Promise<Server>((resolve, reject) => {
    try {
      app.listen(
        { ...options, reusePort: false },
        (startedServer) =>
          void waitUntilReady(startedServer).then(resolve, reject),
      )
    } catch (error) {
      reject(error)
    }
  })

  return server
}

export const getServerUrl = (server: Server) => {
  const address = (server as NodeAdapterServer).raw?.node?.server?.address()

  if (address && typeof address !== 'string') {
    const hostname = address.address.includes(':')
      ? `[${address.address}]`
      : address.address

    return new URL(`http://${hostname}:${address.port}`)
  }

  return server.url
}

const waitUntilReady = async (server: Server) => {
  const raw = (server as NodeAdapterServer).raw

  if (raw?.ready) {
    await raw.ready()
  }

  return server
}
