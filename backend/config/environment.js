const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const environment = {
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',

  supabase: {
    url: process.env.SUPABASE_URL || '',
    anonKey: process.env.SUPABASE_ANON_KEY || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    isConfigured: Boolean(
      process.env.SUPABASE_URL &&
      process.env.SUPABASE_URL.startsWith('https://') &&
      process.env.SUPABASE_ANON_KEY &&
      !process.env.SUPABASE_ANON_KEY.includes('your-supabase-anon-key')
    ),
    isServiceRoleConfigured: Boolean(
      process.env.SUPABASE_SERVICE_ROLE_KEY &&
      !process.env.SUPABASE_SERVICE_ROLE_KEY.includes('your-supabase-service-role-key')
    ),
  },

  abdm: {
    apiKey: process.env.ABDM_API_KEY || '',
    clientId: process.env.ABDM_CLIENT_ID || '',
    clientSecret: process.env.ABDM_CLIENT_SECRET || '',
    baseUrl: process.env.ABDM_BASE_URL || 'https://dev.abdm.gov.in/gateway',
    isConfigured: Boolean(
      process.env.ABDM_CLIENT_ID &&
      process.env.ABDM_CLIENT_SECRET
    ),
  },

  payment: {
    provider: (process.env.PAYMENT_PROVIDER || 'mock').toLowerCase(),
    keyId: process.env.PAYMENT_PROVIDER_KEY || process.env.RAZORPAY_KEY_ID || '',
    keySecret: process.env.PAYMENT_PROVIDER_SECRET || process.env.RAZORPAY_KEY_SECRET || '',
    webhookSecret: process.env.PAYMENT_WEBHOOK_SECRET || process.env.RAZORPAY_WEBHOOK_SECRET || '',
    isConfigured: Boolean(
      (process.env.PAYMENT_PROVIDER_KEY || process.env.RAZORPAY_KEY_ID) &&
      (process.env.PAYMENT_PROVIDER_SECRET || process.env.RAZORPAY_KEY_SECRET)
    )
  }
};

module.exports = environment;
