import { PublicLayout } from "../layout-public";

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PublicLayout>{children}</PublicLayout>;
}