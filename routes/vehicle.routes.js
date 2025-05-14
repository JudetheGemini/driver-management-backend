import express from 'express';
const router = express.Router();
import * as vehicleController from '../controllers/vehicle.controller.js';
import validateVehicle from '../utils/vehicleValidation.js';

router
  .route('/')
  .get(vehicleController.getAllVehicles)
  .post(validateVehicle,vehicleController.createVehicle);



router
  .route('/:id')
  .get(vehicleController.getVehicle)
  .patch(validateVehicle, vehicleController.updateVehicle)
  .delete(vehicleController.deleteVehicle);

router
  .route('/:id/inspections')
  .get(vehicleController.getVehicleInspections)   


export default router;