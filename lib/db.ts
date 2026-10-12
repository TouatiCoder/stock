import { PrismaClient } from "@prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
}

const prismaClientSingleton = () => {
  const client = new PrismaClient();
  
  // ✅ Middleware لإصلاح مشكلة التواريخ في MySQL القديم
  // هذا الكود يملأ حقل updatedAt تلقائياً قبل أي عملية حفظ
  client.$use(async (params, next) => {
    // StockMovement has no updatedAt field in prisma/schema.prisma.
    // Do not inject unknown data into stock movement create/update calls.
    if (params.model === 'StockMovement') {
      return next(params);
    }

    const now = new Date();
    
    // عند الإنشاء (Create)
    if (params.action === 'create' || params.action === 'createMany') {
      if (params.args.data) {
        if (Array.isArray(params.args.data)) {
           params.args.data.forEach((d: any) => d.updatedAt = now);
        } else {
           (params.args.data as any).updatedAt = now;
        }
      }
    }
    
    // عند التحديث (Update)
    if (params.action === 'update' || params.action === 'updateMany') {
      if (params.args.data) {
         (params.args.data as any).updatedAt = now;
      }
    }
    
    return next(params);
  });

  return client;
};

export const db = globalThis.prisma || prismaClientSingleton();

if (process.env.NODE_ENV !== "production") globalThis.prisma = db;