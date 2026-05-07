const XLSX = require('xlsx');

// 创建测试数据
const data = [
  ['Flag', 'Name', 'Value'],
  ['Y', '朝阳', 1],
  ['N', '上海', 2],
  ['Y', '朝阳', 3]
];

const wb = XLSX.utils.book_new();
const ws = XLSX.utils.aoa_to_sheet(data);

// 设置条件格式
ws['!cf'] = [{
  type: 'expression',
  dxf: {
    fill: { fgColor: { rgb: 'FFFFFF00' } }
  },
  formula: ['$A2="Y"'],
  sqref: 'A2:C4'
}];

// 设置列宽和隐藏第一列
ws['!cols'] = [{ hidden: true }, { wch: 15 }, { wch: 15 }];

// 写入文件
XLSX.writeFile(wb, './test_cf.xlsx');
console.log('File written with conditional formatting');

// 读取文件检查
const wb2 = XLSX.readFile('./test_cf.xlsx');
const ws2 = wb2.Sheets['Sheet'];
console.log('CF rules:', JSON.stringify(ws2['!cf']));
