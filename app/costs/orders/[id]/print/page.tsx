"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Printer } from "lucide-react";
import { getOrderById } from "@/app/actions/order-actions";
import { PrintLayout } from "@/components/print/print-layout";
import { useCostsTranslations, useLocale } from "@/components/LocaleProvider";
import { Button } from "@/components/ui/button";
import { formatQuantityWithUnit } from "@/lib/utils/units";

interface OrderItem {
  id: string;
  materialId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes: string | null;
  material: {
    id: string;
    name: string;
    sku?: string | null;
    unit?: string | null;
    unitOfMeasure?: string | null;
    category: string | null;
  };
}

interface PurchaseOrder {
  id: string;
  orderNumber: string;
  supplierId: string;
  status: string;
  totalAmount: number | null;
  orderDate: Date | null;
  expectedDelivery: Date | null;
  companyId: string;
  createdAt: Date;
  supplier: {
    id: string;
    name: string;
    contactPerson: string | null;
    email: string | null;
    phone: string | null;
  };
  project: {
    id: string;
    name: string;
    clientName: string | null;
  } | null;
  createdBy: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  } | null;
  items?: OrderItem[];
}

export default function OrderPrintPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tCosts = useCostsTranslations();
  const { locale } = useLocale();
  const [order, setOrder] = useState<PurchaseOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const didAutoPrint = useRef(false);

  const orderId = params.id as string;

  useEffect(() => {
    const loadOrder = async () => {
      try {
        setLoading(true);
        const result = await getOrderById(orderId);
        if (result.success && result.data) {
          setOrder(result.data as PurchaseOrder);
        }
      } catch (error) {
        console.error("Error loading order for print:", error);
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, [orderId]);

  const printDocument = useCallback(() => {
    const originalTitle = document.title;
    let restored = false;

    document.title = " ";

    const restoreTitle = () => {
      if (restored) return;
      restored = true;
      document.title = originalTitle;
      window.removeEventListener("afterprint", restoreTitle);
    };

    window.addEventListener("afterprint", restoreTitle, { once: true });
    window.print();
    window.setTimeout(restoreTitle, 1000);
  }, []);

  const handlePrint = () => {
    printDocument();
  };

  useEffect(() => {
    if (loading || !order || didAutoPrint.current) return;

    const shouldAutoPrint = searchParams.get("print") === "1" || searchParams.get("autoprint") === "1";
    if (!shouldAutoPrint) return;

    didAutoPrint.current = true;
    const timer = window.setTimeout(printDocument, 250);
    return () => window.clearTimeout(timer);
  }, [loading, order, printDocument, searchParams]);

  const currencyLocale = locale === "ar" ? "ar-MA" : locale === "en" ? "en-US" : "fr-MA";
  const dateLocale = locale === "ar" ? "ar" : locale === "en" ? "en-US" : "fr-FR";

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return "-";

    return new Intl.NumberFormat(currencyLocale, {
      style: "currency",
      currency: "MAD",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "-";

    return new Date(date).toLocaleDateString(dateLocale, {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatDateTime = (date: Date) =>
    new Date(date).toLocaleString(dateLocale, {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      draft: tCosts("statusDraft"),
      pending: tCosts("statusPending"),
      approved: tCosts("statusApproved"),
      sent: tCosts("statusSent"),
      received: tCosts("statusReceived"),
      cancelled: tCosts("statusCancelled"),
    };

    return statusMap[status] || status;
  };

  useEffect(() => {
    if (!order) return;
    document.title = `${tCosts("purchaseOrderTitle")} - ${order.orderNumber}`;
  }, [order, tCosts]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <p className="text-sm text-gray-500">{tCosts("loading")}</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <p className="text-sm text-gray-500">{tCosts("orderNotFound")}</p>
      </div>
    );
  }

  return (
    <PrintLayout
      title={tCosts("purchaseOrderTitle")}
      companyName={order.createdBy?.firstName ? `${order.createdBy.firstName} ${order.createdBy.lastName}` : undefined}
      reference={order.orderNumber}
      date={order.orderDate || order.createdAt}
      referenceLabel={tCosts("reference")}
      dateLabel={tCosts("date")}
      footerText={tCosts("generatedByBuildStock").replace("{date}", formatDateTime(new Date()))}
      dateLocale={dateLocale}
    >
      <div className="mb-6 print:hidden">
        <Button
          onClick={() => router.push(`/costs/orders/${orderId}`)}
          variant="outline"
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          {tCosts("back")}
        </Button>
        <Button
          onClick={handlePrint}
          variant="outline"
          className="ml-2 flex items-center gap-2"
        >
          <Printer className="h-4 w-4" />
          {tCosts("print")}
        </Button>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-6">
        <div>
          <h3 className="mb-2 text-sm font-semibold text-gray-700">{tCosts("supplier")}</h3>
          <div className="space-y-1 text-sm">
            <p className="font-medium text-gray-900">{order.supplier.name}</p>
            {order.supplier.contactPerson && (
              <p className="text-gray-600">
                {tCosts("contact")}: {order.supplier.contactPerson}
              </p>
            )}
            {order.supplier.email && (
              <p className="text-gray-600">
                {tCosts("email")}: {order.supplier.email}
              </p>
            )}
            {order.supplier.phone && (
              <p className="text-gray-600">
                {tCosts("phone")}: {order.supplier.phone}
              </p>
            )}
          </div>
        </div>

        <div>
          <h3 className="mb-2 text-sm font-semibold text-gray-700">{tCosts("orderDetails")}</h3>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">{tCosts("number")}:</span>
              <span className="font-medium">{order.orderNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">{tCosts("date")}:</span>
              <span className="font-medium">{formatDate(order.orderDate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">{tCosts("status")}:</span>
              <span className="font-medium">{getStatusLabel(order.status)}</span>
            </div>
            {order.project && (
              <div className="flex justify-between">
                <span className="text-gray-600">{tCosts("project")}:</span>
                <span className="font-medium">{order.project.name}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h3 className="mb-4 text-base font-semibold text-gray-900">{tCosts("orderedItems")}</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full border">
            <thead>
              <tr className="bg-gray-50">
                <th className="border px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700">
                  {tCosts("no")}
                </th>
                <th className="border px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700">
                  {tCosts("designation")}
                </th>
                <th className="border px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700">
                  {tCosts("reference")}
                </th>
                <th className="border px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-700">
                  {tCosts("quantity")}
                </th>
                <th className="border px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-700">
                  {tCosts("unitPrice")}
                </th>
                <th className="border px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-700">
                  {tCosts("amountExclTax")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {order.items?.map((item, index) => (
                <tr key={item.id}>
                  <td className="border px-4 py-3 text-sm text-gray-900">{index + 1}</td>
                  <td className="border px-4 py-3 text-sm text-gray-900">{item.material.name}</td>
                  <td className="border px-4 py-3 text-sm text-gray-600">{item.material.sku || order.orderNumber}</td>
                  <td className="border px-4 py-3 text-center text-sm text-gray-900">
                    {formatQuantityWithUnit(item.quantity, item.material.unitOfMeasure || item.material.unit, locale)}
                  </td>
                  <td className="border px-4 py-3 text-right text-sm text-gray-900">
                    {formatCurrency(item.unitPrice)}
                  </td>
                  <td className="border px-4 py-3 text-right text-sm font-medium text-gray-900">
                    {formatCurrency(item.totalPrice)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mb-8 flex justify-end">
        <div className="w-80">
          <div className="space-y-2">
            <div className="flex justify-between bg-gray-50 px-4 py-2">
              <span className="text-sm font-medium text-gray-700">{tCosts("totalExclTax")}:</span>
              <span className="text-sm font-semibold text-gray-900">
                {formatCurrency(order.totalAmount)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 border-t border-gray-300 pt-6 text-sm text-gray-600">
        <p className="mb-2">
          <strong>{tCosts("paymentTerms")}:</strong> {tCosts("toBeSpecified")}
        </p>
        <p>
          <strong>{tCosts("expectedDeliveryDate")}:</strong> {formatDate(order.expectedDelivery)}
        </p>
      </div>
    </PrintLayout>
  );
}
