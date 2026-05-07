import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== 查询 5/7/2026, 10:03:08 AM 附近的测试记录 ===');
  
  const targetDate = new Date('2026-05-07T10:03:08');
  console.log('目标时间:', targetDate.toISOString());
  
  const records = await prisma.userRouteImport.findMany({
    where: {
      createdAt: {
        gte: new Date(targetDate.getTime() - 30 * 60 * 1000),
        lte: new Date(targetDate.getTime() + 30 * 60 * 1000)
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
  
  console.log(`\n找到 ${records.length} 条记录:`);
  
  for (const record of records) {
    console.log('\n--- 记录详情 ---');
    console.log(`ID: ${record.id}`);
    console.log(`文件名: ${record.fileName}`);
    console.log(`状态: ${record.status}`);
    console.log(`创建时间: ${new Date(record.createdAt).toLocaleString('zh-CN')}`);
    console.log(`更新时间: ${new Date(record.updatedAt).toLocaleString('zh-CN')}`);
    
    if (record.resultData) {
      try {
        const resultData = JSON.parse(record.resultData);
        console.log(`结果数据行数: ${resultData.length}`);
        
        const hasMultipleMatch = resultData.some((row: any) => row._multipleMatch === true);
        console.log(`是否包含多匹配记录: ${hasMultipleMatch}`);
        
        const chaoyangRecords = resultData.filter((row: any) => 
          row['城市'] && row['城市'].includes('朝阳')
        );
        console.log(`包含"朝阳"的记录数: ${chaoyangRecords.length}`);
        
        chaoyangRecords.forEach((row: any, index: number) => {
          console.log(`  朝阳记录${index + 1}: ${row['城市']} - _multipleMatch: ${row._multipleMatch}`);
        });
      } catch (e) {
        console.log('解析resultData失败:', e);
      }
    } else {
      console.log('无resultData');
    }
    
    if (record.errorMessage) {
      console.log(`错误信息: ${record.errorMessage}`);
    }
  }
  
  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
