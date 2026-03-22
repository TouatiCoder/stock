import { PublicLayout } from "../layout-public";

export default function ResetPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PublicLayout>{children}</PublicLayout>;
}