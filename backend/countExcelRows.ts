import * as XLSX from 'xlsx';

const excelFile = 'E:\\PM\\AI development\\邮编清理\\25.4.24运输区域-OTMS-Lynn - 副本1.xlsx';

try {
  const workbook = XLSX.readFile(excelFile);
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false });
  console.log(`Excel文件包含 ${jsonData.length} 行数据`);
} catch (error) {
  console.error('读取Excel文件失败:', error);
}
