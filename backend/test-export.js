const { PrismaClient } = require('@prisma/client');
const XLSX = require('xlsx');
const fs = require('fs');

const prisma = new PrismaClient();

async function testExport() {
  try {
    console.log('测试导出功能...');
    
    // 检查是否有导入记录
    const imports = await prisma.userRouteImport.findMany();
    console.log('导入记录数量:', imports.length);
    
    if (imports.length === 0) {
      console.log('没有导入记录，创建一个测试记录...');
      
      // 创建测试数据
      const testData = [
        {
          province: '北京市',
          city: '北京市',
          district: '朝阳区',
          address: '北京市朝阳区建国路88号',
          '省(oTMS)': '北京市',
          '市(oTMS)': '北京市',
          '区(oTMS)': '朝阳区'
        },
        {
          province: '上海市',
          city: '上海市',
          district: '浦东新区',
          address: '上海市浦东新区世纪大道1号',
          '省(oTMS)': '上海市',
          '市(oTMS)': '上海市',
          '区(oTMS)': '浦东新区'
        }
      ];
      
      const importRecord = await prisma.userRouteImport.create({
        data: {
          fileName: 'test.xlsx',
          importData: JSON.stringify(testData),
          resultData: JSON.stringify(testData),
          status: 'completed'
        }
      });
      
      console.log('创建测试记录成功，ID:', importRecord.id);
      
      // 测试导出
      await testExportById(importRecord.id);
    } else {
      // 使用第一个记录测试导出
      console.log('使用现有记录测试导出，ID:', imports[0].id);
      await testExportById(imports[0].id);
    }
    
  } catch (error) {
    console.error('测试导出失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function testExportById(id) {
  try {
    console.log(`测试导出记录 ID: ${id}`);
    
    // 模拟服务中的导出逻辑
    const importRecord = await prisma.userRouteImport.findUnique({ where: { id } });
    if (!importRecord || !importRecord.resultData) {
      throw new Error('没有可导出的数据');
    }

    const resultData = JSON.parse(importRecord.resultData);
    console.log('导出数据长度:', resultData.length);
    console.log('导出数据示例:', resultData[0]);
    
    const workbook = XLSX.utils.book_new();
    
    let worksheet;
    if (resultData.length === 0) {
      worksheet = XLSX.utils.aoa_to_sheet([['无数据']]);
    } else {
      const headers = Object.keys(resultData[0]);
      const data = [headers, ...resultData.map(row => headers.map(header => row[header] || ''))];
      worksheet = XLSX.utils.aoa_to_sheet(data);
    }

    XLSX.utils.book_append_sheet(workbook, worksheet, '清洗结果');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    
    // 保存到文件
    const fileName = `test-export-${id}.xlsx`;
    fs.writeFileSync(fileName, buffer);
    
    console.log(`导出文件已保存: ${fileName}`);
    console.log(`文件大小: ${buffer.length} bytes`);
    
    // 验证文件是否可以打开
    try {
      const workbook2 = XLSX.readFile(fileName);
      const sheetName = workbook2.SheetNames[0];
      const sheet = workbook2.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(sheet);
      console.log('验证文件读取成功，数据行数:', data.length);
      console.log('导出功能测试通过！');
    } catch (error) {
      console.error('验证文件失败:', error);
    }
    
  } catch (error) {
    console.error('导出测试失败:', error);
  }
}

testExport();
