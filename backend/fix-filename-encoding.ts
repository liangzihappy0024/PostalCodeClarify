import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== 修复中文文件名乱码 ===');
  
  const imports = await prisma.userRouteImport.findMany();
  
  console.log(`共找到 ${imports.length} 条记录`);
  
  let fixedCount = 0;
  
  for (const record of imports) {
    console.log(`\n记录 ID: ${record.id}`);
    console.log(`当前文件名: "${record.fileName}"`);
    
    // 正确的修复方法：
    // 1. 当前数据库中的乱码是因为 Multer 把 UTF-8 字节当成 Latin1 解码
    // 2. 需要把乱码字符串重新编码为 UTF-8 字节，然后用 Latin1 解码来恢复
    
    try {
      // 把乱码字符串编码为 UTF-8 字节，然后用 Latin1 解码
      const fixedFileName = Buffer.from(record.fileName, 'utf8').toString('latin1');
      console.log(`修复后: "${fixedFileName}"`);
      
      await prisma.userRouteImport.update({
        where: { id: record.id },
        data: { fileName: fixedFileName }
      });
      
      fixedCount++;
    } catch (e) {
      console.log(`修复失败: ${e}`);
    }
  }
  
  console.log(`\n=== 修复完成 ===`);
  console.log(`成功修复 ${fixedCount} 条记录`);
  
  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
