const errorHandler = (err, req, res, next) => {
  console.error('🔥 [Server Error]:', err);

  const status = err.status || 500;
  const message = err.message || 'Internal server error';

  res.status(status).json({
    success: false,
    message: message
  });
};

module.exports = errorHandler;
