// Environment variable validation
const validateEnv = () => {
  const requiredVars = ['MONGODB_URI', 'PORT', 'FRONTEND_URL', 'JWT_SECRET'];
  const missingVars = [];

  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  }

  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingVars.forEach(varName => {
      console.error(`   - ${varName}`);
    });
    console.error('\n💡 Please check your .env file and ensure all required variables are set.');
    console.error('   You can copy from .env.example: cp .env.example .env\n');
    process.exit(1);
  }

  console.log('✅ Environment variables validated successfully');
  console.log(`📡 MongoDB URI: ${process.env.MONGODB_URI.replace(/\/\/.*@/, '//<credentials>@')}`);
  console.log(`🚀 Server port: ${process.env.PORT}`);
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL}`);
  console.log(`📁 Node environment: ${process.env.NODE_ENV}`);
  console.log(`🔐 JWT Secret: ${process.env.JWT_SECRET ? 'Set' : 'Not set'}`);
};

module.exports = validateEnv;