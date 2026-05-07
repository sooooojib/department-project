import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    const hashedPassword = await hash('adminpass123', 10)
    
    // Create an admin user if it doesn't exist
    const admin = await prisma.user.upsert({
        where: { email: 'admin@portal.com' },
        update: {},
        create: {
            email: 'admin@portal.com',
            name: 'System Administrator',
            password: hashedPassword,
            role: 'ADMIN',
        },
    })
    
    console.log('Seeded admin user:', admin)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
