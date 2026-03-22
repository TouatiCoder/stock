 "use client";
 
 import { useState } from "react";
 import Link from "next/link";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Search, Plus } from "lucide-react";
 import { Card } from "@/components/ui/card";
 import { InventoryStats } from "@/components/inventory/inventory-stats";
 import { InventoryList } from "@/components/inventory/inventory-list";
 import { useInventoryTranslations, useCommonTranslations } from "@/components/LocaleProvider";
 
 export default function InventoryPageClient() {
   const [searchTerm, setSearchTerm] = useState("");
   const [filterCategory, setFilterCategory] = useState<string>("all");
   
   const tInventory = useInventoryTranslations();
   const tCommon = useCommonTranslations();
 
   return (
     <div className="p-6 space-y-6">
       <div className="flex justify-between items-center">
         <h1 className="text-3xl font-bold">{tInventory("title")}</h1>
         <div className="flex gap-2">
           <Link href="/inventory/entry/new">
             <Button variant="outline">
               <Plus className="me-2 h-4 w-4" /> {tInventory("stockEntry")}
             </Button>
           </Link>
           <Link href="/inventory/materials/new">
             <Button>
               <Plus className="me-2 h-4 w-4" /> {tInventory("newMaterial")}
             </Button>
           </Link>
         </div>
       </div>
 
      <InventoryStats />

      <Card>
         <div className="p-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
           <div className="relative flex-1">
             <Search size={18} className="absolute start-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
             <Input
               type="text"
               placeholder={tCommon("searchMaterialPlaceholder")}
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="ps-10"
             />
           </div>
           <select
             value={filterCategory}
             onChange={(e) => setFilterCategory(e.target.value)}
             className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white"
           >
             <option value="all">{tInventory("all")}</option>
             <option value="cement">{tInventory("cement")}</option>
             <option value="steel">{tInventory("steel")}</option>
             <option value="wood">{tInventory("wood")}</option>
             <option value="other">{tInventory("other")}</option>
           </select>
         </div>
       </Card>
 
       <InventoryList searchTerm={searchTerm} filterCategory={filterCategory} />
     </div>
   );
 }
