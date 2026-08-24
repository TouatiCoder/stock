require("dotenv").config();
const crypto = require("crypto");
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();
const SHARED_PASSWORD = "Ayoub2001@";

const COMPANY_COUNT = 20;

const CITIES = [
  "Casablanca", "Rabat", "Marrakech", "Fès", "Tanger", "Agadir", "Meknès",
  "Oujda", "Kénitra", "Tétouan", "Safi", "El Jadida", "Béni Mellal", "Nador",
  "Settat", "Khouribga", "Taza", "Essaouira", "Larache", "Mohammedia",
];

const ADMIN_FIRST = ["Yassine", "Karim", "Omar", "Hicham", "Mehdi", "Younes", "Rachid", "Anas", "Zakaria", "Tarik", "Adil", "Nabil", "Reda", "Bilal", "Sami", "Walid", "Amine", "Fouad", "Jamal", "Khalid"];
const ADMIN_LAST = ["El Amrani", "Benali", "Idrissi", "Tazi", "Bennis", "Ouali", "Fassi", "Chraibi", "Alaoui", "Berrada", "Squalli", "Lahlou", "Sefrioui", "Zniber", "Kabbaj", "Bensouda", "Filali", "Cherkaoui", "Naciri", "Bouziane"];

const CM_FIRST = ["Mounir", "Aziz", "Samir", "Hamza", "Othmane", "Ismail", "Driss", "Aymane", "Soufiane", "Badr", "Youssef", "Hassan", "Ayoub", "Marouane", "Abdellah", "Rayan", "Anouar", "Chakib", "Fadel", "Imad"];
const CM_LAST = ["Baha", "Sabri", "Moujahid", "Rifai", "Amrani", "Ziani", "Haddad", "Bakkali", "Chafik", "Ghazi", "Toumi", "Bahi", "Rami", "Naji", "Habti", "Warda", "Zerouali", "Belhaj", "Moussaoui", "Sabbar"];

const ENG_FIRST = ["Salma", "Nadia", "Imane", "Sara", "Meryem", "Fatima", "Laila", "Khadija", "Hind", "Zineb", "Rim", "Asmae", "Ghita", "Loubna", "Karima", "Siham", "Ouiam", "Btissam", "Amal", "Douae"];
const ENG_LAST = ["Tazi", "Fassi", "Bennani", "Alami", "Rachidi", "Sekkat", "Bahmad", "Mekouar", "Cherradi", "Guennoun", "Idrissi", "Tahiri", "Ouazzani", "Belkadi", "Sbai", "Jettou", "Zerhouni", "Kadmiri", "Ouahbi", "Sahli"];

function genPassword() {
  return SHARED_PASSWORD;
}

async function main() {
  const now = new Date();
  const credentials = [];

  for (let i = 1; i <= COMPANY_COUNT; i++) {
    const city = CITIES[(i - 1) % CITIES.length];

    const company = await prisma.company.create({
      data: {
        name: `BTP ${ADMIN_LAST[i - 1]} Construction ${i}`,
        email: `contact${i}@buildstock-demo.ma`,
        phone: `+2125223300${String(i).padStart(2, "0")}`,
        address: `${i} Avenue Mohammed V`,
        city,
        postalCode: "20000",
        currency: "MAD",
        country: "Maroc",
        timezone: "Africa/Casablanca",
        plan: "pro",
        isActive: true,
        updatedAt: now,
      },
    });

    await prisma.platformSubscription.create({
      data: {
        companyId: company.id,
        planCode: "pro",
        status: "active",
        currentPeriodStart: now,
        currentPeriodEnd: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
        monthlyAmount: 799,
        currency: "MAD",
        updatedAt: now,
      },
    });

    const adminEmail = `admin${i}@buildstock-demo.ma`;
    const adminPassword = genPassword("Admin", i);
    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        password: bcrypt.hashSync(adminPassword, 10),
        authMethod: "password_only",
        firstName: ADMIN_FIRST[i - 1],
        lastName: ADMIN_LAST[i - 1],
        role: "admin",
        phone: `+21266${String(1000000 + i).slice(-7)}`,
        active: true,
        isPlatformAdmin: false,
        companyId: company.id,
        updatedAt: now,
      },
    });

    const chantierEmail = `chantier${i}@buildstock-demo.ma`;
    const chantierPassword = genPassword("Chantier", i);
    const chantierToken = crypto.randomUUID();
    await prisma.invitation.create({
      data: {
        email: chantierEmail,
        role: "site_manager",
        token: chantierToken,
        expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        acceptedAt: now,
        companyId: company.id,
        invitedById: admin.id,
        updatedAt: now,
      },
    });
    const chantier = await prisma.user.create({
      data: {
        email: chantierEmail,
        password: bcrypt.hashSync(chantierPassword, 10),
        authMethod: "password_only",
        firstName: CM_FIRST[i - 1],
        lastName: CM_LAST[i - 1],
        role: "site_manager",
        phone: `+21267${String(1000000 + i).slice(-7)}`,
        active: true,
        isPlatformAdmin: false,
        companyId: company.id,
        updatedAt: now,
      },
    });

    const ingenieurEmail = `ingenieur${i}@buildstock-demo.ma`;
    const ingenieurPassword = genPassword("Ingenieur", i);
    const ingenieurToken = crypto.randomUUID();
    await prisma.invitation.create({
      data: {
        email: ingenieurEmail,
        role: "structural_engineer",
        token: ingenieurToken,
        expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        acceptedAt: now,
        companyId: company.id,
        invitedById: admin.id,
        updatedAt: now,
      },
    });
    const ingenieur = await prisma.user.create({
      data: {
        email: ingenieurEmail,
        password: bcrypt.hashSync(ingenieurPassword, 10),
        authMethod: "password_only",
        firstName: ENG_FIRST[i - 1],
        lastName: ENG_LAST[i - 1],
        role: "structural_engineer",
        phone: `+21268${String(1000000 + i).slice(-7)}`,
        active: true,
        isPlatformAdmin: false,
        companyId: company.id,
        updatedAt: now,
      },
    });

    credentials.push({
      company: company.name,
      admin: { email: adminEmail, password: adminPassword },
      chantier: { email: chantierEmail, password: chantierPassword },
      ingenieur: { email: ingenieurEmail, password: ingenieurPassword },
    });

    console.log(`[${i}/${COMPANY_COUNT}] ${company.name} -> admin, chantier, ingenieur créés`);
  }

  console.log("\n=== RECAP: 20 admins, chacun avec chantier + ingenieur invités ===\n");
  for (const c of credentials) {
    console.log(c.company);
    console.log(`  admin      : ${c.admin.email} : ${c.admin.password}`);
    console.log(`  chantier   : ${c.chantier.email} : ${c.chantier.password}`);
    console.log(`  ingenieur  : ${c.ingenieur.email} : ${c.ingenieur.password}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
