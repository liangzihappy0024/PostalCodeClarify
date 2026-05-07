import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== 恢复文件名 ===');
  
  const imports = await prisma.userRouteImport.findMany();
  
  let restoredCount = 0;
  
  for (const record of imports) {
    console.log(`\n记录 ID: ${record.id}`);
    console.log(`当前文件名: "${record.fileName}"`);
    
    // 将错误转换的UTF-8转回Latin1恢复原始数据
    const restoredFileName = Buffer.from(record.fileName, 'utf8').toString('latin1');
    console.log(`恢复后: "${restoredFileName}"`);
    
    await prisma.userRouteImport.update({
      where: { id: record.id },
      data: { fileName: restoredFileName }
    });
    
    restoredCount++;
  }
  
  console.log(`\n=== 恢复完成 ===`);
  console.log(`成功恢复 ${restoredCount} 条记录`);
  
  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
