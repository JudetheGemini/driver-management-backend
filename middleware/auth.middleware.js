// middleware/auth.middleware.js
import jwt from 'jsonwebtoken';
import AppError from '../utils/appError.js';
import catchAsync from '../utils/catchAsync.js';
import pool from '../config/db.js';

export const protect = catchAsync(async (req, res, next) => {
  // 1) Get token
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('You are not logged in! Please log in to get access.', 401));
  }

  // 2) Verify token
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  // 3) Check if user still exists
  const [user] = await pool.execute(
    'SELECT * FROM drivers WHERE driver_id = ?',
    [decoded.id]
  );

  if (!user[0]) {
    return next(new AppError('The user belonging to this token no longer exists.', 401));
  }

  // 4) Grant access to protected route
  req.user = {
    id: user[0].driver_id,
    role: decoded.role || 'driver'
  };
  next();
});
