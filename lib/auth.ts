import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          // Check if user exists in database
          const user = await prisma.user.findUnique({
            where: { email: credentials.email }
          })

          if (user) {
            // User exists - verify password
            const isValidPassword = await bcrypt.compare(credentials.password, user.passwordHash)

            if (isValidPassword) {
              return {
                id: user.id,
                name: user.name,
                email: user.email,
                image: user.image
              }
            } else {
              return null // Invalid password
            }
          } else {
            // User doesn't exist - create new user (auto-registration)
            const hashedPassword = await bcrypt.hash(credentials.password, 12)

            const newUser = await prisma.user.create({
              data: {
                name: credentials.email.split('@')[0], // Use email prefix as name
                email: credentials.email,
                passwordHash: hashedPassword,
                image: "/placeholder-user.jpg"
              }
            })

            return {
              id: newUser.id,
              name: newUser.name,
              email: newUser.email,
              image: newUser.image
            }
          }
        } catch (error) {
          console.error('Authentication error:', error)
          return null
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
        token.image = user.image
      }
      return token
    },
    async session({ session, token }) {
      if (session?.user && token) {
        try {
          const userId = token.id as string

          // First, try to find if the user already exists
          let freshUser = await prisma.user.findUnique({
            where: { id: userId },
            select: {
              id: true,
              name: true,
              email: true,
              image: true
            }
          })

          // If user doesn't exist (for OAuth users), create them
          if (!freshUser && token.email) {
            try {
              console.log('Creating new OAuth user:', { userId, email: token.email })
              freshUser = await prisma.user.create({
                data: {
                  id: userId, // Use the OAuth provider's user ID
                  email: token.email as string,
                  name: token.name as string || token.email?.split('@')[0] || 'OAuth User',
                  image: token.image as string || '/placeholder-user.jpg',
                  passwordHash: '', // OAuth users don't need password hash
                },
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true
                }
              })
              console.log('Successfully created OAuth user:', freshUser.id)
            } catch (createError) {
              console.error('Error creating OAuth user:', createError)
              // If creation fails due to unique constraint (email already exists),
              // try to find the existing user by email
              if ((createError as any).code === 'P2002') {
                console.log('User with this email already exists, fetching by email...')
                const existingUser = await prisma.user.findUnique({
                  where: { email: token.email as string },
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    image: true
                  }
                })
                if (existingUser) {
                  freshUser = existingUser
                  console.log('Found existing user by email:', existingUser.id)
                } else {
                  console.error('Could not find user by email either')
                }
              }
            }
          }

          if (freshUser) {
            ;(session.user as any).id = freshUser.id
            session.user.email = freshUser.email
            session.user.name = freshUser.name
            session.user.image = freshUser.image
          } else {
            // Last resort fallback to JWT data
            console.warn('Could not load user from database, using JWT data')
            ;(session.user as any).id = token.id as string
            session.user.email = token.email as string
            session.user.name = token.name as string
            session.user.image = token.image as string
          }
        } catch (error) {
          console.error('Error in session callback:', error)
          // Last resort fallback
          (session.user as any).id = token.id as string
          (session.user as any).email = token.email as string
          (session.user as any).name = token.name as string
          (session.user as any).image = token.image as string
        }
      }
      return session
    },
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
}
