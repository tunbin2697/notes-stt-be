# Password Management Implementation Guide

## ✅ Features Added

1. **Change Password** (Authenticated users)
2. **Forgot Password** (Request OTP via email)
3. **Reset Password** (Using OTP code)
4. **Mock Email Service** (Logs OTP to console)

---

## 🗄️ Database Migration Required

### Run Prisma Migration

```bash
# Generate and apply migration
npx prisma migrate dev --name add_password_reset

# Or if you prefer to run separately:
npx prisma generate
npx prisma migrate dev
```

This will create the `PasswordReset` table with:

- `id` - Auto-increment primary key
- `token` - The 6-digit OTP code (unique)
- `accountId` - Foreign key to Account
- `expiresAt` - Expiration timestamp (10 minutes)
- `used` - Boolean flag (prevents reuse)
- `createdAt` - Timestamp when OTP was created

---

## 🔐 GraphQL API Usage

### 1. Change Password (Authenticated)

**Requires:** Bearer token in Authorization header

```graphql
mutation ChangePassword {
  changePassword(
    input: { currentPassword: "OldPass123!", newPassword: "NewSecurePass456!" }
  )
}
```

**Response:**

```json
{
  "data": {
    "changePassword": true
  }
}
```

**What happens:**

- ✅ Verifies current password
- ✅ Updates password (hashed with bcrypt)
- ✅ Sends password changed notification email (console)
- ✅ Revokes all refresh tokens (requires re-login on all devices)

**Errors:**

- `"Current password is incorrect"` - Wrong current password
- `"New password must be different from current password"` - Same password
- `401 Unauthorized` - Missing or invalid token

---

### 2. Forgot Password (Public)

**No authentication required**

```graphql
mutation ForgotPassword {
  forgotPassword(email: "user@example.com")
}
```

**Response:**

```json
{
  "data": {
    "forgotPassword": true
  }
}
```

**What happens:**

