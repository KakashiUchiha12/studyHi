
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const course = await prisma.course.findFirst({
        where: {
            title: 'Web Development COURSE'
        }
    })

    if (course) {
        console.log('Course found:', course.title)
        console.log('ID:', course.id)
        console.log('Course Image:', course.courseImage)
        console.log('Status:', course.status)
    } else {
        console.log('Course not found')
    }
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
