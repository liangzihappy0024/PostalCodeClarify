import * as XLSX from 'xlsx';

const excelFile = 'E:\\PM\\AI development\\邮编清理\\25.4.24运输区域-OTMS-Lynn - 副本1.xlsx';

try {
  console.log('开始测试线路分割功能...');
  
  // 读取Excel文件
  const workbook = XLSX.readFile(excelFile);
  
  // 处理所有工作表
  let jsonData: Record<string, any>[] = [];
  workbook.SheetNames.forEach(sheetName => {
    console.log(`处理工作表: ${sheetName}`);
    const worksheet = workbook.Sheets[sheetName];
    const sheetData = XLSX.utils.sheet_to_json(worksheet, { raw: false }) as Record<string, any>[];
    console.log(`工作表 ${sheetName} 包含 ${sheetData.length} 行数据`);
    // 为每条数据添加工作表名称
    sheetData.forEach(row => {
      row['工作表'] = sheetName;
    });
    jsonData = jsonData.concat(sheetData);
  });
  
  console.log(`总共有 ${jsonData.length} 行数据`);
  
  // 处理"江苏省-无锡市-马山"格式的数据
  const processedData = jsonData.map((row, index) => {
    // 保存原始线路数据
    let originalRoute = '';
    const allRouteFields = ['运输区域描述', '运输区域', '区域描述', 'area', 'region', 'transport_area', '线路', 'route', '线路名称', '线路地址'];
    for (const field of allRouteFields) {
      if (row[field] && typeof row[field] === 'string') {
        originalRoute = row[field];
        break;
      }
    }
    row['原始线路'] = originalRoute;
    
    // 只处理特定的线路字段，避免覆盖其他数据
    let routeValue = '';
    
    // 优先查找运输区域相关字段
    const transportFields = ['运输区域描述', '运输区域', '区域描述', 'area', 'region', 'transport_area'];
    for (const field of transportFields) {
      if (row[field] && typeof row[field] === 'string') {
        routeValue = row[field];
        break;
      }
    }
    
    // 如果没有找到运输区域字段，再查找其他线路字段
    if (!routeValue) {
      const routeFields = ['线路', 'route', '线路名称', '线路地址'];
      for (const field of routeFields) {
        if (row[field] && typeof row[field] === 'string') {
          routeValue = row[field];
          break;
        }
      }
    }
    
    console.log(`第 ${index + 1} 行: routeValue = ${routeValue}`);
    
    // 如果找到线路字段且包含"-"，则分割处理
    if (routeValue && routeValue.includes('-')) {
      console.log(`第 ${index + 1} 行: 包含"-"，开始分割`);
      const parts = routeValue.split('-').map(part => part.trim());
      console.log(`第 ${index + 1} 行: 分割结果 = ${parts}`);
      if (parts.length >= 1) {
        row['一级线路'] = parts[0];
        console.log(`第 ${index + 1} 行: 一级线路 = ${parts[0]}`);
      }
      if (parts.length >= 2) {
        row['二级线路'] = parts[1];
        console.log(`第 ${index + 1} 行: 二级线路 = ${parts[1]}`);
      }
      if (parts.length >= 3) {
        row['三级线路'] = parts[2];
        console.log(`第 ${index + 1} 行: 三级线路 = ${parts[2]}`);
      }
    } else {
      console.log(`第 ${index + 1} 行: 不包含"-"，跳过分割`);
    }
    
    return row;
  });
  
  // 输出处理后的前5行数据
  console.log('\n处理后的前5行数据:');
  processedData.slice(0, 5).forEach((row, index) => {
    console.log(`第 ${index + 1} 行:`);
    console.log(`  原始线路: ${row['原始线路']}`);
    console.log(`  一级线路: ${row['一级线路'] || '无'}`);
    console.log(`  二级线路: ${row['二级线路'] || '无'}`);
    console.log(`  三级线路: ${row['三级线路'] || '无'}`);
    console.log(`  工作表: ${row['工作表']}`);
  });
  
  console.log('\n测试完成！');
  
} catch (error) {
  console.error('测试失败:', error);
}
