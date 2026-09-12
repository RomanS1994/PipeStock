export function hasActiveCompanyMembership(user) {
  return (user?.memberships || []).some(
    membership => membership.status === 'ACTIVE' && !membership.deletedAt && membership.company,
  );
}

export async function lockUserForMembershipChange(tx, userId) {
  const rows = await tx.$queryRaw`
    SELECT "id"
    FROM "users"
    WHERE "id" = ${userId}
    FOR UPDATE
  `;
  return Boolean(rows.length);
}

export async function hasActiveCompanyMembershipInTx(tx, userId, excludeMembershipId = null) {
  const membership = await tx.companyMembership.findFirst({
    where: {
      userId,
      status: 'ACTIVE',
      deletedAt: null,
      ...(excludeMembershipId ? { id: { not: excludeMembershipId } } : {}),
    },
    select: { id: true },
  });
  return Boolean(membership);
}
