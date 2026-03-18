import * as XLSX from 'xlsx';

const excelFile = 'E:\\PM\\AI development\\邮编清理\\25.4.24运输区域-OTMS-Lynn - 副本1.xlsx';

try {
  const workbook = XLSX.readFile(excelFile);
  
  // 查看Sheet1工作表的内容
  const sheetName = 'Sheet1';
  const worksheet = workbook.Sheets[sheetName];
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false });
  
  console.log(`工作表 ${sheetName} 包含 ${jsonData.length} 行数据`);
  console.log('前5行数据:');
  jsonData.slice(0, 5).forEach((row, index) => {
    console.log(`第 ${index + 1} 行:`, row);
  });
  
  // 检查是否有包含"-"的字段
  console.log('\n检查是否有包含"-"的字段:');
  jsonData.forEach((row, index) => {
    const rowObj = row as Record<string, any>;
    for (const [key, value] of Object.entries(rowObj)) {
      if (typeof value === 'string' && value.includes('-')) {
        console.log(`第 ${index + 1} 行的 ${key} 字段包含"-": ${value}`);
      }
    }
  });
  
} catch (error) {
  console.error('读取Excel文件失败:', error);
}
