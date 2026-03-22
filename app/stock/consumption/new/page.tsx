import { redirect } from "next/navigation";

export default function LegacyStockConsumptionNewPage() {
  redirect("/inventory/entry/new");
}
