import { z } from 'zod'

// Environment variable validation schema
const envSchema = z.object({
  // Database Configuration
  DATABASE_URL: z.string().url().refine(
    (url) => url.startsWith('file:') || url.includes('localhost') || url.includes('sqlite'),
    { message: "DATABASE_URL must be a valid SQLite URL" }
  ),

  // Authentication
  NEXTAUTH_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(32, "NEXTAUTH_SECRET must be at least 32 characters"),

  // OAuth Providers (optional but validated if present)
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),

  // Real-time Features (optional)
  PUSHER_APP_ID: z.string().optional(),
  PUSHER_KEY: z.string().optional(),
  PUSHER_SECRET: z.string().optional(),
  PUSHER_CLUSTER: z.string().optional(),

  // File Upload (optional)
  UPLOADTHING_SECRET: z.string().optional(),
  UPLOADTHING_APP_ID: z.string().optional(),

  // Analytics (optional)
  NEXT_PUBLIC_ANALYTICS_ID: z.string().optional(),

  // Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
})

// Validate OAuth configuration if credentials are provided
const oauthDependencySchema = z.object({
  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
}).or(z.object({
  GITHUB_CLIENT_ID: z.string(),
  GITHUB_CLIENT_SECRET: z.string(),
})).or(z.object({})).optional()

// Validate external service configurations
const pusherSchema = z.object({
  PUSHER_APP_ID: z.string(),
  PUSHER_KEY: z.string(),
  PUSHER_SECRET: z.string(),
  PUSHER_CLUSTER: z.string(),
}).or(z.object({})).optional()

const uploadThingSchema = z.object({
  UPLOADTHING_SECRET: z.string(),
  UPLOADTHING_APP_ID: z.string(),
}).or(z.object({})).optional()

// Combine all validations
const fullEnvSchema = z.object({
  ...envSchema.shape,
  ...oauthDependencySchema.shape,
  ...pusherSchema.shape,
  ...uploadThingSchema.shape,
}).strict()

// Cache validation result
let validatedEnv: z.infer<typeof envSchema> | null = null

/**
 * Validate environment variables
 * @throws Error if environment variables are invalid
 */
export function validateEnvironment(): z.infer<typeof envSchema> {
  if (validatedEnv) return validatedEnv

  try {
    validatedEnv = envSchema.parse(process.env)
    // Silent success for production - only log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Environment validation successful')

      // Log warnings for optional services
      if (!process.env.GOOGLE_CLIENT_ID) {
        console.warn('⚠️ Google OAuth not configured - OAuth login disabled')
      }
      if (!process.env.GITHUB_CLIENT_ID) {
        console.warn('⚠️ GitHub OAuth not configured - OAuth login disabled')
      }
      if (!process.env.PUSHER_APP_ID) {
        console.warn('⚠️ Pusher not configured - Real-time features disabled')
      }
      if (!process.env.UPLOADTHING_SECRET) {
        console.warn('⚠️ UploadThing not configured - File upload disabled')
      }
    }

    return validatedEnv
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(err =>
        `${err.path.join('.')}: ${err.message}`
      ).join('\n  - ')

      console.error('❌ Environment validation failed:')
      console.error(`  - ${errorMessages}`)

      throw new Error(`Invalid environment configuration:\n  - ${errorMessages}`)
    }

    console.error('❌ Unexpected environment validation error:', error)
    throw error
  }
}

/**
 * Get validated environment variables
 */
export function getValidatedEnv(): z.infer<typeof envSchema> {
  return validateEnvironment()
}

/**
 * Check if a service is configured
 */
export function isServiceConfigured(service: 'oauth' | 'pusher' | 'uploadthing'): boolean {
  const env = getValidatedEnv()

  switch (service) {
    case 'oauth':
      return !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) ||
             !!(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET)
    case 'pusher':
      return !!(env.PUSHER_APP_ID && env.PUSHER_KEY && env.PUSHER_SECRET && env.PUSHER_CLUSTER)
    case 'uploadthing':
      return !!(env.UPLOADTHING_SECRET && env.UPLOADTHING_APP_ID)
    default:
      return false
  }
}

// Validate on module load in development
if (process.env.NODE_ENV === 'development') {
  try {
    validateEnvironment()
  } catch (error) {
    console.error('🚨 Critical: Environment validation failed on startup!')
    console.error('Please fix your .env.local file and restart the development server.')
    process.exit(1)
  }
}
