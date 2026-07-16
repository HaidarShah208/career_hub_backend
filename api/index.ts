import 'reflect-metadata'
import type { Request, Response } from 'express'

// Use compiled output — Vercel runs `npm run build` (tsc) before deploying functions.
import { createApp } from '../dist/app/app'
import { AppDataSource } from '../dist/config/database'
import { connectRedis } from '../dist/config/redis'

let appPromise: Promise<ReturnType<typeof createApp>> | null = null

const DEFAULT_ALLOWED_ORIGINS = [
  'https://career-hub-five-kohl.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
]

function getAllowedOrigins(): string[] {
  const raw = process.env.CORS_ORIGIN?.trim()
  if (!raw || raw === '*') return DEFAULT_ALLOWED_ORIGINS
  return raw.split(',').map(o => o.trim()).filter(Boolean)
}

/** Always attach CORS headers so browser preflight / crash responses don't look like "CORS blocked". */
function applyCors(req: Request, res: Response): string | null {
  const origin = req.headers.origin
  const allowed = getAllowedOrigins()
  const corsOrigin = process.env.CORS_ORIGIN?.trim()

  let reflect: string | null = null
  if (corsOrigin === '*') {
    reflect = origin ?? '*'
  } else if (origin && allowed.includes(origin)) {
    reflect = origin
  } else if (origin && DEFAULT_ALLOWED_ORIGINS.includes(origin)) {
    // Fallback so a mis-typed Vercel env doesn't hard-block the live frontend.
    reflect = origin
  }

  if (reflect) {
    res.setHeader('Access-Control-Allow-Origin', reflect)
    res.setHeader('Vary', 'Origin')
    res.setHeader('Access-Control-Allow-Credentials', 'true')
  }

  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET,POST,PUT,PATCH,DELETE,OPTIONS',
  )
  res.setHeader(
    'Access-Control-Allow-Headers',
    req.headers['access-control-request-headers'] ??
      'Content-Type, Authorization, Accept',
  )
  res.setHeader('Access-Control-Max-Age', '86400')

  return reflect
}

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
  // 1) CORS first — even if DB/env fails later, preflight must succeed.
  applyCors(req, res)

  // 2) Answer browser OPTIONS preflight without booting TypeORM.
  if (req.method === 'OPTIONS') {
    return res.status(204).end()
  }

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

    // Re-apply in case Express/res already mutated headers.
    applyCors(req, res)

    return res.status(503).json({
      success: false,
      message: missingEnv
        ? 'Server misconfigured: required environment variables are missing on Vercel.'
        : 'Server failed to start. Check Vercel function logs.',
      errors: [],
      hint: missingEnv
        ? 'Set JWT_SECRET, JWT_REFRESH_SECRET, DATABASE_URL, FRONTEND_URL, CORS_ORIGIN for Production in Vercel → Settings → Environment Variables, then Redeploy.'
        : 'Common causes: DATABASE_URL unreachable, migrations not applied, or cold-start timeout.',
    })
  }
}
