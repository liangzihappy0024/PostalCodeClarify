import { Request, Response } from 'express';
import { PostalService } from '../services/postalService';
import multer from 'multer';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const postalService = new PostalService();
export const upload = multer({ storage: multer.memoryStorage() });

export class PostalController {

  async uploadStandardPostalCode(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, error: '请上传文件' });
      }

      const result = await postalService.uploadStandardPostalCode(req.file.buffer);
      
      if (result.success) {
        res.json({ success: true, count: result.count });
      } else {
        res.status(500).json({ success: false, error: result.error });
      }
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async clearStandardPostalCode(req: Request, res: Response) {
    try {
      const result = await postalService.clearStandardPostalCode();
      
      if (result.success) {
        res.json({ success: true });
      } else {
        res.status(500).json({ success: false, error: result.error });
      }
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getStandardPostalCodeCount(req: Request, res: Response) {
    try {
      const count = await postalService.getStandardPostalCodeCount();
      res.json({ success: true, count });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getStandardPostalCodes(req: Request, res: Response) {
    try {
      const skip = parseInt(req.query.skip as string) || 0;
      const take = parseInt(req.query.take as string) || 100;
      const province = req.query.province as string || '';
      const city = req.query.city as string || '';
      const district = req.query.district as string || '';
      const postalCode = req.query.postalCode as string || '';
      const postalCodes = await postalService.getStandardPostalCodes(skip, take, { province, city, district, postalCode });
      res.json({ success: true, data: postalCodes });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async uploadUserRoutes(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, error: '请上传文件' });
      }

      // 处理文件名乱码问题：将Latin1编码转换为UTF-8
      if (req.file.originalname) {
        try {
          // Multer默认使用Latin1编码，需要转换为UTF-8
          req.file.originalname = Buffer.from(req.file.originalname, 'latin1').toString('utf8');
        } catch (e) {
          // 如果转换失败，保持原文件名
        }
      }

      const result = await postalService.uploadUserRoutes(req.file);
      
      if (result.success) {
        res.json({ success: true, id: result.id });
      } else {
        res.status(500).json({ success: false, error: result.error });
      }
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getUserRouteImports(req: Request, res: Response) {
    try {
      const imports = await postalService.getUserRouteImports();
      res.json({ success: true, data: imports });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getUserRouteImportById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const importData = await postalService.getUserRouteImportById(id);
      
      if (importData) {
        res.json({ success: true, data: importData });
      } else {
        res.status(404).json({ success: false, error: '记录不存在' });
      }
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async deleteUserRouteImport(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const result = await postalService.deleteUserRouteImport(id);
      
      if (result.success) {
        res.json({ success: true });
      } else {
        res.status(500).json({ success: false, error: result.error });
      }
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async cleanRouteData(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const result = await postalService.cleanRouteData(id);
      
      if (result.success) {
        res.json({ success: true });
      } else {
        res.status(500).json({ success: false, error: result.error });
      }
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async exportResult(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      
      const buffer = await postalService.generateExportExcelBuffer(id);
      
      // 获取原始文件名
      const importRecord = await prisma.userRouteImport.findUnique({ where: { id } });
      const originalFileName = importRecord?.fileName || '清洗结果';
      
      // 移除文件扩展名，添加"_清洗结果"后缀
      const fileNameWithoutExt = originalFileName.replace(/\.[^/.]+$/, "");
      const fileName = encodeURIComponent(`${fileNameWithoutExt}_清洗结果.xlsx`);
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=${fileName}; filename*=UTF-8''${fileName}`);
      res.send(buffer);
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

export const postalController = new PostalController();
