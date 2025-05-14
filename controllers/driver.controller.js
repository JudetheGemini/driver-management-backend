import pool from '../config/db.js';
import AppError from '../utils/appError.js';
import catchAsync from '../utils/catchAsync.js';
import { nanoid } from 'nanoid';

// This function creates a new driver in the database
// It takes the request body, generates a unique driver ID, and inserts the new driver into the database
// It also retrieves the newly created driver and sends it back in the response
export const createDriver = catchAsync(async (req, res, next) => {
  const { first_name, last_name, license_number, phone, email } = req.body;

  const driverId = nanoid(8); 
  
  const [result] = await pool.execute(
    `INSERT INTO drivers 
    (driver_id, first_name, last_name, license_number, phone, email) 
    VALUES (?, ?, ?, ?, ?, ?)`,
    [driverId, first_name, last_name, license_number, phone, email]
  );
  
  const [newDriver] = await pool.execute(
    'SELECT * FROM drivers WHERE driver_id = ?',
    [driverId]
  );

  res.status(201).json({
    status: 'success',
    data: {
      driver: newDriver[0]
    }
  });
});

// This function retrieves all drivers from the database
// It orders the drivers by last name and first name
// It sends the list of drivers back in the response
// It also includes the total number of drivers in the response
// It uses a try-catch block to handle any errors that may occur during the database query
// It uses the catchAsync utility to handle asynchronous errors
export const getAllDrivers = catchAsync(async (req, res, next) => {
  const [drivers] = await pool.execute(
    'SELECT * FROM drivers ORDER BY last_name, first_name'
  );

  res.status(200).json({
    status: 'success',
    results: drivers.length,
    data: {
      drivers
    }
  });
});

// This function retrieves a single driver by their ID from the database
// It uses a parameterized query to prevent SQL injection attacks
// It checks if the driver exists and returns a 404 error if not
// It sends the driver data back in the response
// It uses the catchAsync utility to handle asynchronous errors
export const getDriver = catchAsync(async (req, res, next) => {
  const [driver] = await pool.execute(
    'SELECT * FROM drivers WHERE driver_id = ?',
    [req.params.id]
  );

  if (!driver[0]) {
    return next(new AppError('No driver found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      driver: driver[0]
    }
  });
});

// This function updates a driver's information in the database
// It uses a parameterized query to prevent SQL injection attacks
// It checks if the driver exists and returns a 404 error if not
// It updates the driver's information and sends the updated driver data back in the response
// It uses the catchAsync utility to handle asynchronous errors
export const updateDriver = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { first_name, last_name, license_number, phone, email } = req.body;

  const [result] = await pool.execute(
    `UPDATE drivers 
     SET first_name = ?, last_name = ?, license_number = ?, phone = ?, email = ?
     WHERE driver_id = ?`,
    [first_name, last_name, license_number, phone, email, id]
  );

  if (result.affectedRows === 0) {
    return next(new AppError('No driver found with that ID', 404));
  }

  const [updatedDriver] = await pool.execute(
    'SELECT * FROM drivers WHERE driver_id = ?',
    [id]
  );

  res.status(200).json({
    status: 'success',
    data: {
      driver: updatedDriver[0]
    }
  });
});

// This function deletes a driver from the database
// It uses a parameterized query to prevent SQL injection attacks
// It checks if the driver exists and returns a 404 error if not
// It deletes the driver and sends a 204 No Content response
// It uses the catchAsync utility to handle asynchronous errors
export const deleteDriver = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  // First check if driver exists
  const [driver] = await pool.execute(
    'SELECT * FROM drivers WHERE driver_id = ?',
    [id]
  );

  if (!driver[0]) {
    return next(new AppError('No driver found with that ID', 404));
  }

  // Delete the driver
  const [result] = await pool.execute(
    'DELETE FROM drivers WHERE driver_id = ?',
    [id]
  );

  if (result.affectedRows === 0) {
    return next(new AppError('Driver could not be deleted', 500));
  }

  res.status(204).json({
    status: 'success',
    data: null
  });
});