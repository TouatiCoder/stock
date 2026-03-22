import { redirect } from "next/navigation";

export default function MaterialEditFallbackPage({ params }: { params: { id: string } }) {
  redirect(`/inventory/materials/${params.id}`);
}
