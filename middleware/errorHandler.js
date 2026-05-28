// backend/middleware/errorHandler.js
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      message: 'Validation Error',
      errors: Object.values(err.errors).map(e => e.message)
    });
  }
  
  if (err.code === 11000) {
    return res.status(400).json({
      message: 'Duplicate field value entered',
      field: Object.keys(err.keyPattern)[0]
    });
  }
  
  res.status(500).json({
    message: err.message || 'Server Error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

module.exports = errorHandler;