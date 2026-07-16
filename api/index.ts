import 'reflect-metadata'
import type { Request, Response } from 'express'

// Use compiled output — Vercel runs `npm run build` (tsc) before deploying functions.
import { createApp } from '../dist/app/app'
import { AppDataSource } from '../dist/config/database'
import { connectRedis } from '../dist/config/redis'

let appPromise: Promise<ReturnType<typeof createApp>> | null = null

async function getApp() {
  if (!appPromise) {
    appPromise = (async () => {
      if (!AppDataSource.isInitialized) {
        await AppDataSource.initialize()
      }

      if (!process.env.VERCEL) {
        await connectRedis()
      }

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
  try {
    rewriteUrl(req)
    const app = await getApp()
    return app(req, res)
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[api] Serverless handler failed:', error)

    const message = error instanceof Error ? error.message : 'Unknown startup error'
    const missingEnv =
      message.includes('JWT_SECRET') ||
      message.includes('JWT_REFRESH_SECRET') ||
      message.includes('environment configuration')

    return res.status(503).json({
      success: false,
      message: missingEnv
        ? 'Server misconfigured: required environment variables are missing on Vercel.'
        : 'Server failed to start. Check Vercel function logs.',
      errors: [],
      hint: missingEnv
        ? 'Set JWT_SECRET, JWT_REFRESH_SECRET, DATABASE_URL (or DATABASE_*), FRONTEND_URL, CORS_ORIGIN in Vercel → Settings → Environment Variables.'
        : 'Common causes: DATABASE_URL unreachable, migrations not applied, or cold-start timeout.',
    })
  }
}
