require("dotenv").config();
const { PrismaClient, Prisma } = require("@prisma/client");

const prisma = new PrismaClient();
const DEMO_EMAIL = "fake.admin@livreee-demo.ma";

async function safeExecute(sql) {
  try {
    await prisma.$executeRaw(sql);
  } catch (error) {
    if (error?.code === "P2010" && String(error?.meta?.message || "").includes("doesn't exist")) {
      return;
    }
    throw error;
  }
}

async function safeExecuteRawString(query) {
  try {
    await prisma.$executeRawUnsafe(query);
  } catch (error) {
    if (error?.code === "P2010" && String(error?.meta?.message || "").includes("doesn't exist")) {
      return;
    }
    throw error;
  }
}

async function main() {
  const demoUser = await prisma.user.findUnique({
    where: { email: DEMO_EMAIL },
    include: { company: true },
  });

  if (!demoUser?.company) {
    console.log("No demo company found. Running full demo seed directly...");
    require("./seed-full-demo.js");
    return;
  }

  const companyId = demoUser.companyId;
  const companyName = demoUser.company.name;
  const userIds = await prisma.user.findMany({
    where: { companyId },
    select: { id: true },
  }).then((rows) => rows.map((row) => row.id));

  console.log(`Resetting demo company ${companyName} (${companyId})...`);

  await prisma.$transaction(async (tx) => {
    const userIdList = userIds.length > 0 ? `'${userIds.join("','")}'` : "''";

    const deletes = [
      `DELETE FROM stock_count_items WHERE session_id IN (SELECT id FROM stock_count_sessions WHERE company_id = '${companyId}')`,
      `DELETE FROM stock_count_sessions WHERE company_id = '${companyId}'`,
      `DELETE FROM stock_reservations WHERE company_id = '${companyId}'`,
      `DELETE FROM low_stock_alerts WHERE company_id = '${companyId}'`,
      `DELETE FROM stock_adjustments WHERE company_id = '${companyId}'`,
      `DELETE FROM stock_movements WHERE material_id IN (SELECT id FROM materials WHERE company_id = '${companyId}')`,
      `DELETE FROM purchase_order_items WHERE purchase_order_id IN (SELECT id FROM purchase_orders WHERE company_id = '${companyId}')`,
      `DELETE FROM purchase_orders WHERE company_id = '${companyId}'`,
      `DELETE FROM project_expenses WHERE company_id = '${companyId}'`,
      `DELETE FROM checklist_items WHERE checklist_id IN (SELECT id FROM checklists WHERE company_id = '${companyId}')`,
      `DELETE FROM checklists WHERE company_id = '${companyId}'`,
      `DELETE FROM tool_calculations WHERE company_id = '${companyId}'`,
      `DELETE FROM notifications WHERE company_id = '${companyId}'`,
      `DELETE FROM invitations WHERE company_id = '${companyId}'`,
      `DELETE FROM platform_payments WHERE company_id = '${companyId}'`,
      `DELETE FROM billing_checkout_sessions WHERE company_id = '${companyId}'`,
      `DELETE FROM billing_job_runs WHERE company_id = '${companyId}'`,
      `DELETE FROM billing_subscriptions_external WHERE company_id = '${companyId}'`,
      `DELETE FROM billing_accounts WHERE company_id = '${companyId}'`,
      `DELETE FROM platform_subscriptions WHERE company_id = '${companyId}'`,
      `DELETE FROM plan_payments WHERE company_id = '${companyId}'`,
      `DELETE FROM platform_company_status_events WHERE company_id = '${companyId}' OR actor_user_id IN (${userIdList})`,
      `DELETE FROM webauthn_credentials WHERE user_id IN (${userIdList})`,
      `DELETE FROM webauthn_challenges WHERE user_id IN (${userIdList})`,
      `DELETE FROM users WHERE company_id = '${companyId}'`,
      `DELETE FROM inventory WHERE company_id = '${companyId}'`,
      `DELETE FROM materials WHERE company_id = '${companyId}'`,
      `DELETE FROM suppliers WHERE company_id = '${companyId}'`,
      `DELETE FROM warehouses WHERE company_id = '${companyId}'`,
      `DELETE FROM projects WHERE company_id = '${companyId}'`,
      `DELETE FROM companies WHERE id = '${companyId}'`,
    ];

    for (const query of deletes) {
      try {
        await tx.$executeRawUnsafe(query);
      } catch (error) {
        if (error?.code === "P2010" && String(error?.meta?.message || "").includes("doesn't exist")) {
          continue;
        }
        throw error;
      }
    }
  });

  console.log("Demo company removed. Reseeding now...");
  require("./seed-full-demo.js");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
