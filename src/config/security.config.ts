export const SECURITY_CONFIG = {
  jwt: {
    secretEnv: 'JWT_SECRET',
    defaultSecret: process.env.JWT_SECRET || 'change_this_secret',
    accessExpiresIn: '30m',
    refreshExpiresIn: '7d',
  },
  cookie: {
    refresh: {
      name: 'refreshToken',
      options: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      },
    },
  },
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  },
  auth: {
    maxDevices: Number(process.env.MAX_DEVICES) || 3,
  },
};
