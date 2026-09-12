export function hasActiveCompanyMembership(user) {
  return (user?.memberships || []).some(
    membership => membership.status === 'ACTIVE' && !membership.deletedAt && membership.company,
  );
}
