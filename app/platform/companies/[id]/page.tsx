import PlatformCompanyDetailClient from "./page.client";

/**
 * Company detail for the super admin. Access is already enforced by
 * app/platform/layout.tsx (redirects anyone who is not a platform admin) and by
 * requirePlatformAdmin on the API route this page reads from.
 */
export default function PlatformCompanyDetailPage({ params }: { params: { id: string } }) {
  return <PlatformCompanyDetailClient companyId={params.id} />;
}
