import { ProtectedLayout } from "../layout-protected";

export default function BillingLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedLayout>{children}</ProtectedLayout>;
}
