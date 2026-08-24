require("dotenv").config();
const { PrismaClient, Prisma } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const { randomUUID } = require("crypto");

const prisma = new PrismaClient();
const SHARED_PASSWORD = "Ayoub2001@";

const DEMO_USERS = [
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

const SUPPLIERS = [
  {
    name: "Ciments Atlas",
    contactPerson: "Hassan Ouali",
    email: "contact@ciments-atlas-demo.ma",
    phone: "+212522440001",
    address: "Zone Industrielle Sidi Bernoussi, Casablanca",
  },
  {
    name: "Steel Pro Maroc",
    contactPerson: "Latifa Bennis",
    email: "contact@steel-pro-demo.ma",
    phone: "+212522440002",
    address: "Route de Mediouna, Casablanca",
  },
  {
    name: "Agregats Nord",
    contactPerson: "Youssef El Fassi",
    email: "contact@agregats-nord-demo.ma",
    phone: "+212522440003",
    address: "Route de Rabat, Mohammedia",
  },
  {
    name: "Elec Bat",
    contactPerson: "Nadia Chraibi",
    email: "contact@elec-bat-demo.ma",
    phone: "+212522440004",
    address: "Ain Sebaa, Casablanca",
  },
];

const WAREHOUSES = [
  {
    name: "Depot Central Casablanca",
    location: "Zone Industrielle Sidi Bernoussi",
    capacity: 7000,
    isMain: true,
  },
  {
    name: "Depot Chantier Nord",
    location: "Quartier Anfa, Casablanca",
    capacity: 2200,
    isMain: false,
  },
  {
    name: "Depot Chantier Sud",
    location: "Route de Marrakech",
    capacity: 1800,
    isMain: false,
  },
];

const MATERIALS = [
  { name: "Ciment CPJ45 (sac 50kg)", unit: "sac", unitPrice: 68.5, category: "Ciment", supplierIndex: 0, qtyMain: 780, qtyNorth: 140, qtySouth: 60, min: 100 },
  { name: "Fer a beton HA12 (barre 12m)", unit: "barre", unitPrice: 145.0, category: "Acier", supplierIndex: 1, qtyMain: 260, qtyNorth: 40, qtySouth: 20, min: 60 },
  { name: "Sable de construction", unit: "m3", unitPrice: 120.0, category: "Granulat", supplierIndex: 2, qtyMain: 55, qtyNorth: 18, qtySouth: 6, min: 15 },
  { name: "Gravier 8/16", unit: "m3", unitPrice: 135.0, category: "Granulat", supplierIndex: 2, qtyMain: 38, qtyNorth: 11, qtySouth: 4, min: 12 },
  { name: "Bloc creux 20x20", unit: "unite", unitPrice: 2.8, category: "Maconnerie", supplierIndex: null, qtyMain: 9000, qtyNorth: 1800, qtySouth: 700, min: 2000 },
  { name: "Fil de ligature", unit: "kg", unitPrice: 19.5, category: "Acier", supplierIndex: 1, qtyMain: 85, qtyNorth: 16, qtySouth: 8, min: 20 },
  { name: "Panneau de coffrage", unit: "unite", unitPrice: 185.0, category: "Coffrage", supplierIndex: 3, qtyMain: 120, qtyNorth: 36, qtySouth: 18, min: 20 },
];

const PROJECTS = [
  {
    name: "Residence Al Fath - Lot A",
    description: "Immeuble R+4 avec sous-sol et parking",
    clientName: "Al Fath Immobilier",
    city: "Casablanca",
    status: "in_progress",
    totalBudget: 5400000,
    currentCost: 1640000,
    startDate: "2026-02-10",
    endDate: "2026-12-20",
  },
  {
    name: "Villa Marina",
    description: "Villa haut standing avec piscine et amenagements exterieurs",
    clientName: "Marina Real Estate",
    city: "Dar Bouazza",
    status: "planning",
    totalBudget: 1800000,
    currentCost: 120000,
    startDate: "2026-08-10",
    endDate: "2027-02-28",
  },
  {
    name: "Showroom Industriel",
    description: "Batiment industriel et showroom commercial",
    clientName: "Atlas Industry",
    city: "Mohammedia",
    status: "completed",
    totalBudget: 3200000,
    currentCost: 3185000,
    startDate: "2025-11-01",
    endDate: "2026-06-30",
  },
];

const CHECKLIST_TEMPLATES = [
  {
    title: "Checklist securite hebdo",
    items: ["EPI verifies", "Echafaudages controles", "Signalisation en place", "Extincteurs disponibles", "Zone stockage securisee"],
  },
  {
    title: "Checklist qualite beton",
    items: ["Coffrage propre", "Ferraillage controle", "Dosage valide", "Vibration planifiee", "Echantillon preleve"],
  },
];

const COUNT_SESSION_ITEMS = [
  { name: "Ciment CPJ45 (sac 50kg)", countedDelta: -12 },
  { name: "Fer a beton HA12 (barre 12m)", countedDelta: 4 },
];

async function upsertUser(companyId, user, passwordHash, now) {
  return prisma.user.upsert({
    where: { email: user.email },
    update: {
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      phone: user.phone,
      active: true,
      companyId,
      password: passwordHash,
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
      companyId,
      updatedAt: now,
    },
  });
}

async function findOrCreateCompany(now) {
  const seedUser = await prisma.user.findUnique({
    where: { email: "fake.admin@livreee-demo.ma" },
    include: { company: true },
  });

  if (seedUser?.company) return seedUser.company;

  const existingCompany = await prisma.company.findFirst({
    where: { email: "contact@livreee-demo.ma" },
  });

  if (existingCompany) return existingCompany;

  return prisma.company.create({
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

async function ensurePlatformSubscription(companyId, now) {
  const existing = await prisma.platformSubscription.findUnique({ where: { companyId } }).catch(() => null);
  if (existing) return existing;
  return prisma.platformSubscription.create({
    data: {
      companyId,
      planCode: "pro",
      status: "active",
      trialEndsAt: null,
      currentPeriodStart: now,
      currentPeriodEnd: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
      monthlyAmount: 799,
      currency: "MAD",
      updatedAt: now,
    },
  });
}

async function ensureSupplier(companyId, supplierData, now) {
  const existing = await prisma.supplier.findFirst({ where: { companyId, email: supplierData.email } });
  if (existing) return existing;
  return prisma.supplier.create({
    data: {
      ...supplierData,
      isActive: true,
      companyId,
      updatedAt: now,
    },
  });
}

async function ensureWarehouse(companyId, warehouseData, now) {
  const existing = await prisma.warehouse.findFirst({ where: { companyId, name: warehouseData.name } });
  if (existing) return existing;
  return prisma.warehouse.create({
    data: {
      ...warehouseData,
      companyId,
      isActive: true,
      updatedAt: now,
    },
  });
}

async function ensureMaterial(companyId, materialData, supplierId, now) {
  const existing = await prisma.material.findFirst({ where: { companyId, name: materialData.name } });
  if (existing) return existing;
  return prisma.material.create({
    data: {
      name: materialData.name,
      unit: materialData.unit,
      unitPrice: materialData.unitPrice,
      category: materialData.category,
      supplierId,
      companyId,
      updatedAt: now,
    },
  });
}

async function ensureInventory(companyId, materialId, warehouseId, quantity, minThreshold, now) {
  const existing = await prisma.inventory.findFirst({
    where: { companyId, materialId, warehouseId },
  });

  if (existing) {
    return prisma.inventory.update({
      where: { id: existing.id },
      data: {
        quantity,
        minThreshold,
        updatedAt: now,
      },
    });
  }

  return prisma.inventory.create({
    data: {
      materialId,
      warehouseId,
      quantity,
      minThreshold,
      maxThreshold: null,
      companyId,
      updatedAt: now,
    },
  });
}

async function ensureProject(companyId, projectData, siteManagerId, engineerId, now) {
  const existing = await prisma.project.findFirst({ where: { companyId, name: projectData.name } });
  if (existing) return existing;
  return prisma.project.create({
    data: {
      name: projectData.name,
      description: projectData.description,
      clientName: projectData.clientName,
      clientEmail: `${projectData.name.toLowerCase().replace(/[^a-z0-9]+/g, ".")}@demo.ma`,
      clientPhone: "+212522998877",
      address: `${projectData.name} site`,
      city: projectData.city,
      postalCode: "20000",
      projectType: "construction",
      status: projectData.status,
      startDate: new Date(projectData.startDate),
      endDate: new Date(projectData.endDate),
      totalBudget: projectData.totalBudget,
      currentCost: projectData.currentCost,
      companyId,
      siteManagerId,
      structuralEngineerId: engineerId,
      updatedAt: now,
    },
  });
}

async function ensureLegacyStockTables() {
  const tables = [
    `
      CREATE TABLE IF NOT EXISTS stock_reservations (
        id VARCHAR(255) NOT NULL PRIMARY KEY,
        company_id VARCHAR(255) NOT NULL,
        project_id VARCHAR(255) NOT NULL,
        material_id VARCHAR(255) NOT NULL,
        quantity DECIMAL(10,2) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'active',
        created_by VARCHAR(255) NULL,
        released_by VARCHAR(255) NULL,
        created_at DATETIME(0) NOT NULL DEFAULT UTC_TIMESTAMP(),
        updated_at DATETIME(0) NOT NULL DEFAULT UTC_TIMESTAMP(),
        released_at DATETIME(0) NULL,
        INDEX idx_stock_reservations_company (company_id),
        INDEX idx_stock_reservations_project (project_id),
        INDEX idx_stock_reservations_material (material_id),
        INDEX idx_stock_reservations_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `,
    `
      CREATE TABLE IF NOT EXISTS stock_count_sessions (
        id VARCHAR(255) NOT NULL PRIMARY KEY,
        company_id VARCHAR(255) NOT NULL,
        warehouse_id VARCHAR(255) NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'draft',
        created_by VARCHAR(255) NULL,
        posted_by VARCHAR(255) NULL,
        created_at DATETIME(0) NOT NULL DEFAULT UTC_TIMESTAMP(),
        updated_at DATETIME(0) NOT NULL DEFAULT UTC_TIMESTAMP(),
        posted_at DATETIME(0) NULL,
        INDEX idx_stock_count_sessions_company (company_id),
        INDEX idx_stock_count_sessions_warehouse (warehouse_id),
        INDEX idx_stock_count_sessions_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `,
    `
      CREATE TABLE IF NOT EXISTS stock_count_items (
        id VARCHAR(255) NOT NULL PRIMARY KEY,
        session_id VARCHAR(255) NOT NULL,
        material_id VARCHAR(255) NOT NULL,
        system_qty DECIMAL(10,2) NOT NULL DEFAULT 0,
        counted_qty DECIMAL(10,2) NOT NULL DEFAULT 0,
        variance_qty DECIMAL(10,2) NOT NULL DEFAULT 0,
        created_at DATETIME(0) NOT NULL DEFAULT UTC_TIMESTAMP(),
        updated_at DATETIME(0) NOT NULL DEFAULT UTC_TIMESTAMP(),
        INDEX idx_stock_count_items_session (session_id),
        INDEX idx_stock_count_items_material (material_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `,
    `
      CREATE TABLE IF NOT EXISTS stock_adjustments (
        id VARCHAR(255) NOT NULL PRIMARY KEY,
        company_id VARCHAR(255) NOT NULL,
        material_id VARCHAR(255) NOT NULL,
        adjustment_qty DECIMAL(10,2) NOT NULL,
        reason VARCHAR(100) NOT NULL,
        source_session_id VARCHAR(255) NULL,
        created_by VARCHAR(255) NULL,
        created_at DATETIME(0) NOT NULL DEFAULT UTC_TIMESTAMP(),
        INDEX idx_stock_adjustments_company (company_id),
        INDEX idx_stock_adjustments_material (material_id),
        INDEX idx_stock_adjustments_session (source_session_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `,
    `
      CREATE TABLE IF NOT EXISTS low_stock_alerts (
        id VARCHAR(255) NOT NULL PRIMARY KEY,
        company_id VARCHAR(255) NOT NULL,
        material_id VARCHAR(255) NOT NULL,
        threshold_qty DECIMAL(10,2) NOT NULL,
        current_qty DECIMAL(10,2) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'open',
        triggered_at DATETIME(0) NOT NULL DEFAULT UTC_TIMESTAMP(),
        INDEX idx_low_stock_alerts_company (company_id),
        INDEX idx_low_stock_alerts_material (material_id),
        INDEX idx_low_stock_alerts_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `,
  ];

  for (const tableSql of tables) {
    await prisma.$executeRawUnsafe(tableSql);
  }
}

async function ensurePurchaseOrder(companyId, supplierId, adminId, materialsByName, now, idx) {
  const orderNumber = `PO-2026-1${idx}`;
  const existing = await prisma.purchaseOrder.findUnique({ where: { orderNumber } }).catch(() => null);
  if (existing) return existing;

  const itemA = materialsByName["Ciment CPJ45 (sac 50kg)"];
  const itemB = materialsByName["Fer a beton HA12 (barre 12m)"];

  const po = await prisma.purchaseOrder.create({
    data: {
      orderNumber,
      status: idx === 1 ? "pending" : "approved",
      totalAmount: itemA.unitPrice.toNumber() * 120 + itemB.unitPrice.toNumber() * 60,
      orderDate: new Date("2026-07-20"),
      expectedDelivery: new Date("2026-08-05"),
      supplierId,
      companyId,
      createdById: adminId,
      updatedAt: now,
    },
  });

  await prisma.purchaseOrderItem.create({
    data: {
      quantity: 120,
      unitPrice: itemA.unitPrice,
      totalPrice: itemA.unitPrice.toNumber() * 120,
      purchaseOrderId: po.id,
      materialId: itemA.id,
      updatedAt: now,
    },
  });

  await prisma.purchaseOrderItem.create({
    data: {
      quantity: 60,
      unitPrice: itemB.unitPrice,
      totalPrice: itemB.unitPrice.toNumber() * 60,
      purchaseOrderId: po.id,
      materialId: itemB.id,
      updatedAt: now,
    },
  });

  return po;
}

async function ensureNotification(companyId, userId, type, title, message, now) {
  const existing = await prisma.notification.findFirst({
    where: { companyId, userId, title },
  });
  if (existing) return existing;
  return prisma.notification.create({
    data: {
      companyId,
      userId,
      type,
      title,
      message,
      isRead: false,
      updatedAt: now,
    },
  });
}

async function ensureChecklist(companyId, projectId, createdById, template, now) {
  const existing = await prisma.checklist.findFirst({
    where: { companyId, projectId, title: template.title },
  });
  if (existing) return existing;

  const checklist = await prisma.checklist.create({
    data: {
      companyId,
      projectId,
      createdById,
      title: template.title,
      checklistType: "general",
      status: "in_progress",
      updatedAt: now,
    },
  });

  for (let i = 0; i < template.items.length; i += 1) {
    await prisma.checklistItem.create({
      data: {
        checklistId: checklist.id,
        label: template.items[i],
        isChecked: i < 2,
        position: i,
        updatedAt: now,
      },
    });
  }

  return checklist;
}

async function ensureProjectExpense(companyId, projectId, category, description, amount, createdById, now) {
  const existing = await prisma.projectExpense.findFirst({
    where: { companyId, projectId, category, description },
  });
  if (existing) return existing;

  return prisma.projectExpense.create({
    data: {
      companyId,
      projectId,
      category,
      description,
      amount,
      createdBy: createdById,
      updatedAt: now,
    },
  });
}

async function ensureToolCalculation(companyId, projectId, userId, toolType, inputJson, outputJson, notes, now) {
  const existing = await prisma.toolCalculation.findFirst({
    where: { companyId, projectId, toolType, notes },
  });
  if (existing) return existing;

  return prisma.toolCalculation.create({
    data: {
      companyId,
      userId,
      projectId,
      toolType,
      inputJson,
      outputJson,
      notes,
      updatedAt: now,
    },
  });
}

async function ensureStockMovement(companyId, materialId, userId, movement, now) {
  const existing = await prisma.stockMovement.findFirst({
    where: {
      materialId,
      movementType: movement.movementType,
      quantity: movement.quantity,
      description: movement.description || null,
    },
  });
  if (existing) return existing;

  return prisma.stockMovement.create({
    data: {
      projectId: movement.projectId ?? null,
      materialId,
      userId,
      movementType: movement.movementType,
      sourceType: movement.sourceType ?? null,
      sourceWarehouseId: movement.sourceWarehouseId ?? null,
      destinationType: movement.destinationType ?? null,
      destinationWarehouseId: movement.destinationWarehouseId ?? null,
      quantity: movement.quantity,
      description: movement.description || null,
      movementDate: now,
    },
  });
}

async function ensureRawReservation(companyId, projectId, materialId, quantity, createdById, now) {
  const existing = await prisma.$queryRaw(
    Prisma.sql`
      SELECT id FROM stock_reservations
      WHERE company_id = ${companyId} AND project_id = ${projectId} AND material_id = ${materialId} AND status = 'active'
      LIMIT 1
    `,
  );

  if (Array.isArray(existing) && existing.length > 0) return existing[0];

  const reservationId = randomUUID();
  await prisma.$executeRaw(
    Prisma.sql`
      INSERT INTO stock_reservations
      (id, company_id, project_id, material_id, quantity, status, created_by, created_at, updated_at)
      VALUES
      (${reservationId}, ${companyId}, ${projectId}, ${materialId}, ${quantity}, 'active', ${createdById}, UTC_TIMESTAMP(), UTC_TIMESTAMP())
    `,
  );
  return { id: reservationId };
}

async function ensureRawCountSession(companyId, warehouseId, createdById, items, now) {
  const [existing] = await prisma.$queryRaw(
    Prisma.sql`
      SELECT id FROM stock_count_sessions
      WHERE company_id = ${companyId} AND warehouse_id = ${warehouseId} AND status = 'draft'
      LIMIT 1
    `,
  );
  if (existing) return existing;

  const sessionId = randomUUID();
  await prisma.$executeRaw(
    Prisma.sql`
      INSERT INTO stock_count_sessions
      (id, company_id, warehouse_id, status, created_by, created_at, updated_at)
      VALUES
      (${sessionId}, ${companyId}, ${warehouseId}, 'draft', ${createdById}, UTC_TIMESTAMP(), UTC_TIMESTAMP())
    `,
  );

  for (const item of items) {
    const itemId = randomUUID();
    await prisma.$executeRaw(
      Prisma.sql`
        INSERT INTO stock_count_items
        (id, session_id, material_id, system_qty, counted_qty, variance_qty, created_at, updated_at)
        VALUES
        (${itemId}, ${sessionId}, ${item.materialId}, ${item.systemQty}, ${item.countedQty}, ${item.countedQty - item.systemQty}, UTC_TIMESTAMP(), UTC_TIMESTAMP())
      `,
    );
  }

  return { id: sessionId };
}

async function ensureLowStockAlert(companyId, materialId, thresholdQty, currentQty, now) {
  const [existing] = await prisma.$queryRaw(
    Prisma.sql`
      SELECT id FROM low_stock_alerts
      WHERE company_id = ${companyId} AND material_id = ${materialId} AND status = 'open'
      LIMIT 1
    `,
  );
  if (existing) return existing;

  const alertId = randomUUID();
  await prisma.$executeRaw(
    Prisma.sql`
      INSERT INTO low_stock_alerts
      (id, company_id, material_id, threshold_qty, current_qty, status, triggered_at)
      VALUES
      (${alertId}, ${companyId}, ${materialId}, ${thresholdQty}, ${currentQty}, 'open', UTC_TIMESTAMP())
    `,
  );
  return { id: alertId };
}

async function main() {
  const now = new Date();
  await ensureLegacyStockTables();
  const company = await findOrCreateCompany(now);
  const passwordHash = bcrypt.hashSync(SHARED_PASSWORD, 10);

  const usersByRole = {};
  for (const user of DEMO_USERS) {
    const created = await upsertUser(company.id, user, passwordHash, now);
    usersByRole[user.role] = created;
  }

  const [adminUser, siteManager, engineer] = [usersByRole.admin, usersByRole.site_manager, usersByRole.structural_engineer];

  await ensurePlatformSubscription(company.id, now);

  const suppliers = [];
  for (const supplier of SUPPLIERS) {
    suppliers.push(await ensureSupplier(company.id, supplier, now));
  }

  const warehouses = [];
  for (const warehouse of WAREHOUSES) {
    warehouses.push(await ensureWarehouse(company.id, warehouse, now));
  }

  const materialsByName = {};
  for (const material of MATERIALS) {
    const supplierId = material.supplierIndex == null ? null : suppliers[material.supplierIndex]?.id ?? null;
    const created = await ensureMaterial(company.id, material, supplierId, now);
    materialsByName[material.name] = created;

    await ensureInventory(company.id, created.id, warehouses[0].id, material.qtyMain, material.min, now);
    await ensureInventory(company.id, created.id, warehouses[1].id, material.qtyNorth, material.min, now);
    await ensureInventory(company.id, created.id, warehouses[2].id, material.qtySouth, material.min, now);
  }

  const projects = [];
  for (const projectData of PROJECTS) {
    projects.push(await ensureProject(company.id, projectData, siteManager.id, engineer.id, now));
  }

  await ensurePurchaseOrder(company.id, suppliers[0].id, adminUser.id, materialsByName, now, 1);
  await ensurePurchaseOrder(company.id, suppliers[1].id, adminUser.id, materialsByName, now, 2);

  await ensureStockMovement(company.id, materialsByName["Ciment CPJ45 (sac 50kg)"].id, adminUser.id, {
    movementType: "in",
    sourceType: "supplier",
    destinationType: "warehouse",
    destinationWarehouseId: warehouses[0].id,
    quantity: 120,
    description: "Reception fournisseur",
  }, now);

  await ensureStockMovement(company.id, materialsByName["Ciment CPJ45 (sac 50kg)"].id, siteManager.id, {
    movementType: "transfer",
    sourceType: "warehouse",
    sourceWarehouseId: warehouses[0].id,
    destinationType: "warehouse",
    destinationWarehouseId: warehouses[1].id,
    quantity: 48,
    description: "Transfer vers depot chantier nord",
  }, now);

  await ensureStockMovement(company.id, materialsByName["Fer a beton HA12 (barre 12m)"].id, siteManager.id, {
    movementType: "out",
    sourceType: "warehouse",
    sourceWarehouseId: warehouses[1].id,
    destinationType: "project",
    projectId: projects[0].id,
    quantity: 22,
    description: "Livraison chantier lot A",
  }, now);

  await ensureStockMovement(company.id, materialsByName["Fer a beton HA12 (barre 12m)"].id, adminUser.id, {
    movementType: "return",
    sourceType: "project",
    sourceWarehouseId: warehouses[1].id,
    destinationType: "warehouse",
    destinationWarehouseId: warehouses[1].id,
    projectId: projects[0].id,
    quantity: 6,
    description: "Retour chantier lot A",
  }, now);

  await ensureStockMovement(company.id, materialsByName["Panneau de coffrage"].id, adminUser.id, {
    movementType: "adjustment",
    sourceType: "adjustment",
    quantity: 12,
    description: "Ajustement inventaire",
  }, now);

  await ensureRawReservation(company.id, projects[0].id, materialsByName["Ciment CPJ45 (sac 50kg)"].id, 80, siteManager.id, now);
  await ensureRawReservation(company.id, projects[1].id, materialsByName["Fer a beton HA12 (barre 12m)"].id, 30, siteManager.id, now);

  await ensureRawCountSession(company.id, warehouses[0].id, siteManager.id, [
    {
      materialId: materialsByName["Ciment CPJ45 (sac 50kg)"].id,
      systemQty: 780,
      countedQty: 768,
    },
    {
      materialId: materialsByName["Fer a beton HA12 (barre 12m)"].id,
      systemQty: 260,
      countedQty: 264,
    },
  ], now);

  await ensureLowStockAlert(company.id, materialsByName["Fil de ligature"].id, 20, 16, now);
  await ensureLowStockAlert(company.id, materialsByName["Sable de construction"].id, 15, 14, now);

  for (const project of projects) {
    await ensureProjectExpense(
      company.id,
      project.id,
      "materiaux",
      `Consommation materiaux - ${project.name}`,
      project.status === "completed" ? 45000 : 12500,
      adminUser.id,
      now,
    );
  }

  for (const project of projects.slice(0, 2)) {
    const template = CHECKLIST_TEMPLATES[projects.indexOf(project) % CHECKLIST_TEMPLATES.length];
    await ensureChecklist(company.id, project.id, siteManager.id, template, now);
  }

  await ensureToolCalculation(
    company.id,
    projects[0].id,
    engineer.id,
    "concrete",
    { length: 12, width: 8, thickness: 0.2, concreteClass: "C25" },
    { volumeM3: 19.2, cementBags: 134, sandM3: 9.5, gravelM3: 12.3 },
    "Dalle principale",
    now,
  );

  await ensureToolCalculation(
    company.id,
    projects[1].id,
    engineer.id,
    "steel",
    { diameterMm: 12, lengthM: 12, quantity: 220 },
    { totalWeightKg: 221.7 },
    "Quantite acier villa",
    now,
  );

  await ensureNotification(company.id, adminUser.id, "project_update", "Projet en cours", `Le projet ${projects[0].name} avance normalement.`, now);
  await ensureNotification(company.id, siteManager.id, "checklist", "Checklist a completer", `La checklist du projet ${projects[1].name} est disponible.`, now);
  await ensureNotification(company.id, adminUser.id, "low_stock", "Alerte stock faible", "Le fil de ligature est sous le seuil minimum.", now);

  console.log("\n=== FULL DEMO DATA READY ===");
  console.log(`Company: ${company.name} (${company.id})`);
  console.log(`Shared password: ${SHARED_PASSWORD}`);
  console.log("Users:");
  for (const user of DEMO_USERS) {
    console.log(`  ${user.email} : ${SHARED_PASSWORD}`);
  }
  console.log(`Projects: ${projects.length}`);
  console.log(`Warehouses: ${warehouses.length}`);
  console.log(`Materials: ${MATERIALS.length}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
