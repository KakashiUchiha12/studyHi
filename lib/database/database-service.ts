import { PrismaClient } from '@prisma/client'
import { validateEnvironment } from '../env-validation'

// Database service base class
export class DatabaseService {
  private prisma: PrismaClient
  private static instance: DatabaseService
  private connectionRetries: number = 0
  private readonly maxRetries: number = 3
  private readonly retryDelay: number = 1000 // 1 second

  private constructor() {
    try {
      // Validate environment before creating Prisma client
      validateEnvironment()

      this.prisma = new PrismaClient({
        log: ['error'], // Only log errors, no query spam
      })

      console.log('🔍 Database: Prisma client initialized successfully')
    } catch (error) {
      console.error('🔍 Database: Failed to initialize Prisma client:', error)
      throw new Error(`Database initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Singleton pattern to ensure single database connection
  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService()
    }
    return DatabaseService.instance
  }

  // Get Prisma client instance
  public getPrisma(): PrismaClient {
    return this.prisma
  }

  // Improved connection method with retry logic
  public async connect(): Promise<void> {
    if (!this.prisma) {
      throw new Error('Prisma client not initialized')
    }

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`🔍 Database: Connecting to database (attempt ${attempt}/${this.maxRetries})...`)

        // Test connection first
        await this.testConnection()

        console.log('🔍 Database: Connected successfully')
        this.connectionRetries = 0
        return
      } catch (error) {
        this.connectionRetries = attempt

        const errorMessage = error instanceof Error ? error.message : 'Unknown error'

        console.error(`🔍 Database: Connection attempt ${attempt} failed:`, errorMessage)

        if (attempt === this.maxRetries) {
          console.error('🔍 Database: Max retries exceeded, failing...')
          throw new Error(`Failed to connect to database after ${this.maxRetries} attempts: ${errorMessage}`)
        }

        // Exponential backoff
        const delay = this.retryDelay * Math.pow(2, attempt - 1)
        console.log(`🔍 Database: Retrying in ${delay}ms...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  // Close database connection
  public async disconnect(): Promise<void> {
    try {
      if (this.prisma) {
        await this.prisma.$disconnect()
        console.log('🔍 Database: Disconnected successfully')
      }
    } catch (error) {
      console.error('🔍 Database: Error during disconnect:', error)
      // Don't throw on disconnect errors
    }
  }

  // Enhanced health check with timeout
  public async healthCheck(): Promise<boolean> {
    try {
      console.log('🔍 Database: Performing health check...')

      // Add timeout to health check
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Health check timeout')), 5000)
      )

      await Promise.race([
        this.prisma.$queryRaw`SELECT 1`,
        timeoutPromise
      ])

      console.log('🔍 Database: Health check successful')
      return true
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('🔍 Database: Health check failed:', errorMessage)
      return false
    }
  }

  // Test database connection with detailed error and timeout
  public async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔍 Database: Testing connection...')

      // Add timeout to connection test
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Connection test timeout')), 10000)
      )

      await Promise.race([
        this.prisma.$queryRaw`SELECT 1`,
        timeoutPromise
      ])

      console.log('🔍 Database: Connection test successful')
      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('🔍 Database: Connection test failed:', {
        error: error,
        message: errorMessage,
        stack: error instanceof Error ? error.stack : 'No stack trace',
        retryCount: this.connectionRetries
      })
      return { success: false, error: errorMessage }
    }
  }

  // Initialize database with sample data if empty
  public async initializeDatabase(): Promise<void> {
    try {
      // Only create database structure, don't create sample data for users
      // Users will create their own subjects as needed
      console.log('Database initialized successfully')
    } catch (error) {
      console.error('Failed to initialize database:', error)
    }
  }

  // User management methods
  public async getUser(userId: string) {
    try {
      console.log('🔍 Database: Fetching user:', userId)

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          createdAt: true,
          updatedAt: true
        }
      })

      if (!user) {
        throw new Error(`User with id ${userId} not found`)
      }

      console.log('🔍 Database: User fetched successfully:', user.id)
      return user
    } catch (error) {
      console.error('🔍 Database: Error fetching user:', error)
      throw error
    }
  }

  public async updateUser(userId: string, data: { name?: string; email?: string; image?: string }) {
    try {
      console.log('🔍 Database: Updating user:', userId, 'with data:', data)

      // Validate that at least one field is provided
      if (!data.name && !data.email && !data.image) {
        throw new Error('At least one field must be provided for update')
      }

      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data,
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          createdAt: true,
          updatedAt: true
        }
      })

      console.log('🔍 Database: User updated successfully:', updatedUser.id)
      return updatedUser
    } catch (error) {
      console.error('🔍 Database: Error updating user:', error)
      throw error
    }
  }


}

// Export singleton instance
export const dbService = DatabaseService.getInstance()
