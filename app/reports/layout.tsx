import { ProtectedLayout } from "../layout-protected"
import type { ReactNode } from "react"

export default function ReportsLayout({ children }: { children: ReactNode }) {
  return <ProtectedLayout>{children}</ProtectedLayout>
}
