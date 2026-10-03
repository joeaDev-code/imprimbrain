import { db } from "./prisma";
import { decrypt, encrypt, blindIndex, randomKey, unwrapKey } from "./security";

export async function organizationKey(orgId: string) {
  const org = await db.organization.findUnique({ where: { id: orgId }, select: { wrappedDataKey: true } });
  if (!org) throw new Error("ORGANIZATION_NOT_FOUND"); return unwrapKey(org.wrappedDataKey);
}
export function toClient(orgId: string, key: Buffer, row: any) {
  return { id: row.id, name: row.name, phone: decrypt(row.phoneEncrypted,key), whatsapp: decrypt(row.whatsappEncrypted,key), email: decrypt(row.emailEncrypted,key), city: decrypt(row.cityEncrypted,key), notes: decrypt(row.notesEncrypted,key), createdAt: row.createdAt };
}
export async function createOrganization(name: string, slug: string) {
  return db.organization.create({ data: { name, slug, wrappedDataKey: (await import("./security")).wrapKey(randomKey()) } });
}
export async function writeAudit(userId: string | null, orgId: string | null, action: string, entity?: string, entityId?: string, metadata?: unknown) {
  await db.auditLog.create({ data: { userId, organizationId: orgId, action, entity, entityId, metadata: metadata as any } });
}
export function clientEncrypted(orgId: string, key: Buffer, data: any) {
  return {
    name: String(data.name).trim(),
    phoneEncrypted: encrypt(data.phone,key), phoneBlindIndex: blindIndex(data.phone,"client.phone",orgId),
    whatsappEncrypted: encrypt(data.whatsapp,key), whatsappBlindIndex: blindIndex(data.whatsapp,"client.whatsapp",orgId),
    emailEncrypted: encrypt(data.email,key), emailBlindIndex: blindIndex(data.email,"client.email",orgId),
    cityEncrypted: encrypt(data.city,key), notesEncrypted: encrypt(data.notes,key)
  };
}
