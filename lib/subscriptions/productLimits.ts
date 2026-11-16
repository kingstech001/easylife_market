export const PLAN_PRODUCT_LIMIT: Record<string, number | null> = {
  free: 20,
  basic: 20,
  standard: 50,
  premium: null,
};

// Older Free and Basic stores may still have the previous limit saved.
export function resolveProductLimit(
  plan: string = "free",
  savedLimit?: number | null,
): number | null {
  if (plan === "free" || plan === "basic") return PLAN_PRODUCT_LIMIT[plan];
  return savedLimit === undefined
    ? (plan in PLAN_PRODUCT_LIMIT ? PLAN_PRODUCT_LIMIT[plan] : PLAN_PRODUCT_LIMIT.free)
    : savedLimit;
}
