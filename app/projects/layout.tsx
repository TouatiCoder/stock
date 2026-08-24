import { ProtectedLayout } from "../layout-protected";

export default function ProjectsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProtectedLayout>{children}</ProtectedLayout>;
}