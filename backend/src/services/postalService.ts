import * as XLSX from 'xlsx';
import { PrismaClient } from '@prisma/client';
import { AmapService, GeocodeResult } from './amapService';

const prisma = new PrismaClient();
const amapService = new AmapService();

interface RouteRecord {
  province?: string;
  city?: string;
  district?: string;
  address?: string;
  [key: string]: any;
}

interface CleanedRouteRecord extends RouteRecord {
  '省(oTMS)'?: string;
  '市(oTMS)'?: string;
  '区(oTMS)'?: string;
}

interface FilterParams {
  province?: string;
  city?: string;
  district?: string;
  postalCode?: string;
}

export class PostalService {

  async uploadStandardPostalCode(fileBuffer: Buffer): Promise<{ success: boolean; count: number; error?: string }> {
    try {
      const workbook = XLSX.read(fileBuffer, { type: 'buffer', cellDates: true });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false }) as Record<string, any>[];

      let count = 0;

      for (const row of jsonData) {
        const province = String(row['省'] || row['省份'] || row['province'] || '').trim();
        const city = String(row['市'] || row['城市'] || row['city'] || row['town'] || '').trim();
        const district = String(row['区'] || row['区县'] || row['district'] || row['county'] || '').trim();
        const postalCode = String(row['邮编'] || row['postalCode'] || row['zipcode'] || '').trim();

        // 只要有省字段就上传，允许市、区为空
        if (province) {
          // 检查是否已存在相同记录（考虑市、区可能为空的情况）
          const existing = await prisma.standardPostalCode.findFirst({
            where: {
              province,
              city: city || undefined,
              district: district || undefined
            }
          });
          if (!existing) {
            await prisma.standardPostalCode.create({
              data: { province, city, district, postalCode }
            });
            count++;
          }
        }
      }

