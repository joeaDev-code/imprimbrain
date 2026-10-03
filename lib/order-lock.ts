type TaggedQuery = <T = unknown>(strings: TemplateStringsArray, ...values: unknown[]) => Promise<T>;

type RawQueryExecutor = { $queryRaw: TaggedQuery };

export async function lockTenantOrder(transaction: RawQueryExecutor, orderId: string, organizationId: string) {
  const rows = await transaction.$queryRaw<{ id: string }[]>`
    SELECT "id" FROM "Order"
    WHERE "id"=${orderId}::uuid AND "organizationId"=${organizationId}::uuid
    FOR UPDATE
  `;
  return rows.length > 0;
}