- ✅ Generates 6-digit OTP code
- ✅ Stores OTP in database (expires in 10 minutes)
- ✅ Invalidates any previous unused OTP codes
- ✅ Sends OTP via email (logged to console in development)
- ℹ️ Always returns `true` (even if email doesn't exist, for security)

**Console Output Example:**

```
========================================
📧 MOCK EMAIL - Password Reset OTP
========================================
To: user@example.com
Subject: Password Reset Code

Your password reset code is: 123456
This code will expire in 10 minutes.

Do not share this code with anyone.
========================================
```

---

### 3. Reset Password (Public)

**No authentication required**

```graphql
mutation ResetPassword {
  resetPassword(
    input: {
      email: "user@example.com"
      otp: "123456"
      newPassword: "NewSecurePass789!"
    }
  )
}
```

**Response:**

```json
{
  "data": {
    "resetPassword": true
  }
}
```

**What happens:**

- ✅ Validates OTP code (not expired, not used, matches email)
- ✅ Updates password (hashed with bcrypt)
- ✅ Marks OTP as used (prevents reuse)
- ✅ Sends password changed notification (console)
- ✅ Revokes all refresh tokens (requires re-login)

**Errors:**

- `"Invalid or expired reset code. Please request a new one."` - Wrong/expired OTP

---

## 🌐 Frontend Integration Examples

### **Complete Password Reset Flow**

```javascript
// 1. Request OTP
const requestPasswordReset = async (email) => {
  const response = await fetch('http://localhost:3000/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: `
        mutation ForgotPassword($email: String!) {
          forgotPassword(email: $email)
        }
      `,
      variables: { email },
    }),
  });

  const result = await response.json();

  if (result.data?.forgotPassword) {
    alert('OTP sent! Check the server console for the code.');
    return true;
  }

  return false;
};

// 2. User enters OTP from console (or email in production)
// 3. Reset password with OTP
const resetPassword = async (email, otp, newPassword) => {
  const response = await fetch('http://localhost:3000/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: `
        mutation ResetPassword($input: ResetPasswordInput!) {
          resetPassword(input: $input)
        }
      `,
      variables: {
        input: { email, otp, newPassword },
      },
    }),
  });

  const result = await response.json();

  if (result.errors) {
    alert(result.errors[0].message);
    return false;
  }

  if (result.data?.resetPassword) {
    alert('Password reset successful! Please login with your new password.');
    return true;
  }

  return false;
};

// Usage example:
const handleForgotPassword = async () => {
  const email = prompt('Enter your email:');
  await requestPasswordReset(email);

  // Show OTP input form
  const otp = prompt('Enter the 6-digit code from the console:');
  const newPassword = prompt('Enter your new password:');

  await resetPassword(email, otp, newPassword);
};
```

### **Change Password (Authenticated Users)**

```javascript
const changePassword = async (currentPassword, newPassword) => {
  const accessToken = localStorage.getItem('accessToken');

  const response = await fetch('http://localhost:3000/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    credentials: 'include',
    body: JSON.stringify({
      query: `
        mutation ChangePassword($input: ChangePasswordInput!) {
          changePassword(input: $input)
        }
      `,
      variables: {
        input: { currentPassword, newPassword },
      },
    }),
  });

  const result = await response.json();

  if (result.errors) {
    alert(result.errors[0].message);
    return false;
  }

  if (result.data?.changePassword) {
    alert('Password changed successfully! You will be logged out.');
    // Clear tokens and redirect to login
    localStorage.removeItem('accessToken');
    window.location.href = '/login';
    return true;
  }

  return false;
};
```

---

## 🔒 Security Features

### **Change Password**

- ✅ Requires authentication (Bearer token)
- ✅ Verifies current password before allowing change
- ✅ Prevents using same password as new password
- ✅ Revokes all refresh tokens (forces re-login on all devices)
- ✅ Sends notification email

### **Forgot/Reset Password**

- ✅ No authentication required (user forgot password)
- ✅ OTP expires after 10 minutes
- ✅ OTP can only be used once
- ✅ Previous unused OTPs are invalidated when requesting new one
- ✅ Does not reveal if email exists (returns success regardless)
- ✅ Revokes all refresh tokens after reset
- ✅ Sends notification email after password change

### **Password Hashing**

- ✅ All passwords hashed with bcrypt (salt rounds: 10)
- ✅ Passwords never stored in plaintext
- ✅ Passwords never returned in API responses

---

## 📧 Email Service

### **Current Implementation (Development)**

- Logs OTP codes to server console
- Logs password change notifications to console
- No actual emails sent

### **Console Output Format**

**OTP Email:**

```
========================================
📧 MOCK EMAIL - Password Reset OTP
========================================
To: user@example.com
Subject: Password Reset Code

Your password reset code is: 123456
This code will expire in 10 minutes.

Do not share this code with anyone.
========================================
```

**Password Changed Notification:**

```
========================================
📧 MOCK EMAIL - Password Changed
========================================
To: user@example.com
Subject: Your password has been changed

Your password was successfully changed.
If you did not make this change, please contact support immediately.
========================================
```

### **Production Implementation (Future)**

Replace `EmailService` with real email provider:

```typescript
// src/common/services/email.service.ts
import { Injectable } from '@nestjs/common';
import * as sgMail from '@sendgrid/mail'; // Example: SendGrid
// OR
import * as AWS from 'aws-sdk'; // Example: AWS SES

@Injectable()
export class EmailService {
  constructor() {
    // Initialize email service
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    // OR
    // AWS.config.update({ region: process.env.AWS_REGION });
  }

  async sendPasswordResetOTP(email: string, otp: string): Promise<void> {
    const msg = {
      to: email,
      from: 'noreply@yourdomain.com',
      subject: 'Password Reset Code',
      html: `
        <h2>Password Reset Code</h2>
        <p>Your password reset code is: <strong>${otp}</strong></p>
        <p>This code will expire in 10 minutes.</p>
        <p>Do not share this code with anyone.</p>
      `,
    };

    await sgMail.send(msg);
  }

  async sendPasswordChangedNotification(email: string): Promise<void> {
    const msg = {
      to: email,
      from: 'noreply@yourdomain.com',
      subject: 'Your password has been changed',
      html: `
        <h2>Password Changed</h2>
        <p>Your password was successfully changed.</p>
        <p>If you did not make this change, please contact support immediately.</p>
      `,
    };

    await sgMail.send(msg);
  }

  generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}
```

---

## 🧪 Testing the Flow

### **Test in GraphQL Playground**

1. **Start the server:**

   ```bash
   npm run start:dev
   ```

2. **Open GraphQL Playground:**

   ```
   http://localhost:3000/graphql
   ```

3. **Test Forgot Password:**

   ```graphql
   mutation {
     forgotPassword(email: "test@example.com")
   }
   ```

4. **Check server console** for OTP code (6 digits)

5. **Test Reset Password:**

   ```graphql
   mutation {
     resetPassword(
       input: {
         email: "test@example.com"
         otp: "123456"
         newPassword: "NewPass123!"
       }
     )
   }
   ```

6. **Test Login with new password:**

   ```graphql
   mutation {
     login(email: "test@example.com", password: "NewPass123!") {
       accessToken
     }
   }
   ```

7. **Test Change Password (use access token in HTTP Headers):**

   **HTTP Headers:**

   ```json
   {
     "Authorization": "Bearer <your-access-token>"
   }
   ```

   **Mutation:**

   ```graphql
   mutation {
     changePassword(
       input: { currentPassword: "NewPass123!", newPassword: "AnotherPass456!" }
     )
   }
   ```

---

## ⚠️ Important Notes

1. **Database Migration Required:**
   - Run `npx prisma migrate dev --name add_password_reset` before testing

2. **OTP Expiration:**
   - OTPs expire after 10 minutes
   - Used OTPs cannot be reused
   - Requesting new OTP invalidates previous unused OTPs

3. **Session Management:**
   - Both `changePassword` and `resetPassword` revoke ALL refresh tokens
   - Users must re-login after password change/reset on all devices

4. **Email in Development:**
   - Check server console for OTP codes
   - No actual emails are sent

5. **Email in Production:**
   - Replace `EmailService` with real email provider (SendGrid, AWS SES, etc.)
   - Set up email templates
   - Configure email credentials in environment variables

---

## 📝 Schema Updates

The GraphQL schema now includes:

```graphql
# New Input Types
input ChangePasswordInput {
  currentPassword: String!
  newPassword: String!
}

input ResetPasswordInput {
  email: String!
  otp: String!
  newPassword: String!
}

# New Mutations
type Mutation {
  # ... existing mutations
  changePassword(input: ChangePasswordInput!): Boolean!
  forgotPassword(email: String!): Boolean!
  resetPassword(input: ResetPasswordInput!): Boolean!
}
```

---

## ✅ Checklist

- [x] Prisma schema updated with `PasswordReset` model
- [x] Database migration created
- [x] `EmailService` implemented (mock for development)
- [x] `changePassword` mutation added (authenticated)
- [x] `forgotPassword` mutation added (public)
- [x] `resetPassword` mutation added (public)
- [x] OTP generation (6 digits)
- [x] OTP expiration (10 minutes)
- [x] OTP reuse prevention
- [x] Password hashing with bcrypt
- [x] Refresh token revocation on password change
- [x] Email notifications (console logs)
- [ ] Run database migration
- [ ] Test all endpoints
- [ ] Replace mock email service with real provider (for production)

---

Your password management system is now complete and ready for testing! 🎉
