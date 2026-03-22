import { PublicLayout } from "../layout-public";

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PublicLayout>{children}</PublicLayout>;
}