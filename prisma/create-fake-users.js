require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();
const SHARED_PASSWORD = "Ayoub2001@";

const USERS = [
  {
    email: "fake.admin@livreee-demo.ma",
    firstName: "Ayoub",
    lastName: "El Idrissi",
    role: "admin",
    phone: "+212660110220",
  },
  {
    email: "fake.chef@livreee-demo.ma",
    firstName: "Mouad",
    lastName: "Benkirane",
    role: "site_manager",
    phone: "+212661110221",
  },
  {
    email: "fake.ingenieur@livreee-demo.ma",
    firstName: "Salma",
    lastName: "Alaoui",
    role: "structural_engineer",
    phone: "+212662110222",
  },
  {
    email: "fake.achat@livreee-demo.ma",
    firstName: "Imane",
    lastName: "Bennani",
    role: "user",
    phone: "+212663110223",
  },
  {
    email: "fake.magasinier@livreee-demo.ma",
    firstName: "Youssef",
    lastName: "Tazi",
    role: "user",
    phone: "+212664110224",
  },
];

async function main() {
  const now = new Date();
  const passwordHash = bcrypt.hashSync(SHARED_PASSWORD, 10);

  let company = await prisma.company.findFirst({
    orderBy: { createdAt: "asc" },
  });

  if (!company) {
    company = await prisma.company.create({
      data: {
        name: "Livreee Demo Company",
        email: "contact@livreee-demo.ma",
        phone: "+212522110220",
        address: "15 Rue des Tests, Casablanca",
        city: "Casablanca",
        postalCode: "20000",
        currency: "MAD",
        country: "Maroc",
        timezone: "Africa/Casablanca",
        plan: "pro",
        isActive: true,
        updatedAt: now,
      },
    });
  }

  for (const user of USERS) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        password: passwordHash,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        phone: user.phone,
        active: true,
        companyId: company.id,
        updatedAt: now,
      },
      create: {
        email: user.email,
        password: passwordHash,
        authMethod: "password_only",
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        phone: user.phone,
        active: true,
        isPlatformAdmin: false,
        companyId: company.id,
        updatedAt: now,
      },
    });
  }

  console.log("\n=== FAKE USERS READY ===");
  console.log(`Company: ${company.name}`);
  console.log(`Shared password: ${SHARED_PASSWORD}`);
  for (const user of USERS) {
    console.log(`${user.email} | ${user.firstName} ${user.lastName} | ${user.role}`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