      return { success: true, count };
    } catch (error: any) {
      return { success: false, count: 0, error: error.message };
    }
  }

  async clearStandardPostalCode(): Promise<{ success: boolean; error?: string }> {
    try {
      await prisma.standardPostalCode.deleteMany();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getStandardPostalCodeCount(): Promise<number> {
    return await prisma.standardPostalCode.count();
  }

  async getStandardPostalCodes(skip: number = 0, take: number = 100, filters?: FilterParams): Promise<Array<{
    id: number;
    province: string;
    city: string;
    district: string;
    postalCode: string;
  }>> {
    const where: any = {};
    if (filters?.province) {
      where.province = { startsWith: filters.province };
    }
    if (filters?.city) {
      where.city = { startsWith: filters.city };
    }
    if (filters?.district) {
      where.district = { startsWith: filters.district };
    }
    if (filters?.postalCode) {
      where.postalCode = { startsWith: filters.postalCode };
    }
    return await prisma.standardPostalCode.findMany({
      select: {
        id: true,
        province: true,
        city: true,
        district: true,
        postalCode: true
      },
      where,
      skip,
      take,
      orderBy: { id: 'asc' }
    });
  }

  async uploadUserRoutes(file: Express.Multer.File): Promise<{ success: boolean; id?: number; error?: string }> {
    try {
      const workbook = XLSX.read(file.buffer, { type: 'buffer', cellDates: true });
      let jsonData: Record<string, any>[] = [];
      
      // 处理所有工作表
      workbook.SheetNames.forEach(sheetName => {
        const worksheet = workbook.Sheets[sheetName];
        const sheetData = XLSX.utils.sheet_to_json(worksheet, { raw: false }) as Record<string, any>[];
        // 为每条数据添加工作表名称
        sheetData.forEach(row => {
          row['工作表'] = sheetName;
        });
        jsonData = jsonData.concat(sheetData);
      });

      // 处理"江苏省 - 无锡市 - 马山"格式的数据
      const processedData = jsonData.map((row) => {
        // 保存原始线路数据
        let originalRoute = '';
        const allRouteFields = ['运输区域描述', '运输区域', '区域描述', 'area', 'region', 'transport_area', '线路', 'route', '线路名称', '线路地址'];
        
        // 首先尝试从常见线路字段中查找
        for (const field of allRouteFields) {
          if (row[field] && typeof row[field] === 'string') {
            originalRoute = row[field];
            break;
          }
        }
        
        // 如果没有找到常见线路字段，使用第一列作为原始线路
        if (!originalRoute) {
          const rowKeys = Object.keys(row).filter(key => key !== '工作表');
          if (rowKeys.length > 0) {
            const firstField = rowKeys[0];
            if (row[firstField] && typeof row[firstField] === 'string') {
              originalRoute = row[firstField];
            }
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
        
        // 如果找到线路字段且包含"-"，则分割处理
        if (routeValue && routeValue.includes('-')) {
          const parts = routeValue.split('-').map(part => part.trim());
          if (parts.length >= 1) {
            row['一级区域'] = parts[0];
          }
          if (parts.length >= 2) {
            row['二级区域'] = parts[1];
          }
          if (parts.length >= 3) {
            row['三级区域'] = parts[2];
          }
        }
        return row;
      });

      const importRecord = await prisma.userRouteImport.create({
        data: {
          fileName: file.originalname,
          importData: JSON.stringify(processedData),
          status: 'pending'
        }
      });

      return { success: true, id: importRecord.id };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getUserRouteImports(): Promise<Array<{
    id: number;
    fileName: string;
    status: string;
    createdAt: Date;
    errorMessage: string | null;
  }>> {
    return await prisma.userRouteImport.findMany({
      select: {
        id: true,
        fileName: true,
        status: true,
        createdAt: true,
        errorMessage: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getUserRouteImportById(id: number): Promise<{
    id: number;
    fileName: string;
    importData: string;
    resultData: string | null;
    status: string;
    errorMessage: string | null;
  } | null> {
    return await prisma.userRouteImport.findUnique({
      where: { id }
    });
  }

  async deleteUserRouteImport(id: number): Promise<{ success: boolean; error?: string }> {
    try {
      await prisma.userRouteImport.delete({ where: { id } });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async cleanRouteData(id: number): Promise<{ success: boolean; error?: string }> {
    try {
      await prisma.userRouteImport.update({
        where: { id },
        data: { status: 'processing' }
      });

      const importRecord = await prisma.userRouteImport.findUnique({ where: { id } });
      if (!importRecord) {
        throw new Error('导入记录不存在');
      }

      const importData = JSON.parse(importRecord.importData) as RouteRecord[];
      const cleanedData: CleanedRouteRecord[] = [];

      for (const record of importData) {
        const cleanedRecord: CleanedRouteRecord = { ...record };

        // 优先使用一级区域、二级区域、三级区域
        const province = record['一级区域'] || record.province || record['省'] || record['Province'] || '';
        const city = record['二级区域'] || record.city || record['市'] || record['City'] || '';
        const district = record['三级区域'] || record.district || record['区'] || record['县'] || record['District'] || '';
        const address = record.address || record['运输区域描述'] || record['运输区域'] || record['地址'] || '';
        const originalRoute = record['原始线路'] || address || '';

        let matched = false;

        // 处理只有一列信息且没有固定符号进行解析的情况
        // 首先尝试依次与三级区域、二级区域、一级区域进行精确匹配，以节约高德 API 调用
        if (!province && !city && !district && originalRoute) {
          let singleMatch;
          let matchLevel: 'district' | 'city' | 'province' | null = null;
          
          // 1. 首先尝试精确匹配三级区域（district）
          singleMatch = await prisma.standardPostalCode.findFirst({
            where: {
              district: originalRoute
            }
          });
          if (singleMatch) {
            matchLevel = 'district';
          }
          
          // 2. 如果三级区域匹配失败，尝试精确匹配二级区域（city）
          if (!singleMatch) {
            singleMatch = await prisma.standardPostalCode.findFirst({
              where: {
                city: originalRoute
              }
            });
            if (singleMatch) {
              matchLevel = 'city';
            }
          }
          
          // 3. 如果二级区域匹配失败，尝试精确匹配一级区域（province）
          if (!singleMatch) {
            singleMatch = await prisma.standardPostalCode.findFirst({
              where: {
                province: originalRoute
              }
            });
            if (singleMatch) {
              matchLevel = 'province';
            }
          }
          
          if (singleMatch && matchLevel) {
            // 根据匹配级别返回对应的信息
            if (matchLevel === 'district') {
              // 匹配到三级区域，返回省市区
              cleanedRecord['一级区域（oTMS）'] = singleMatch.province;
              cleanedRecord['二级区域（oTMS）'] = singleMatch.city;
              cleanedRecord['三级区域（oTMS）'] = singleMatch.district;
              cleanedRecord['省 (oTMS)'] = singleMatch.province;
              cleanedRecord['市 (oTMS)'] = singleMatch.city;
              cleanedRecord['区 (oTMS)'] = singleMatch.district;
              cleanedRecord['市 (town)'] = singleMatch.city;
              cleanedRecord['县 (County)'] = singleMatch.district;
            } else if (matchLevel === 'city') {
              // 匹配到二级区域，只返回省市，三级区域为空
              cleanedRecord['一级区域（oTMS）'] = singleMatch.province;
              cleanedRecord['二级区域（oTMS）'] = singleMatch.city;
              cleanedRecord['三级区域（oTMS）'] = '';
              cleanedRecord['省 (oTMS)'] = singleMatch.province;
              cleanedRecord['市 (oTMS)'] = singleMatch.city;
              cleanedRecord['区 (oTMS)'] = '';
              cleanedRecord['市 (town)'] = singleMatch.city;
              cleanedRecord['县 (County)'] = '';
            } else if (matchLevel === 'province') {
              // 匹配到一级区域，只返回省，市区为空
              cleanedRecord['一级区域（oTMS）'] = singleMatch.province;
              cleanedRecord['二级区域（oTMS）'] = '';
              cleanedRecord['三级区域（oTMS）'] = '';
              cleanedRecord['省 (oTMS)'] = singleMatch.province;
              cleanedRecord['市 (oTMS)'] = '';
              cleanedRecord['区 (oTMS)'] = '';
              cleanedRecord['市 (town)'] = '';
              cleanedRecord['县 (County)'] = '';
            }
            
            matched = true;
          }
        }

        // 智能判断：如果有完整的省市区信息，直接匹配
        if (province && city && district) {
          let exactMatch;
          
          // 处理"省直辖县市"的情况
          if (city.includes('省直辖县市')) {
            // 使用三级区域代替二级区域进行匹配，三级区域不再匹配
            // 首先尝试精确匹配城市
            exactMatch = await prisma.standardPostalCode.findFirst({
              where: {
                province: { startsWith: province },
                city: district
              }
            });
            
            // 如果精确匹配失败，尝试开头匹配
            if (!exactMatch) {
              exactMatch = await prisma.standardPostalCode.findFirst({
                where: {
                  province: { startsWith: province },
                  city: { startsWith: district }
                }
              });
            }
          } else {
            // 对于普通城市，使用开头匹配，确保省、市、区都匹配或开头匹配
            exactMatch = await prisma.standardPostalCode.findFirst({
              where: {
                province: { startsWith: province },
                city: { startsWith: city },
                district: { startsWith: district }
              }
            });
          }

          if (exactMatch) {
            cleanedRecord['一级区域（oTMS）'] = exactMatch.province;
            cleanedRecord['二级区域（oTMS）'] = exactMatch.city;
            cleanedRecord['三级区域（oTMS）'] = exactMatch.district;
            cleanedRecord['省(oTMS)'] = exactMatch.province;
            cleanedRecord['市(oTMS)'] = exactMatch.city;
            cleanedRecord['区(oTMS)'] = exactMatch.district;
            cleanedRecord['市(town)'] = exactMatch.city;
            cleanedRecord['县(County)'] = exactMatch.district;
            matched = true;
          }
        }

        // 标记是否已经调用过高德API
        let hasCalledAmap = false;

        // 如果没有匹配成功，且有地址信息，调用 Geocoding API
        if (!matched && address) {
          try {
            const geocodeResult = await amapService.geocode(address);
            hasCalledAmap = true;
            
            if (geocodeResult) {
              const { province: gp, city: gc, district: gd } = geocodeResult;

              const fuzzyMatch = await prisma.standardPostalCode.findFirst({
                where: {
                  province: { startsWith: gp },
                  city: { startsWith: gc },
                  district: { startsWith: gd }
                }
              });

              if (fuzzyMatch) {
                cleanedRecord['一级区域（oTMS）'] = fuzzyMatch.province;
                cleanedRecord['二级区域（oTMS）'] = fuzzyMatch.city;
                cleanedRecord['三级区域（oTMS）'] = fuzzyMatch.district;
                cleanedRecord['省 (oTMS)'] = fuzzyMatch.province;
                cleanedRecord['市 (oTMS)'] = fuzzyMatch.city;
                cleanedRecord['区 (oTMS)'] = fuzzyMatch.district;
                cleanedRecord['市 (town)'] = fuzzyMatch.city;
                cleanedRecord['县 (County)'] = fuzzyMatch.district;
              } else {
                cleanedRecord['一级区域（oTMS）'] = gp;
                cleanedRecord['二级区域（oTMS）'] = gc;
                cleanedRecord['三级区域（oTMS）'] = gd;
                cleanedRecord['省 (oTMS)'] = gp;
                cleanedRecord['市 (oTMS)'] = gc;
                cleanedRecord['区 (oTMS)'] = gd;
                cleanedRecord['市 (town)'] = gc;
                cleanedRecord['县 (County)'] = gd;
              }
            }
          } catch (error) {
            // 处理地址时出错，跳过
          }
        }

        // 如果只有部分信息（如只有省和市），且尚未调用过高德 API，尝试构造地址调用 API
        if (!matched && !hasCalledAmap && (province || city || district)) {
          try {
            const partialAddress = `${province}${city}${district}`;
            if (partialAddress) {
              const geocodeResult = await amapService.geocode(partialAddress);
              
              if (geocodeResult) {
                const { province: gp, city: gc, district: gd } = geocodeResult;

                const fuzzyMatch = await prisma.standardPostalCode.findFirst({
                  where: {
                    province: { startsWith: gp },
                    city: { startsWith: gc },
                    district: { startsWith: gd }
                  }
                });

                if (fuzzyMatch) {
                  cleanedRecord['一级区域（oTMS）'] = fuzzyMatch.province;
                  cleanedRecord['二级区域（oTMS）'] = fuzzyMatch.city;
                  cleanedRecord['三级区域（oTMS）'] = fuzzyMatch.district;
                  cleanedRecord['省 (oTMS)'] = fuzzyMatch.province;
                  cleanedRecord['市 (oTMS)'] = fuzzyMatch.city;
                  cleanedRecord['区 (oTMS)'] = fuzzyMatch.district;
                  cleanedRecord['市 (town)'] = fuzzyMatch.city;
                  cleanedRecord['县 (County)'] = fuzzyMatch.district;
                } else {
                  cleanedRecord['一级区域（oTMS）'] = gp;
                  cleanedRecord['二级区域（oTMS）'] = gc;
                  cleanedRecord['三级区域（oTMS）'] = gd;
                  cleanedRecord['省 (oTMS)'] = gp;
                  cleanedRecord['市 (oTMS)'] = gc;
                  cleanedRecord['区 (oTMS)'] = gd;
                  cleanedRecord['市 (town)'] = gc;
                  cleanedRecord['县 (County)'] = gd;
                }
              }
            }
          } catch (error) {
            // 处理部分地址时出错，跳过
          }
        }

        cleanedData.push(cleanedRecord);
      }

      await prisma.userRouteImport.update({
        where: { id },
        data: {
          resultData: JSON.stringify(cleanedData),
          status: 'completed'
        }
      });

      return { success: true };
    } catch (error: any) {
      await prisma.userRouteImport.update({
        where: { id },
        data: { status: 'failed', errorMessage: error.message }
      });
      return { success: false, error: error.message };
    }
  }

  generateExportExcel(id: number): Buffer {
    throw new Error('请使用 generateExportExcelBuffer 方法');
  }

  async generateExportExcelBuffer(id: number): Promise<Buffer> {
    const importRecord = await prisma.userRouteImport.findUnique({ where: { id } });
    if (!importRecord || !importRecord.resultData) {
      throw new Error('没有可导出的数据');
    }

    const resultData = JSON.parse(importRecord.resultData) as CleanedRouteRecord[];
    
    const workbook = XLSX.utils.book_new();
    
    let worksheet: XLSX.WorkSheet;
    if (resultData.length === 0) {
      worksheet = XLSX.utils.aoa_to_sheet([['无数据']]);
    } else {
      // 排除不需要的列
      const excludeColumns = ['省(oTMS)', '市(oTMS)', '区(oTMS)', '市(town)', '县(County)'];
      const headers = Object.keys(resultData[0]).filter(header => !excludeColumns.includes(header));
      const data = [headers, ...resultData.map(row => headers.map(header => row[header] || ''))];
      worksheet = XLSX.utils.aoa_to_sheet(data);

      // 为oTMS字段添加黄色背景
      const oTMSHeaders = headers.filter(header => header.includes('（oTMS）'));
      oTMSHeaders.forEach(header => {
        const colIndex = headers.indexOf(header);
        if (colIndex !== -1) {
          // 从第二行开始（第一行是表头）
          for (let rowIndex = 1; rowIndex <= resultData.length; rowIndex++) {
            const cellAddress = XLSX.utils.encode_cell({ c: colIndex, r: rowIndex });
            if (worksheet[cellAddress]) {
              // 添加黄色背景
              worksheet[cellAddress].s = {
                fill: {
                  fgColor: {
                    rgb: "FFFFFF00" // 黄色背景
                  }
                }
              };
            }
          }
        }
      });
    }

    XLSX.utils.book_append_sheet(workbook, worksheet, '清洗结果');

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }
}
