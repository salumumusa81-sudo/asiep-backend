const errorHandler = (err, req, res, next) => {
  console.error('❌ Error:', err.message);

  // Prisma errors
  if (err.code === 'P2002') {
    return res.status(409).json({ error: 'Rekodi hii tayari ipo (duplicate)' });
  }
  if (err.code === 'P2025') {
    return res.status(404).json({ error: 'Rekodi haipatikani' });
  }

  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    error: err.message || 'Kosa la ndani la server',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = { errorHandler };
