import { verifyPassword } from "../utils/authUtils.js"
import pool from '../config/db.js';
import AppError from '../utils/appError.js';
import catchAsync from '../utils/catchAsync.js';
import jwt from 'jsonwebtoken';

// this endpoint authenticates an admin trying to login
export const adminLogin = catchAsync(async (req, res) => {
  const { email, password } = req.body; // destructure the request body
  
  // 1. Find admin in the DB
  const [admin] = await pool.execute(
    'SELECT * FROM admins WHERE email = ?',
    [email]
  );

  // If no admin found, throw an error
  if (!admin[0]) throw new AppError('Invalid credentials', 401); 

  // 2. Verify password
  const isValid = await verifyPassword(
    password,
    admin[0].password_hash,
    admin[0].password_salt
  );

  // If password is invalid, throw an error
  if (!isValid) throw new AppError('Invalid credentials', 401);

  // 3. Generate JWT token
  const token = jwt.sign(
    { id: admin[0].admin_id },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );

  // 4. Send response containing the token and status
  res.json({ status: 'success', token });
});

// controllers/authController.js
export const driverLogin = catchAsync(async (req, res) => {
  const { id, password } = req.body;

  // 1. Find driver
  const [drivers] = await pool.execute(
    'SELECT * FROM drivers WHERE driver_id = ? AND is_active = TRUE',
    [id]
  );

  if (!drivers.length) {
    throw new AppError('Invalid email or password', 401);
  }

  const driver = drivers[0];

  // 2. Verify password
  const isValid = await verifyPassword(password, driver.password_hash);
  if (!isValid) {
    throw new AppError('Invalid email or password', 401);
  }

  // 3. Update last login
  // await pool.execute(
  //   'UPDATE drivers SET last_login = NOW() WHERE driver_id = ?',
  //   [driver.driver_id]
  // );

  // 4. Generate JWT token
  const token = jwt.sign(
    { id: driver.driver_id, role: 'driver' },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );

  // 5. Return response (without sensitive data)
  const { password_hash, password_salt, reset_token, ...safeData } = driver;
  
  res.json({
    status: 'success',
    token,
    data: {
      driver: safeData
    }
  });
});