import { ProtectedLayout } from "../../layout-protected";

export default function StockConsumptionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProtectedLayout>{children}</ProtectedLayout>;
}
