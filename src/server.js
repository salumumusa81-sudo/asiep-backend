require('dotenv').config();
const app = require('./app');
const prisma = require('./config/db');
const PORT = process.env.PORT || 5000;

process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err);
});

process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION:', err);
});

// Test database connection
prisma.$connect()
  .then(() => {
    console.log('✅ Database connected successfully!');
    app.listen(PORT, () => {
      console.log(`\n🌍 ASIEP Backend running on port ${PORT}`);
      console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 URL: http://localhost:${PORT}\n`);
    });
  })
  .catch((err) => {
    console.error('❌ Database connection failed:', err);
    process.exit(1);
  });