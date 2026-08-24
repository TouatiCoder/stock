export function canBypassSubscriptionAccessGate(input: { isPlatformAdmin?: boolean | null }): boolean {
  return Boolean(input.isPlatformAdmin);
}

export function canManagePlatformAccessSettings(input: { isPlatformAdmin?: boolean | null }): boolean {
  return Boolean(input.isPlatformAdmin);
}