const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const API_BASE_URL = 'http://localhost:3007/api';

async function testFilename() {
  console.log('测试文件名处理...');
  
  try {
    // 创建一个中文文件名的测试文件
    const testFileName = '测试文件_中文.xlsx';
    const XLSX = require('xlsx');
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet([['测试列'], ['测试数据']]);
    XLSX.utils.book_append_sheet(workbook, worksheet, '测试');
    XLSX.writeFile(workbook, testFileName);
    
    console.log('创建测试文件:', testFileName);
    
    // 上传文件
    const form = new FormData();
    const fileStream = fs.createReadStream(testFileName);
    form.append('file', fileStream, {
      filename: testFileName,
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    
    console.log('上传文件名:', testFileName);
    console.log('FormData文件名:', form.getHeaders()['content-disposition']);
    
    const response = await axios.post(`${API_BASE_URL}/postal/routes/upload`, form, {
      headers: {
        ...form.getHeaders(),
      }
    });
    
    console.log('上传结果:', response.data);
    
    // 获取导入记录列表
    const listResponse = await axios.get(`${API_BASE_URL}/postal/routes/list`);
    console.log('导入记录列表:', JSON.stringify(listResponse.data, null, 2));
    
    // 清理测试文件
    fs.unlinkSync(testFileName);
    
  } catch (error) {
    console.error('测试失败:', error.message);
    if (error.response) {
      console.error('错误响应:', error.response.data);
    }
  }
}

testFilename();
