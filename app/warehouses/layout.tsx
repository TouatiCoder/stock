import { ProtectedLayout } from "../layout-protected";

export default function WarehousesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProtectedLayout>{children}</ProtectedLayout>;
}