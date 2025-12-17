import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"
import { generateUsername } from "@/lib/username-generator"

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
              image: true,
              // @ts-ignore
              username: true
            }
          })

          // If user doesn't exist (for OAuth users), create them
          // If user doesn't exist by ID, try to find by email (to handle OAuth/Credentials merging)
          if (!freshUser && token.email) {
            freshUser = await prisma.user.findUnique({
              where: { email: token.email as string },
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
                // @ts-ignore
                username: true
              }
            })

            // If still no user, create one
            if (!freshUser) {
              try {
                console.log('Creating new OAuth user:', { userId, email: token.email })
                freshUser = await prisma.user.create({
                  data: {
                    id: userId, // Note: This uses the OAuth ID as the Primary Key. Ideally we should generate a CUID and link account, but maintaining current behavior.
                    email: token.email as string,
                    name: token.name as string || token.email?.split('@')[0] || 'OAuth User',
                    image: token.image as string || '/placeholder-user.jpg',
                    passwordHash: '',
                  },
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    image: true,
                    // @ts-ignore
                    username: true // Select username here too to avoid issues later
                  }
                })
                console.log('Successfully created OAuth user:', freshUser.id)
              } catch (createError) {
                console.error('Error creating OAuth user:', createError)
                // If race condition occurred, try to find one last time (rare)
                freshUser = await prisma.user.findUnique({
                  where: { email: token.email as string },
                  select: { id: true, name: true, email: true, image: true, username: true } as any
                })
              }
            } else {
              console.log('Found existing user by email (OAuth link):', freshUser.id)
            }
          }

          if (freshUser) {
            // Check if username is missing and generate one
            // @ts-ignore
            if (!freshUser.username) {
              const newUsername = generateUsername(freshUser.name);

              try {
                freshUser = await prisma.user.update({
                  where: { id: freshUser.id },
                  data: { username: newUsername },
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    image: true,
                    username: true
                  }
                });
              } catch (e) {
                console.error("Failed to auto-generate username", e);
              }
            }

            (session.user as any).id = freshUser.id
            session.user.email = freshUser.email
            session.user.name = freshUser.name
            session.user.image = freshUser.image;
            (session.user as any).username = (freshUser as any).username;
          } else {
            // Last resort fallback to JWT data
            console.warn('Could not load user from database, using JWT data')
              ; (session.user as any).id = token.id as string
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
