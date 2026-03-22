import { PublicLayout } from "../layout-public";

export default function InviteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PublicLayout>{children}</PublicLayout>;
}