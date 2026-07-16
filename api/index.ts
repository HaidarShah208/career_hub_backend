import 'reflect-metadata'
import type { Request, Response } from 'express'

import { createApp } from '../src/app/app'
import { AppDataSource } from '../src/config/database'
import { connectRedis } from '../src/config/redis'

let appPromise: Promise<ReturnType<typeof createApp>> | null = null

async function getApp() {
  if (!appPromise) {
    appPromise = (async () => {
      if (!AppDataSource.isInitialized) {
        await AppDataSource.initialize()
      }

      await connectRedis()
      return createApp()
    })().catch(error => {
      appPromise = null
      throw error
    })
  }

  return appPromise
}

function rewriteUrl(req: Request) {
  const routeParam = req.query.__route
  const route = Array.isArray(routeParam) ? routeParam.join('/') : routeParam ?? ''

  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(req.query)) {
    if (key === '__route') continue

    if (Array.isArray(value)) {
      for (const item of value) params.append(key, String(item))
      continue
    }

    if (value !== undefined) {
      params.append(key, String(value))
    }
  }

  req.url = `/${route}${params.size > 0 ? `?${params.toString()}` : ''}`
}

export default async function handler(req: Request, res: Response) {
  rewriteUrl(req)
  const app = await getApp()
  return app(req, res)
}
