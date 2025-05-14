import express from 'express';
import * as driverController from '../controllers/driver.controller.js';
const router = express.Router();

router
  .route('/') // on this route you can do only GET and POST
  .get(driverController.getAllDrivers)
  .post(driverController.createDriver);

router
  .route('/:id') // on this route you can do only GET, PATCH and DELETE
  .get(driverController.getDriver)
  .patch(driverController.updateDriver)
  .delete(driverController.deleteDriver);

export default router;