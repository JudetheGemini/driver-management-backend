// utils/validation.js
 const validateVehicle = (req, res, next) => {
  const { registration_number, make, model, year } = req.body;
  
  if (!registration_number || !make || !model || !year) {
    return next(new AppError('Missing required vehicle fields', 400));
  }
  
  if (year < 1900 || year > new Date().getFullYear() + 1) {
    return next(new AppError('Invalid vehicle year', 400));
  }
  
  next();
};

export default validateVehicle