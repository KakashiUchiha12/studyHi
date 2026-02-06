
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const slug = 'web-development-course-1770402204520'
    console.log(`Checking course with slug: ${slug}`)

    const course = await prisma.course.findUnique({
        where: { slug },
        select: {
            id: true,
            title: true,
            slug: true,
            courseImage: true,
            status: true
        }
    })

    if (course) {
        console.log('Course found:')
        console.log('ID:', course.id)
        console.log('Title:', course.title)
        console.log('Course Image:', course.courseImage)
        console.log('Status:', course.status)
    } else {
        console.log('Course not found with that slug.')
        // Try searching by title "fdsfds" just in case
        const courseByTitle = await prisma.course.findFirst({
            where: { title: 'fdsfds' }
        })
        if (courseByTitle) {
            console.log('Found course by title "fdsfds":')
            console.log('Slug:', courseByTitle.slug)
            console.log('Course Image:', courseByTitle.courseImage)
        }
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
