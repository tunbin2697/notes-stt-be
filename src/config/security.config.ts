export const SECURITY_CONFIG = {
  jwt: {
    defaultSecret: process.env.JWT_SECRET || 'change_this_secret',
    accessExpiresIn: '10m',
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
  otp: {
    expiresInSeconds: Number(process.env.OTP_EXPIRES_IN_SECONDS) || 60, // 60 seconds default
  },
  password: {
    // Regex must be defined as a string for configuration
    REGEX_PATTERN: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).*$',
    // Note: Escaped backslashes are necessary when defining a regex as a string.
    MIN_LENGTH: 8,
    MESSAGE: 'Password must contain uppercase, lowercase, and a number.',
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
  },
};
