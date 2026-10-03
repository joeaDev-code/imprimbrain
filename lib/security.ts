import crypto from "node:crypto";
import { cookies } from "next/headers";
import { db } from "./prisma";
import type { Permission } from "@/generated/prisma/client";
import { can, effectivePermissions } from "./permissions-policy";
import { permissions } from "./permissions";
import { isCTRole } from "./ct-access";

export { can } from "./permissions-policy";

const COOKIE = process.env.SESSION_COOKIE_NAME || "imprimbrain_session";
const SESSION_HOURS = 12;
const MASTER = process.env.MASTER_ENCRYPTION_KEY || "";
const BLIND_MASTER = process.env.BLIND_INDEX_MASTER_KEY || "";

function masterKey() {
  if (!/^[0-9a-fA-F]{64}$/.test(MASTER)) throw new Error("MASTER_ENCRYPTION_KEY must be 64 hexadecimal characters");
  return Buffer.from(MASTER, "hex");
}

export function randomKey() { return crypto.randomBytes(32); }
export function wrapKey(key: Buffer) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", masterKey(), iv);
  const encrypted = Buffer.concat([cipher.update(key), cipher.final()]);
  return [iv, cipher.getAuthTag(), encrypted].map((b) => b.toString("base64url")).join(".");
}
export function unwrapKey(value: string) {
  const [ivS, tagS, dataS] = value.split(".");
  if (!ivS || !tagS || !dataS) throw new Error("Invalid wrapped key");
  const decipher = crypto.createDecipheriv("aes-256-gcm", masterKey(), Buffer.from(ivS, "base64url"));
  decipher.setAuthTag(Buffer.from(tagS, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(dataS, "base64url")), decipher.final()]);
}
export function encrypt(value: string | null | undefined, key: Buffer) {
  if (value == null || value === "") return null;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const data = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), data].map((b) => b.toString("base64url")).join(".");
}
export function decrypt(value: string | null | undefined, key: Buffer) {
  if (!value) return null;
  const [ivS, tagS, dataS] = value.split(".");
  if (!ivS || !tagS || !dataS) throw new Error("Invalid encrypted value");
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(ivS, "base64url"));
  decipher.setAuthTag(Buffer.from(tagS, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(dataS, "base64url")), decipher.final()]).toString("utf8");
}
export function blindIndex(value: string | null | undefined, purpose: string, tenantId: string) {
  if (!value) return null;
  if (!/^[0-9a-fA-F]{64}$/.test(BLIND_MASTER)) throw new Error("BLIND_INDEX_MASTER_KEY must be 64 hexadecimal characters");
  const normalized = normalizeForPurpose(value, purpose);
  const key = Buffer.from(crypto.hkdfSync("sha256", Buffer.from(BLIND_MASTER, "hex"), Buffer.from(tenantId), Buffer.from(`blind-index:${purpose}`), 32));
  return crypto.createHmac("sha256", key).update(normalized, "utf8").digest("hex");
}
export function normalizeForPurpose(value: string, purpose: string) {
  const v = value.trim().toLowerCase();
  if (purpose.includes("phone") || purpose.includes("whatsapp")) return v.replace(/[^0-9+]/g, "");
  if (purpose.includes("email")) return v.replace(/\s+/g, "");
  return v.normalize("NFKC").replace(/\s+/g, " ");
}
export function hashToken(value: string) { return crypto.createHash("sha256").update(value).digest("hex"); }
export function normalizeSearch(value: string) { return value.trim().toLowerCase(); }

export async function createSession(userId: string) {
  const raw = crypto.randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * SESSION_HOURS);
  await db.session.deleteMany({ where: { userId } });
  await db.session.create({ data: { userId, tokenHash: hashToken(raw), expiresAt } });
  const jar = await cookies();
  jar.set(COOKIE, raw, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * SESSION_HOURS });
}

export async function destroySession() {
  const jar = await cookies();
  const raw = jar.get(COOKIE)?.value;
  if (raw) await db.session.deleteMany({ where: { tokenHash: hashToken(raw) } });
  jar.delete(COOKIE);
}

export async function currentUser() {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return null;
  const session = await db.session.findFirst({
    where: { tokenHash: hashToken(raw), expiresAt: { gt: new Date() } },
    include: { user: { include: { permissions: true } } },
  });
  if (!session?.user.active) return null;
  return session.user;
}

export async function requireUser() {
  const user = await currentUser();
  if (!user) throw new Error("UNAUTHORIZED");
  return user;
}

export async function requireOrgUser(permission?: Permission) {
  const user = await requireUser();
  if (!user.organizationId) throw new Error("NO_ORGANIZATION");
  if (permission && !can(user, permission)) throw new Error("FORBIDDEN");
  return user;
}

export async function requireCTUser() {
  const user = await requireUser();
  if (!isCTRole(user.role)) throw new Error(user.role === 'SUPER_ADMIN' ? 'SUPER_ADMIN_ONLY' : 'CT_ROLE_REQUIRED');
  if (!user.organizationId) throw new Error('NO_ORGANIZATION');
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    organizationId: user.organizationId,
    permissions: effectivePermissions(user, permissions),
  };
}

export async function requireCTPermission(permission: Permission) {
  const user = await requireCTUser();
  if (!user.permissions.includes(permission)) throw new Error('FORBIDDEN');
  return user;
}

export async function requireSuperAdmin() {
  const user = await requireUser();
  if (user.role !== 'SUPER_ADMIN') throw new Error('SUPER_ADMIN_ONLY');
  return user;
}
