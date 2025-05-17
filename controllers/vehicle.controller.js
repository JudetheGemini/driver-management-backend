import pool from '../config/db.js';
import AppError from '../utils/appError.js';
import catchAsync from '../utils/catchAsync.js';
import { nanoid } from 'nanoid';

// Create vehicle
// This function creates a new vehicle in the database
// It generates a unique vehicle ID using nanoid
export const createVehicle = catchAsync(async (req, res, next) => {
  const { registration_number, make, model, year, vin } = req.body;
  
  const vehicleId = nanoid(6); // Generate 6-character ID

  const [result] = await pool.execute(
    `INSERT INTO vehicles 
    (vehicle_id, registration_number, make, model, year, vin) 
    VALUES (?, ?, ?, ?, ?, ?)`,
    [vehicleId, registration_number, make, model, year, vin]
  );
  
  const [newVehicle] = await pool.execute(
    'SELECT * FROM vehicles WHERE vehicle_id = ?',
    [vehicleId]
  );

  res.status(201).json({
    status: 'success',
    data: {
      vehicle: newVehicle[0]
    }
  });
});

// Get all vehicles
// This function retrieves all vehicles from the database
// It orders them by make and model
export const getAllVehicles = catchAsync(async (req, res, next) => {
  const [vehicles] = await pool.execute(
    'SELECT * FROM vehicles ORDER BY make, model'
  );

  res.status(200).json({
    status: 'success',
    results: vehicles.length,
    data: {
      vehicles
    }
  });
});

// Get vehicle by ID
// This function retrieves a vehicle by its ID from the database
export const getVehicle = catchAsync(async (req, res, next) => {
  const [vehicle] = await pool.execute(
    'SELECT * FROM vehicles WHERE vehicle_id = ?',
    [req.params.id]
  );

  if (!vehicle[0]) {
    return next(new AppError('No vehicle found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      vehicle: vehicle[0]
    }
  });
});

// Update vehicle
// This function updates vehicle details in the database
export const updateVehicle = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { registration_number, make, model, year, vin } = req.body;

  const [result] = await pool.execute(
    `UPDATE vehicles 
     SET registration_number = ?, make = ?, model = ?, year = ?, vin = ?
     WHERE vehicle_id = ?`,
    [registration_number, make, model, year, vin, id]
  );

  if (result.affectedRows === 0) {
    return next(new AppError('No vehicle found with that ID', 404));
  }

  const [updatedVehicle] = await pool.execute(
    'SELECT * FROM vehicles WHERE vehicle_id = ?',
    [id]
  );

  res.status(200).json({
    status: 'success',
    data: {
      vehicle: updatedVehicle[0]
    }
  });
});

// Delete vehicle
// This function deletes a vehicle from the database
export const deleteVehicle = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  // First check if vehicle exists
  const [vehicle] = await pool.execute(
    'SELECT * FROM vehicles WHERE vehicle_id = ?',
    [id]
  );

  if (!vehicle[0]) {
    return next(new AppError('No vehicle found with that ID', 404));
  }

  // Delete the vehicle
  const [result] = await pool.execute(
    'DELETE FROM vehicles WHERE vehicle_id = ?',
    [id]
  );

  if (result.affectedRows === 0) {
    return next(new AppError('Vehicle could not be deleted', 500));
  }

  res.status(204).json({
    status: 'success',
    data: null
  });
});

// Get vehicle inspection history
// This function retrieves the last 30 inspections for a specific vehicle
// It includes the inspection date, driver name, and whether there are any body damages
export const getVehicleInspections = catchAsync(async (req, res) => {
  const vehicleId = req.params.id;

  // 1. Get basic inspection history
  const [inspections] = await pool.execute(
    `SELECT 
      i.inspection_id,
      i.inspection_date,
      d.first_name AS driver_name,
      EXISTS(SELECT 1 FROM body_damages WHERE inspection_id = i.inspection_id) AS has_damages
     FROM inspections i
     JOIN drivers d ON i.driver_id = d.driver_id
     WHERE i.vehicle_id = ?
     ORDER BY i.inspection_date DESC
     LIMIT 30`, // Last 30 inspections
    [vehicleId]
  );

  // 2. Get vehicle details
  const [vehicle] = await pool.execute(
    'SELECT make, model, year FROM vehicles WHERE vehicle_id = ?',
    [vehicleId]
  );

  res.json({
    status: 'success',
    data: {
      vehicle: vehicle[0],
      inspections
    }
  });
});