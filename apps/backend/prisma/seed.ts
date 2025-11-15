import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const ROUNDS = 10; // Hashing rounds

async function main() {
  console.log(`Start seeding ...`);

  // 1. Setup Hashing
  const password = 'password123';
  const hashedPassword = await bcrypt.hash(password, ROUNDS);

  // 2. Create Users (2 Organizers, 5 Participants)
  const usersToCreate = [
    // Organizers
    { email: 'org1@compete.com', name: 'Organizer Alpha', role: Role.ORGANIZER },
    { email: 'org2@compete.com', name: 'Organizer Beta', role: Role.ORGANIZER },
    // Participants
    { email: 'user1@compete.com', name: 'Participant One', role: Role.PARTICIPANT },
    { email: 'user2@compete.com', name: 'Participant Two', role: Role.PARTICIPANT },
    { email: 'user3@compete.com', name: 'Participant Three', role: Role.PARTICIPANT },
    { email: 'user4@compete.com', name: 'Participant Four', role: Role.PARTICIPANT },
    { email: 'user5@compete.com', name: 'Participant Five', role: Role.PARTICIPANT },
  ];

  const createdUsers = await Promise.all(
    usersToCreate.map(u => prisma.user.create({
      data: {
        ...u,
        password: hashedPassword,
      },
    }))
  );

  const organizerIds = createdUsers.filter(u => u.role === Role.ORGANIZER).map(u => u.id);

  // 3. Create Competitions (5 total)
  const today = new Date();
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);

  const competitionsToCreate = [
    { title: 'Local Marathon 5K', capacity: 100, tags: ['running', 'sports'], regDeadline: nextWeek, organizerId: organizerIds[0], description: 'A fun run through the city park.' },
    { title: 'Code Challenge 2026', capacity: 50, tags: ['coding', 'tech'], regDeadline: nextWeek, organizerId: organizerIds[0], description: 'Solve complex algorithms in 24 hours.' },
    { title: 'Design Showdown', capacity: 20, tags: ['design', 'art'], regDeadline: nextWeek, organizerId: organizerIds[1], description: 'A fierce competition for graphic designers.' },
    { title: 'Gaming Tournament', capacity: 500, tags: ['gaming', 'esports'], regDeadline: nextWeek, organizerId: organizerIds[1], description: 'The grand finals for the year.' },
    { title: 'Photography Contest', capacity: 30, tags: ['photography'], regDeadline: nextWeek, organizerId: organizerIds[0], description: 'Submit your best landscape photos.' },
  ];

  await prisma.competition.createMany({ data: competitionsToCreate });

  console.log(`Seeding finished. ${createdUsers.length} users and 5 competitions created.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });