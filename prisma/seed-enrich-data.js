require("dotenv").config();
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const COMPANY_COUNT = 20;

const MATERIAL_SETS = [
  { name: "Ciment CPJ45 (sac 50kg)", unit: "sac", unitPrice: 68.5, category: "Ciment", qty: 400, min: 80 },
  { name: "Fer à béton HA10 (barre 12m)", unit: "barre", unitPrice: 128.0, category: "Acier", qty: 260, min: 40 },
  { name: "Sable de construction", unit: "m3", unitPrice: 115.0, category: "Granulat", qty: 45, min: 15 },
];

const PROJECT_TYPES = ["Villa", "Commercial", "Industrial", "Other"];
const PROJECT_NAMES = [
  "Résidence Andalous", "Villa Les Palmiers", "Immeuble Al Manar", "Complexe Sahara",
  "Lotissement Riad", "Tour Atlas", "Centre Al Wifaq", "Résidence Océane",
  "Immeuble Zenith", "Villa Émeraude", "Complexe Al Karam", "Résidence Ibn Sina",
  "Immeuble Horizon", "Lotissement Al Amal", "Tour Marina", "Résidence Palmier d'Or",
  "Centre Al Baraka", "Immeuble Concorde", "Villa Belvédère", "Résidence Argana",
];

const CHECKLIST_TITLES = ["Contrôle sécurité chantier", "Inspection qualité béton", "Vérification équipement", "Suivi journalier"];
const CHECKLIST_ITEMS = [
  "Port des EPI vérifié",
  "Échafaudages contrôlés",
  "Signalisation en place",
  "Extincteurs vérifiés",
  "Zone de stockage sécurisée",
];

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function main() {
  const now = new Date();

  for (let i = 1; i <= COMPANY_COUNT; i++) {
    const admin = await prisma.user.findUnique({ where: { email: `admin${i}@buildstock-demo.ma` } });
    const chantier = await prisma.user.findUnique({ where: { email: `chantier${i}@buildstock-demo.ma` } });
    const ingenieur = await prisma.user.findUnique({ where: { email: `ingenieur${i}@buildstock-demo.ma` } });

    if (!admin || !chantier || !ingenieur) {
      console.log(`[${i}] Utilisateurs manquants, ignoré`);
      continue;
    }

    const companyId = admin.companyId;

    const supplier = await prisma.supplier.create({
      data: {
        name: `Matériaux Pro ${i}`,
        contactPerson: `Fournisseur Contact ${i}`,
        email: `contact@materiaux-pro-${i}-demo.ma`,
        phone: `+21252230${String(i).padStart(3, "0")}`,
        address: `Zone Industrielle, Lot ${i}`,
        isActive: true,
        companyId,
        updatedAt: now,
      },
    });

    const warehouse = await prisma.warehouse.create({
      data: {
        name: `Entrepôt ${i}`,
        location: `Zone Industrielle ${i}`,
        capacity: 3000,
        isMain: true,
        isActive: true,
        companyId,
        updatedAt: now,
      },
    });

    const createdMaterials = [];
    for (const m of MATERIAL_SETS) {
      const material = await prisma.material.create({
        data: {
          name: m.name,
          unit: m.unit,
          unitPrice: m.unitPrice,
          category: m.category,
          supplierId: supplier.id,
          companyId,
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
          companyId,
          updatedAt: now,
        },
      });
    }

    const budget = randInt(800, 4000) * 1000;
    const project = await prisma.project.create({
      data: {
        name: `${PROJECT_NAMES[i - 1]} - Lot ${i}`,
        description: "Projet de construction en cours",
        clientName: `Client ${PROJECT_NAMES[i - 1]}`,
        clientEmail: `client${i}@demo.ma`,
        clientPhone: `+21266${String(2000000 + i).slice(-7)}`,
        address: `Avenue des Chantiers ${i}`,
        city: "Casablanca",
        postalCode: "20000",
        projectType: PROJECT_TYPES[i % PROJECT_TYPES.length],
        status: "in_progress",
        startDate: new Date("2026-03-01"),
        endDate: new Date("2026-11-30"),
        totalBudget: budget,
        currentCost: Math.round(budget * 0.25),
        companyId,
        siteManagerId: chantier.id,
        structuralEngineerId: ingenieur.id,
        updatedAt: now,
      },
    });

    const po = await prisma.purchaseOrder.create({
      data: {
        orderNumber: `PO-${i}-0001`,
        status: "pending",
        totalAmount: createdMaterials[0].unitPrice.toNumber() * 100 + createdMaterials[1].unitPrice.toNumber() * 50,
        orderDate: new Date("2026-06-01"),
        expectedDelivery: new Date("2026-06-15"),
        supplierId: supplier.id,
        companyId,
        createdById: admin.id,
        updatedAt: now,
      },
    });

    await prisma.purchaseOrderItem.create({
      data: {
        quantity: 100,
        unitPrice: createdMaterials[0].unitPrice,
        totalPrice: createdMaterials[0].unitPrice.toNumber() * 100,
        purchaseOrderId: po.id,
        materialId: createdMaterials[0].id,
        updatedAt: now,
      },
    });
    await prisma.purchaseOrderItem.create({
      data: {
        quantity: 50,
        unitPrice: createdMaterials[1].unitPrice,
        totalPrice: createdMaterials[1].unitPrice.toNumber() * 50,
        purchaseOrderId: po.id,
        materialId: createdMaterials[1].id,
        updatedAt: now,
      },
    });

    const checklist = await prisma.checklist.create({
      data: {
        companyId,
        projectId: project.id,
        createdById: chantier.id,
        title: CHECKLIST_TITLES[i % CHECKLIST_TITLES.length],
        checklistType: "safety",
        status: "in_progress",
        updatedAt: now,
      },
    });
    for (let p = 0; p < CHECKLIST_ITEMS.length; p++) {
      await prisma.checklistItem.create({
        data: {
          checklistId: checklist.id,
          label: CHECKLIST_ITEMS[p],
          isChecked: p < 2,
          position: p,
          updatedAt: now,
        },
      });
    }

    await prisma.toolCalculation.create({
      data: {
        companyId,
        userId: ingenieur.id,
        projectId: project.id,
        toolType: "concrete",
        inputJson: { length: 10, width: 6, thickness: 0.2, concreteClass: "C25" },
        outputJson: { volumeM3: 12, cementBags: 84, sandM3: 6, gravelM3: 8 },
        notes: "Calcul dalle rez-de-chaussée",
        updatedAt: now,
      },
    });

    await prisma.projectExpense.create({
      data: {
        companyId,
        projectId: project.id,
        category: "materiaux",
        description: "Achat ciment et fer à béton",
        amount: 15000 + i * 100,
        createdBy: admin.id,
        updatedAt: now,
      },
    });

    await prisma.stockMovement.create({
      data: {
        projectId: project.id,
        materialId: createdMaterials[0].id,
        userId: chantier.id,
        movementType: "out",
        quantity: 30,
        description: "Livraison sur chantier",
        movementDate: now,
      },
    });
    await prisma.stockMovement.create({
      data: {
        projectId: null,
        materialId: createdMaterials[0].id,
        userId: admin.id,
        movementType: "in",
        quantity: 400,
        description: "Réception fournisseur",
        movementDate: now,
      },
    });

    await prisma.notification.create({
      data: {
        companyId,
        userId: admin.id,
        type: "purchase_order",
        title: "Nouvelle commande créée",
        message: `La commande ${po.orderNumber} a été créée pour ${supplier.name}.`,
        isRead: false,
        updatedAt: now,
      },
    });
    await prisma.notification.create({
      data: {
        companyId,
        userId: chantier.id,
        type: "checklist",
        title: "Checklist à compléter",
        message: `La checklist "${checklist.title}" nécessite votre attention sur le projet ${project.name}.`,
        isRead: false,
        updatedAt: now,
      },
    });

    await prisma.planPayment.create({
      data: {
        companyId,
        requestedById: admin.id,
        planCode: "pro",
        cadence: "monthly",
        amountMad: 799,
        method: "cash",
        status: "completed",
        confirmedById: admin.id,
        paidAt: now,
        updatedAt: now,
      },
    });

    console.log(`[${i}/${COMPANY_COUNT}] Données enrichies pour ${project.name}`);
  }

  console.log("\n=== ENRICHISSEMENT TERMINÉ ===");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
