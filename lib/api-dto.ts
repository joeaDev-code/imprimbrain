export function expenseDto(row: any) {
  return {
    id: row.id,
    label: row.label,
    category: row.category,
    amount: Number(row.amount),
    spentAt: row.spentAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
  };
}

export function serviceDto(row: any) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    unit: row.unit,
    price: Number(row.price),
    active: row.active,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function stockItemDto(row: any) {
  return {
    id: row.id,
    name: row.name,
    barcode: row.barcode,
    unit: row.unit,
    quantity: Number(row.quantity),
    minThreshold: Number(row.minThreshold),
    unitCost: Number(row.unitCost),
    packageUnit: row.packageUnit,
    packageQuantity: row.packageQuantity == null ? null : Number(row.packageQuantity),
    active: row.active,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
