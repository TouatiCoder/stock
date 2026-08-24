import { ProtectedLayout } from "../layout-protected";

export default function InventoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProtectedLayout>{children}</ProtectedLayout>;
}