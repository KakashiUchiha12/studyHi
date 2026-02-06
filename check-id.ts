
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const targetId = "cmlanmkv10006v5pkqq59yziu"
    try {
        const course = await prisma.course.findUnique({ where: { id: targetId } })
        const user = await prisma.user.findUnique({ where: { id: targetId } })
        console.log("Result:", JSON.stringify({ course: !!course, user: !!user }, null, 2))

        if (course) {
            console.log("Course details:", JSON.stringify(course, null, 2))
        }
    } catch (error) {
        console.error("Query failed:", error)
    } finally {
        await prisma.$disconnect()
    }
}

main()
