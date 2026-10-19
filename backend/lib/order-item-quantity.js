export const MAX_ORDER_ITEM_QUANTITY = 99999;

export function mergeOrderItemQuantity(currentValue, addedValue) {
  const current = Number(currentValue);
  const added = Number(addedValue);
  if (!Number.isFinite(current) || !Number.isFinite(added) || current <= 0 || added <= 0) {
    throw new RangeError('Order item quantities must be positive numbers');
  }

  const merged = Math.round((current + added) * 100) / 100;
  if (merged > MAX_ORDER_ITEM_QUANTITY) {
    throw new RangeError(`Merged quantity cannot exceed ${MAX_ORDER_ITEM_QUANTITY}`);
  }
  return merged;
}
