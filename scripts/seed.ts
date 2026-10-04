import "dotenv/config";
import { db } from "../lib/prisma";
import { hashPassword } from "../lib/password";
import { randomKey, wrapKey, blindIndex } from "../lib/security";

const email = (
  process.env.SUPER_ADMIN_EMAIL ||
  process.env.ADMIN_EMAIL ||
  "admin@imprimbrain.local"
).trim().toLowerCase();

const password =
  process.env.SUPER_ADMIN_PASSWORD ||
  process.env.ADMIN_PASSWORD ||
  "ChangeMe123!";

const name =
  process.env.SUPER_ADMIN_NAME ||
  "Jason Kouassi";

if (
  process.env.NODE_ENV === "production" &&
  password === "ChangeMe123!"
) {
  throw new Error(
    "SUPER_ADMIN_PASSWORD must be explicitly configured in production",
  );
}

async function main() {
  const org = await db.organization.upsert({
    where: { slug: "imprimbrain-demo" },
    update: {},
    create: {
      name: "Imprimerie Démo",
      slug: "imprimbrain-demo",
      wrappedDataKey: wrapKey(randomKey()),
    },
  });

  await db.user.upsert({
    where: { email },
    update: {
      name,
      passwordHash: hashPassword(password),
      role: "SUPER_ADMIN",
      organizationId: org.id,
      emailBlindIndex: blindIndex(
        email,
        "user.email",
        org.id,
      ),
    },
    create: {
      organizationId: org.id,
      name,
      email,
      passwordHash: hashPassword(password),
      role: "SUPER_ADMIN",
      emailBlindIndex: blindIndex(
        email,
        "user.email",
        org.id,
      ),
    },
  });

  const defs = [
    ["Impression N&B A4", "Impression", "feuille", 25],
    ["Impression couleur A4", "Impression", "feuille", 100],
    ["Impression couleur A3", "Impression", "feuille", 250],
    ["Reliure spirale", "Finition", "unité", 1000],
  ] as const;

  const services: Record<string, { id: string }> = {};

  for (const [serviceName, category, unit, price] of defs) {
    let service = await db.service.findFirst({
      where: {
        organizationId: org.id,
        name: serviceName,
      },
    });

    if (!service) {
      service = await db.service.create({
        data: {
          organizationId: org.id,
          name: serviceName,
          category,
          unit,
          price,
        },
      });
    }

    services[serviceName] = service;
  }

  const stocks = [
    ["Papier A4 80g", "feuille", 2500, 500, 6],
    ["Papier A3 80g", "feuille", 500, 100, 14],
    ["Encre noire", "cartouche", 6, 2, 18000],
  ] as const;

  const items: Record<string, { id: string }> = {};

  for (const [
    itemName,
    unit,
    quantity,
    minThreshold,
    unitCost,
  ] of stocks) {
    let stockItem = await db.stockItem.findFirst({
      where: {
        organizationId: org.id,
        name: itemName,
      },
    });

    if (!stockItem) {
      stockItem = await db.stockItem.create({
        data: {
          organizationId: org.id,
          name: itemName,
          unit,
          quantity,
          minThreshold,
          unitCost,
        },
      });
    }

    items[itemName] = stockItem;
  }

  for (const [serviceName, itemName, qty] of [
    ["Impression N&B A4", "Papier A4 80g", 1],
    ["Impression couleur A4", "Papier A4 80g", 1],
    ["Impression couleur A3", "Papier A3 80g", 1],
  ] as const) {
    await db.consumptionRule.upsert({
      where: {
        serviceId_stockItemId: {
          serviceId: services[serviceName].id,
          stockItemId: items[itemName].id,
        },
      },
      update: {
        qtyPerUnit: qty,
      },
      create: {
        serviceId: services[serviceName].id,
        stockItemId: items[itemName].id,
        qtyPerUnit: qty,
      },
    });
  }

  console.log(
    `Imprim'Brain prêt. Super Admin: ${name} (${email})`,
  );
}

main()
  .catch((error) => {
    console.error("Seed échoué:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
