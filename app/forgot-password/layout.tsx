import { PublicLayout } from "../layout-public";

export default function ForgotPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PublicLayout>{children}</PublicLayout>;
}