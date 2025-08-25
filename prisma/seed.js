const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  // Find the first space and owner
  const space = await prisma.space.findFirst();
  const owner = space ? await prisma.user.findUnique({ where: { id: space.ownerId } }) : null;

  if (!space || !owner) {
    console.log('No space or owner found. Please create a space and user first.');
    return;
  }

  // Create demo Task: Read a Book
  await prisma.task.create({
    data: {
      title: 'Read a Book',
      description: 'Spend 30 minutes reading any book of your choice.',
      spaceId: space.id,
      ownerId: owner.id,
    },
  });

  console.log('Demo task "Read a Book" created.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
