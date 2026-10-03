import "dotenv/config";
import { db } from "../lib/prisma";
import { hashPassword } from "../lib/password";
import { randomKey, wrapKey, blindIndex } from "../lib/security";
const email = (
  process.env.ADMIN_EMAIL || "admin@imprimbrain.local"
).toLowerCase();
const password = process.env.ADMIN_PASSWORD || "ChangeMe123!";
if (process.env.NODE_ENV === "production" && password === "ChangeMe123!")
  throw new Error("ADMIN_PASSWORD must be explicitly configured in production");
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
    update: { organizationId: org.id },
    create: {
      organizationId: org.id,
      name: "Administrateur",
      email,
      passwordHash: hashPassword(password),
      role: "ADMIN",
      emailBlindIndex: blindIndex(email, "user.email", org.id),
    },
  });
  const defs = [
    ["Impression N&B A4", "Impression", "feuille", 25],
    ["Impression couleur A4", "Impression", "feuille", 100],
    ["Impression couleur A3", "Impression", "feuille", 250],
    ["Reliure spirale", "Finition", "unité", 1000],
  ] as const;
  const services: any = {};
  for (const [name, category, unit, price] of defs) {
    let s = await db.service.findFirst({
      where: { organizationId: org.id, name },
    });
    if (!s)
      s = await db.service.create({
        data: { organizationId: org.id, name, category, unit, price },
      });
    services[name] = s;
  }
  const stocks = [
    ["Papier A4 80g", "feuille", 2500, 500, 6],
    ["Papier A3 80g", "feuille", 500, 100, 14],
    ["Encre noire", "cartouche", 6, 2, 18000],
  ] as const;
  const items: any = {};
  for (const [name, unit, quantity, minThreshold, unitCost] of stocks) {
    let s = await db.stockItem.findFirst({
      where: { organizationId: org.id, name },
    });
    if (!s)
      s = await db.stockItem.create({
        data: {
          organizationId: org.id,
          name,
          unit,
          quantity,
          minThreshold,
          unitCost,
        },
      });
    items[name] = s;
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
      update: { qtyPerUnit: qty },
      create: {
        serviceId: services[serviceName].id,
        stockItemId: items[itemName].id,
        qtyPerUnit: qty,
      },
    });
  }
  console.log(`Imprim'Brain prêt. Admin: ${email}`);
}
main().finally(() => db.$disconnect());
