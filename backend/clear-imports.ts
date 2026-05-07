import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== 清除所有导入记录 ===');
  
  const count = await prisma.userRouteImport.count();
  console.log(`当前有 ${count} 条导入记录`);
  
  if (count > 0) {
    await prisma.userRouteImport.deleteMany();
    console.log(`已删除 ${count} 条记录`);
  }
  
  console.log('=== 清除完成 ===');
  
  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
