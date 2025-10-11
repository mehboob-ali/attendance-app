export default function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  const message = err.message || 'Internal server error';
  
  console.error('Error:', err);
  
  res.status(status).json({ 
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
}
