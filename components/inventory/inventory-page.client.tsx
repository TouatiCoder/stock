 "use client";
 
 import { useState } from "react";
 import Link from "next/link";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
import { Search, Plus, ArrowLeftRight } from "lucide-react";
 import { Card } from "@/components/ui/card";
 import { InventoryStats } from "@/components/inventory/inventory-stats";
 import { InventoryList } from "@/components/inventory/inventory-list";
 import { useInventoryTranslations, useCommonTranslations } from "@/components/LocaleProvider";
 
 export default function InventoryPageClient() {
   const [searchTerm, setSearchTerm] = useState("");
   
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
           <Link href="/stock/consumption/new">
             <Button variant="outline">
               <ArrowLeftRight className="me-2 h-4 w-4" /> {tInventory("stockTransfer")}
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
         <div className="p-4">
           <div className="relative">
             <Search size={18} className="absolute start-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
             <Input
               type="text"
               placeholder={tCommon("searchMaterialPlaceholder")}
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="ps-10"
             />
           </div>
         </div>
       </Card>
 
       <InventoryList searchTerm={searchTerm} />
     </div>
   );
 }
