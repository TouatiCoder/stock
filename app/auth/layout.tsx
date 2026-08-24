import { PublicLayout } from "../layout-public";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PublicLayout>{children}</PublicLayout>;
}