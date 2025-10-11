export const SECURITY_CONFIG = {
  jwt: {
    secretEnv: 'JWT_SECRET',
    defaultSecret: process.env.JWT_SECRET || 'change_this_secret',
    accessExpiresIn: '30m',
    refreshExpiresIn: '7d',
  },
  cookie: {
    refresh: {
      name: '__Host-refreshToken',
      options: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      },
    },
  },
};
