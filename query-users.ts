
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    try {
        const users = await prisma.user.findMany({
            take: 5,
            select: { id: true, name: true, email: true }
        })
        console.log("Users:", JSON.stringify(users, null, 2))
    } catch (error) {
        console.error("Query failed:", error)
    } finally {
        await prisma.$disconnect()
    }
}

main()
