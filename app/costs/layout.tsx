import { ProtectedLayout } from "../layout-protected";

export default function CostsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProtectedLayout>{children}</ProtectedLayout>;
}