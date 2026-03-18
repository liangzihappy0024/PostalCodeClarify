import * as XLSX from 'xlsx';

const excelFile = 'E:\\PM\\AI development\\邮编清理\\25.4.24运输区域-OTMS-Lynn - 副本1.xlsx';

try {
  const workbook = XLSX.readFile(excelFile);
  console.log(`Excel文件包含 ${workbook.SheetNames.length} 个工作表`);
  
  workbook.SheetNames.forEach((sheetName, index) => {
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false });
    console.log(`工作表 ${index + 1}: ${sheetName} - ${jsonData.length} 行数据`);
  });
} catch (error) {
  console.error('读取Excel文件失败:', error);
}
