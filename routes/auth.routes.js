import express from 'express';
import * as authController from '../controllers/auth.controller.js';
const router = express.Router();

router
    .route('/admin/login')
    .post(authController.adminLogin);


router
    .route('/driver/login')
    .post(authController.driverLogin);


export default router;