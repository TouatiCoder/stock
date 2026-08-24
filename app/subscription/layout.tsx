import { ProtectedLayout } from "../layout-protected";

export default function SubscriptionLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedLayout>{children}</ProtectedLayout>;
}
