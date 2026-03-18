const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkCleaningStatus() {
  try {
    const imports = await prisma.userRouteImport.findMany({
      select: {
        id: true,
        fileName: true,
        status: true,
        createdAt: true,
        errorMessage: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log('导入记录状态:');
    console.log(JSON.stringify(imports, null, 2));
    
    // 检查正在处理的记录
    const processing = imports.filter(i => i.status === 'processing');
    if (processing.length > 0) {
      console.log('\n正在处理的记录:', processing.length);
      for (const record of processing) {
        console.log(`ID: ${record.id}, 文件名: ${record.fileName}, 创建时间: ${record.createdAt}`);
      }
    }
    
  } catch (error) {
    console.error('查询失败:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkCleaningStatus();
