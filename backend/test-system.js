const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const API_BASE_URL = 'http://localhost:3007/api';

async function testSystem() {
  console.log('开始测试系统功能...');
  
  try {
    // 测试1: 检查标准邮编数量
    console.log('\n1. 测试获取标准邮编数量');
    const countResponse = await axios.get(`${API_BASE_URL}/postal/standard/count`);
    console.log('标准邮编数量:', countResponse.data.count);
    
    // 测试2: 上传标准邮编（使用测试文件）
    console.log('\n2. 测试上传标准邮编');
    const standardForm = new FormData();
    const standardFile = fs.createReadStream(path.join(__dirname, 'test-standard.xlsx'));
    standardForm.append('file', standardFile);
    
    const standardResponse = await axios.post(`${API_BASE_URL}/postal/standard/upload`, standardForm, {
      headers: standardForm.getHeaders()
    });
    console.log('上传标准邮编结果:', standardResponse.data);
    
    // 测试3: 上传用户线路
    console.log('\n3. 测试上传用户线路');
    const routesForm = new FormData();
    const routesFile = fs.createReadStream(path.join(__dirname, 'test-routes.xlsx'));
    routesForm.append('file', routesFile);
    
    const routesResponse = await axios.post(`${API_BASE_URL}/postal/routes/upload`, routesForm, {
      headers: routesForm.getHeaders()
    });
    console.log('上传用户线路结果:', routesResponse.data);
    
    if (routesResponse.data.success) {
      const importId = routesResponse.data.id;
      
      // 测试4: 清洗线路
      console.log('\n4. 测试清洗线路');
      const cleanResponse = await axios.post(`${API_BASE_URL}/postal/routes/${importId}/clean`);
      console.log('清洗线路结果:', cleanResponse.data);
      
      // 测试5: 导出结果
      console.log('\n5. 测试导出结果');
      const exportResponse = await axios.get(`${API_BASE_URL}/postal/routes/${importId}/export`, {
        responseType: 'arraybuffer'
      });
      console.log('导出结果状态:', exportResponse.status);
      console.log('导出文件大小:', exportResponse.data.length);
      
      // 保存导出文件
      fs.writeFileSync(`export-test-${importId}.xlsx`, exportResponse.data);
      console.log('导出文件已保存: export-test-${importId}.xlsx');
      
      // 测试6: 删除记录
      console.log('\n6. 测试删除记录');
      const deleteResponse = await axios.delete(`${API_BASE_URL}/postal/routes/${importId}`);
      console.log('删除记录结果:', deleteResponse.data);
    }
    
    console.log('\n测试完成！');
    
  } catch (error) {
    console.error('测试过程中出错:', error.message);
    if (error.response) {
      console.error('错误响应:', error.response.data);
    }
  }
}

// 创建测试文件
function createTestFiles() {
  console.log('创建测试文件...');
  
  // 创建标准邮编测试文件
  const standardData = [
    ['省', '市', '区', '邮编'],
    ['北京市', '北京市', '朝阳区', '100020'],
    ['上海市', '上海市', '浦东新区', '200120'],
    ['广东省', '广州市', '天河区', '510630'],
    ['浙江省', '杭州市', '西湖区', '310000'],
    ['江苏省', '南京市', '玄武区', '210000']
  ];
  
  // 创建用户线路测试文件
  const routesData = [
    ['运输区域描述'],
    ['北京市朝阳区建国路88号'],
    ['上海市浦东新区世纪大道1号'],
    ['广州市天河区天河路385号'],
    ['杭州市西湖区龙井路1号'],
    ['南京市玄武区中山路1号']
  ];
  
  // 使用xlsx库创建文件
  const XLSX = require('xlsx');
  
  // 创建标准邮编文件
  const standardWorkbook = XLSX.utils.book_new();
  const standardWorksheet = XLSX.utils.aoa_to_sheet(standardData);
  XLSX.utils.book_append_sheet(standardWorkbook, standardWorksheet, '标准邮编');
  XLSX.writeFile(standardWorkbook, 'test-standard.xlsx');
  
  // 创建用户线路文件
  const routesWorkbook = XLSX.utils.book_new();
  const routesWorksheet = XLSX.utils.aoa_to_sheet(routesData);
  XLSX.utils.book_append_sheet(routesWorkbook, routesWorksheet, '用户线路');
  XLSX.writeFile(routesWorkbook, 'test-routes.xlsx');
  
  console.log('测试文件创建完成');
}

// 先创建测试文件，然后运行测试
createTestFiles();
testSystem();
