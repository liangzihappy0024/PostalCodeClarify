import { Router } from 'express';
import { postalController, upload } from '../controllers/postalController';

const router = Router();

router.post('/standard/upload', upload.single('file'), (req, res) => postalController.uploadStandardPostalCode(req, res));
router.delete('/standard/clear', (req, res) => postalController.clearStandardPostalCode(req, res));
router.get('/standard/count', (req, res) => postalController.getStandardPostalCodeCount(req, res));
router.get('/standard/list', (req, res) => postalController.getStandardPostalCodes(req, res));

router.post('/routes/upload', upload.single('file'), (req, res) => postalController.uploadUserRoutes(req, res));
router.get('/routes/list', (req, res) => postalController.getUserRouteImports(req, res));
router.get('/routes/:id', (req, res) => postalController.getUserRouteImportById(req, res));
router.delete('/routes/:id', (req, res) => postalController.deleteUserRouteImport(req, res));
router.post('/routes/:id/clean', (req, res) => postalController.cleanRouteData(req, res));
router.get('/routes/:id/export', (req, res) => postalController.exportResult(req, res));

export default router;
