import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { checkAuth } from "@/lib/auth/auth-utils";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default async function MaterialDetailPage({ params }: { params: { id: string } }) {
  const user = await checkAuth();
  if (!user) redirect("/login");

  const material = await db.material.findFirst({
    where: {
      id: params.id,
      companyId: user.companyId,
    },
    include: {
      supplier: true,
      inventory: {
        take: 1,
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!material) {
    return (
      <div className="space-y-6 p-6">
        <div className="mx-auto max-w-5xl">
          <div className="mb-6 flex items-center gap-4">
            <Link href="/inventory">
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Materiau introuvable</h1>
          </div>
        </div>
      </div>
    );
  }

  const inv = material.inventory[0];
  const currentStock = inv?.quantity != null ? Number(inv.quantity) : 0;
  const minThreshold = inv?.minThreshold != null ? Number(inv.minThreshold) : 0;
  const unitPrice = material.unitPrice != null ? Number(material.unitPrice) : null;
  const stockValue = unitPrice != null ? unitPrice * currentStock : null;

  return (
    <div className="space-y-6 p-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center gap-4">
          <Link href="/inventory">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">{material.name}</h1>
        </div>

        <Card className="p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-gray-500">Unite</p>
              <p className="font-medium text-gray-900">{material.unit}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Categorie</p>
              <p className="font-medium text-gray-900">{material.category || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Fournisseur</p>
              <p className="font-medium text-gray-900">{material.supplier?.name || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Prix unitaire</p>
              <p className="font-medium text-gray-900">{unitPrice == null ? "-" : `${unitPrice} MAD`}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Stock disponible</p>
              <p className="font-medium text-gray-900">{currentStock}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Seuil minimum</p>
              <p className="font-medium text-gray-900">{minThreshold}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Valeur de stock</p>
              <p className="font-medium text-gray-900">{stockValue == null ? "-" : `${stockValue} MAD`}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Description</p>
              <p className="font-medium text-gray-900">{material.description || "-"}</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
