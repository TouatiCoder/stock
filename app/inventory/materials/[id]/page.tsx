"use client"

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useCommonTranslations, useInventoryTranslations } from "@/components/LocaleProvider";
import { useParams } from "next/navigation";

export default function MaterialDetailPage() {
  const params = useParams();
  const materialId = params.id as string;

  const tInventory = useInventoryTranslations();
  const tCommon = useCommonTranslations();
  
  const [material, setMaterial] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMaterial();
  }, [materialId]);

  const fetchMaterial = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/materials/${materialId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError("Material not found");
        } else {
          setError("Failed to load material");
        }
        return;
      }

      const data = await response.json();
      setMaterial(data);
    } catch (err) {
      setError("Failed to load material");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !material) {
    return (
      <div className="space-y-6 p-6">
        <div className="mx-auto max-w-5xl">
          <div className="mb-6 flex items-center gap-4">
            <Link href="/inventory">
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {tCommon("back")}
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">
              {error === "Material not found" ? tInventory("materialNotFound") : error}
            </h1>
          </div>
        </div>
      </div>
    );
  }

  const inv = material.inventory && material.inventory.length > 0 ? material.inventory[0] : null;
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
              {tCommon("back")}
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">{material.name}</h1>
        </div>

        <Card className="p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-gray-500">{tInventory("unit")}</p>
              <p className="font-medium text-gray-900">{material.unit}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">{tInventory("category")}</p>
              <p className="font-medium text-gray-900">{material.category || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">{tInventory("supplier")}</p>
              <p className="font-medium text-gray-900">{material.supplier?.name || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">{tInventory("unitPrice")}</p>
              <p className="font-medium text-gray-900">{unitPrice == null ? "-" : `${unitPrice} MAD`}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">{tInventory("availableStock")}</p>
              <p className="font-medium text-gray-900">{currentStock}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">{tInventory("minThreshold")}</p>
              <p className="font-medium text-gray-900">{minThreshold}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">{tInventory("stockValue")}</p>
              <p className="font-medium text-gray-900">{stockValue == null ? "-" : `${stockValue} MAD`}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">{tInventory("descriptionLabel")}</p>
              <p className="font-medium text-gray-900">{material.description || "-"}</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
