// app/warehouses/page.tsx
import { db } from "@/lib/db";
import { checkAuth } from "@/lib/auth/auth-utils";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Warehouse, Plus } from "lucide-react";
import Link from "next/link";
import { t } from "@/lib/server-i18n";
import { WarehouseActions } from "@/components/warehouses/warehouse-actions";

export default async function WarehousesPage() {
  const user = await checkAuth();
  if (!user) redirect("/login");

  const warehouses = await db.warehouse.findMany({
    where: { 
      companyId: user.companyId,
    },
    orderBy: { name: 'asc' }
  });
  
  // Pre-fetch all translations
  const title = await t('warehouse', 'title');
  const manageStorageLocations = await t('warehouse', 'manageStorageLocations');
  const newWarehouse = await t('warehouse', 'newWarehouse');
  const totalText = await t('warehouse', 'total');
  const mainText = await t('warehouse', 'main');
  const nameText = await t('common', 'name');
  const locationText = await t('warehouse', 'location');
  const capacityText = await t('warehouse', 'capacity');
  const statusText = await t('common', 'status');
  const actionsText = await t('common', 'actions');
  const noResultsText = await t('common', 'noResults');
  const startByCreatingFirst = await t('warehouse', 'startByCreatingFirst');
  const createFirst = await t('warehouse', 'createFirst');
  const activeText = await t('common', 'active');
  const inactiveText = await t('common', 'inactive');
  const notSpecifiedText = await t('common', 'notSpecified');

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          <p className="text-gray-600">{manageStorageLocations}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/warehouses/new">
            <Button className="flex items-center gap-2">
              <Plus size={18} />
              {newWarehouse}
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Warehouse className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">{totalText}</p>
              <p className="text-2xl font-bold">{warehouses.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Warehouse className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">{mainText}</p>
              <p className="text-lg font-semibold">
                {warehouses.find(w => w.isMain)?.name || notSpecifiedText}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{nameText}</TableHead>
                <TableHead>{locationText}</TableHead>
                <TableHead>{capacityText}</TableHead>
                <TableHead>{statusText}</TableHead>
                <TableHead>{actionsText}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {warehouses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <div className="text-center py-8">
                      <Warehouse className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">{noResultsText}</p>
                      <p className="text-sm text-gray-400 mt-2">
                        {startByCreatingFirst}
                      </p>
                      <Link href="/warehouses/new">
                        <Button className="mt-4">{createFirst}</Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                warehouses.map((warehouse) => {
                  const statusText = warehouse.isActive ? activeText : inactiveText;
                  return (
                    <TableRow key={warehouse.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Warehouse size={16} className="text-gray-400" />
                          {warehouse.name}
                        </div>
                      </TableCell>
                      <TableCell>{warehouse.location || notSpecifiedText}</TableCell>
                      <TableCell>{warehouse.capacity ? `${warehouse.capacity}` : notSpecifiedText}</TableCell>
                      <TableCell>
                        <Badge className={warehouse.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                          {statusText}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <WarehouseActions warehouseId={warehouse.id} />
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
