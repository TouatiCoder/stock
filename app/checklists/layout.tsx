import type React from "react"
import { ProtectedLayout } from "../layout-protected"

export default function ChecklistsLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedLayout>{children}</ProtectedLayout>
}
