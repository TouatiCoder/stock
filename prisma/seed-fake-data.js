require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();
const SHARED_PASSWORD = "Ayoub2001@";

const USERS = [
  {
    email: "admin@buildstock-demo.ma",
    password: SHARED_PASSWORD,
    firstName: "Yassine",
    lastName: "El Amrani",
    role: "admin",
    phone: "+212661020304",
    isPlatformAdmin: false,
  },
  {
    email: "chef.chantier@buildstock-demo.ma",
    password: SHARED_PASSWORD,
    firstName: "Karim",
    lastName: "Benali",
    role: "site_manager",
    phone: "+212662030405",
    isPlatformAdmin: false,
  },
  {
    email: "ingenieur@buildstock-demo.ma",
    password: SHARED_PASSWORD,
    firstName: "Salma",
    lastName: "Tazi",
    role: "structural_engineer",
    phone: "+212663040506",
    isPlatformAdmin: false,
  },
  {
    email: "achats@buildstock-demo.ma",
    password: SHARED_PASSWORD,
    firstName: "Nadia",
    lastName: "Fassi",
    role: "user",
    phone: "+212664050607",
    isPlatformAdmin: false,
  },
];

async function main() {
  const now = new Date();

  const company = await prisma.company.create({
    data: {
      name: "BuildStock Démo SARL",
      email: "contact@buildstock-demo.ma",
      siret: null,
      phone: "+212522334455",
      address: "12 Rue des Fabricants, Zone Industrielle Sidi Bernoussi",
      city: "Casablanca",
      postalCode: "20600",
      ice: "001234567000089",
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

  const createdUsers = {};
  for (const u of USERS) {
    const passwordHash = bcrypt.hashSync(u.password, 10);
    const user = await prisma.user.create({
      data: {
        email: u.email,
        password: passwordHash,
        authMethod: "password_only",
        firstName: u.firstName,
        lastName: u.lastName,
        role: u.role,
        phone: u.phone,
        active: true,
        isPlatformAdmin: u.isPlatformAdmin,
        companyId: company.id,
        updatedAt: now,
      },
    });
    createdUsers[u.role + ":" + u.email] = user;
  }

  const adminUser = Object.values(createdUsers).find((u) => u.role === "admin" && !u.isPlatformAdmin);
  const siteManager = Object.values(createdUsers).find((u) => u.role === "site_manager");
  const engineer = Object.values(createdUsers).find((u) => u.role === "structural_engineer");

  const supplierCiment = await prisma.supplier.create({
    data: {
      name: "Ciments du Maroc Distribution",
      contactPerson: "Hassan Ouali",
      email: "hassan.ouali@ciments-maroc-demo.ma",
      phone: "+212524556677",
      address: "Route Nationale 1, Km 12, Casablanca",
      isActive: true,
      companyId: company.id,
      updatedAt: now,
    },
  });

  const supplierAcier = await prisma.supplier.create({
    data: {
      name: "Fer & Acier Atlas",
      contactPerson: "Latifa Bennis",
      email: "latifa.bennis@acier-atlas-demo.ma",
      phone: "+212524667788",
      address: "Zone Industrielle Ain Sebaa, Casablanca",
      isActive: true,
      companyId: company.id,
      updatedAt: now,
    },
  });

  const warehouse = await prisma.warehouse.create({
    data: {
      name: "Entrepôt Central Casablanca",
      location: "Zone Industrielle Sidi Bernoussi, Casablanca",
      capacity: 5000,
      isMain: true,
      isActive: true,
      companyId: company.id,
      updatedAt: now,
    },
  });

  const materialsData = [
    { name: "Ciment CPJ45 (sac 50kg)", unit: "sac", unitPrice: 68.5, category: "Ciment", supplierId: supplierCiment.id, qty: 850, min: 100 },
    { name: "Fer à béton HA12 (barre 12m)", unit: "barre", unitPrice: 145.0, category: "Acier", supplierId: supplierAcier.id, qty: 320, min: 50 },
    { name: "Sable de construction", unit: "m3", unitPrice: 120.0, category: "Granulat", supplierId: supplierCiment.id, qty: 60, min: 20 },
    { name: "Brique creuse 20x20", unit: "unité", unitPrice: 2.8, category: "Maçonnerie", supplierId: null, qty: 12000, min: 2000 },
  ];

  const createdMaterials = [];
  for (const m of materialsData) {
    const material = await prisma.material.create({
      data: {
        name: m.name,
        unit: m.unit,
        unitPrice: m.unitPrice,
        category: m.category,
        supplierId: m.supplierId,
        companyId: company.id,
        updatedAt: now,
      },
    });
    createdMaterials.push(material);

    await prisma.inventory.create({
      data: {
        quantity: m.qty,
        minThreshold: m.min,
        materialId: material.id,
        warehouseId: warehouse.id,
        companyId: company.id,
        updatedAt: now,
      },
    });
  }

  const project = await prisma.project.create({
    data: {
      name: "Résidence Al Fath - Lot B",
      description: "Construction d'un immeuble R+4 de 12 appartements",
      clientName: "Groupe Immobilier Al Fath",
      clientEmail: "contact@al-fath-immo-demo.ma",
      clientPhone: "+212522998877",
      address: "Lotissement Al Fath, Lot 34",
      city: "Casablanca",
      postalCode: "20250",
      projectType: "residentiel",
      status: "in_progress",
      startDate: new Date("2026-02-01"),
      endDate: new Date("2026-12-15"),
      totalBudget: 4500000,
      currentCost: 1120000,
      companyId: company.id,
      siteManagerId: siteManager.id,
      structuralEngineerId: engineer.id,
      updatedAt: now,
    },
  });

  const purchaseOrder = await prisma.purchaseOrder.create({
    data: {
      orderNumber: "PO-2026-0001",
      status: "pending",
      totalAmount: 850 * 68.5 + 320 * 145.0,
      orderDate: new Date("2026-07-10"),
      expectedDelivery: new Date("2026-07-25"),
      supplierId: supplierCiment.id,
      companyId: company.id,
      createdById: adminUser.id,
      updatedAt: now,
    },
  });

  await prisma.purchaseOrderItem.create({
    data: {
      quantity: 850,
      unitPrice: 68.5,
      totalPrice: 850 * 68.5,
      purchaseOrderId: purchaseOrder.id,
      materialId: createdMaterials[0].id,
      updatedAt: now,
    },
  });

  await prisma.purchaseOrderItem.create({
    data: {
      quantity: 320,
      unitPrice: 145.0,
      totalPrice: 320 * 145.0,
      purchaseOrderId: purchaseOrder.id,
      materialId: createdMaterials[1].id,
      updatedAt: now,
    },
  });

  console.log("\n=== FAKE DATA SEEDED SUCCESSFULLY ===");
  console.log("Company:", company.name, "(" + company.id + ")");
  console.log("Project:", project.name);
  console.log("Purchase order:", purchaseOrder.orderNumber);
  console.log("\n=== LOGIN CREDENTIALS (email : password) ===");
  for (const u of USERS) {
    console.log(`${u.email} : ${u.password}  [role: ${u.role}${u.isPlatformAdmin ? ", platform_admin" : ""}]`);
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
