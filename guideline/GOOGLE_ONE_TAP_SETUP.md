# Google One Tap Authentication Setup

This guide explains how to set up and use Google One Tap sign-in for your application.

## Backend Setup

### 1. Environment Variables

Add the following to your `.env` file:

```env
GOOGLE_CLIENT_ID=your-google-client-id-here.apps.googleusercontent.com
```

**How to get Google Client ID:**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable "Google+ API" or "Google Identity Services"
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Configure OAuth consent screen if prompted
6. Select "Web application" as application type
7. Add authorized JavaScript origins:
   - `http://localhost:3000` (for development)
   - `https://notes-stt.baokhangdev.click` (for production)
8. Add authorized redirect URIs (not required for One Tap, but useful):
   - `http://localhost:3000/auth/callback`
   - `https://notes-stt.baokhangdev.click/auth/callback`
9. Copy the Client ID

### 2. GraphQL API

The backend now supports Google One Tap authentication via GraphQL:

**Mutation:**

```graphql
mutation GoogleAuth($input: GoogleAuthInput!) {
  googleAuth(input: $input) {
    accessToken
  }
}
```

**Input:**

```json
{
  "input": {
    "idToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjE4MmU0MmVlOTc3Z..."
  }
}
```

**What it does:**

- ✅ Verifies the Google ID token
- ✅ If user exists: Logs them in
- ✅ If user is new: Creates account + profile automatically
- ✅ Returns access token + sets refresh token cookie

## Frontend Implementation

You can implement **BOTH** Google One Tap (automatic popup) AND a traditional "Sign in with Google" button. Users can choose to use either one or both.

### Implementation Options

**Option 1: One Tap Only** - Automatic popup when page loads
**Option 2: Button Only** - Manual button on login page
**Option 3: Both** ⭐ Recommended - One Tap + fallback button

### 1. Install Google Identity Services

Add this to your HTML `<head>`:

```html
<script src="https://accounts.google.com/gsi/client" async defer></script>
```

### 2. Complete Implementation (One Tap + Button)

**React Example:**

```tsx
import { useEffect } from 'react';
import { useMutation } from '@apollo/client';
import { GOOGLE_AUTH_MUTATION } from './graphql/mutations';

function LoginPage() {
  const [googleAuth, { loading }] = useMutation(GOOGLE_AUTH_MUTATION);

  useEffect(() => {
    if (window.google) {
      // Initialize Google Identity Services
      window.google.accounts.id.initialize({
        client_id: 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com',
        callback: handleGoogleResponse,
        auto_select: false, // Set true to auto-login returning users
        cancel_on_tap_outside: false,
      });

      // OPTION 1: Show One Tap prompt (automatic popup)
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed()) {
          console.log(
            'One Tap not displayed:',
            notification.getNotDisplayedReason(),
          );
          // One Tap was not displayed, button is the fallback
        }
        if (notification.isSkippedMoment()) {
          console.log('One Tap skipped:', notification.getSkippedReason());
        }
        if (notification.isDismissedMoment()) {
          console.log('One Tap dismissed:', notification.getDismissedReason());
        }
      });

      // OPTION 2: Render the "Sign in with Google" button
      window.google.accounts.id.renderButton(
        document.getElementById('googleSignInButton'),
        {
          type: 'standard', // or 'icon'
          size: 'large', // small, medium, large
          theme: 'outline', // outline, filled_blue, filled_black
          text: 'signin_with', // signin_with, signup_with, continue_with, signin
          shape: 'rectangular', // rectangular, pill, circle, square
          logo_alignment: 'left', // left, center
          width: 300, // Custom width in pixels
        },
      );
    }
  }, []);

  const handleGoogleResponse = async (response) => {
    try {
      const { data } = await googleAuth({
        variables: {
          input: {
            idToken: response.credential, // Google ID token
          },
        },
      });

      const { accessToken } = data.googleAuth;

      // Store access token
      localStorage.setItem('accessToken', accessToken);

      // Refresh token is automatically set as httpOnly cookie

      // Redirect to dashboard
      window.location.href = '/dashboard';
    } catch (error) {
      console.error('Google auth failed:', error);
      alert('Google sign-in failed. Please try again.');
    }
  };

  return (
    <div className="login-page">
      <h1>Sign In</h1>

      {/* Traditional email/password form */}
      <form onSubmit={handleEmailLogin}>
        <input type="email" placeholder="Email" />
        <input type="password" placeholder="Password" />
        <button type="submit">Sign In</button>
      </form>

      {/* Divider */}
      <div className="divider">
        <span>OR</span>
      </div>

      {/* Google Sign In Button */}
      <div
        id="googleSignInButton"
        style={{ display: 'flex', justifyContent: 'center' }}
      ></div>

      {loading && <p>Signing in...</p>}
    </div>
  );
}
```

### 3. Choose Your Implementation Strategy

#### Strategy A: One Tap + Button (Recommended) ✅

**Best for:** Maximum conversions + user choice

```tsx
useEffect(() => {
  window.google.accounts.id.initialize({...});

  // Show One Tap on page load
  window.google.accounts.id.prompt();

  // Also render button as fallback
  window.google.accounts.id.renderButton(
    document.getElementById('googleSignInButton'),
    { theme: 'outline', size: 'large' }
  );
}, []);
```

**User Experience:**

- One Tap appears automatically (if user hasn't dismissed it before)
- If user dismisses One Tap, button is still available
- User can click button anytime

#### Strategy B: Button Only

**Best for:** Login pages where you want manual control

```tsx
useEffect(() => {
  window.google.accounts.id.initialize({...});

  // Only render button, no automatic popup
  window.google.accounts.id.renderButton(
    document.getElementById('googleSignInButton'),
    { theme: 'filled_blue', size: 'large', text: 'signin_with' }
  );
}, []);
```

**User Experience:**

- No automatic popup
- User must click button to sign in
- More traditional login flow

#### Strategy C: One Tap Only

**Best for:** Landing pages, quick auth flows

```tsx
useEffect(() => {
  window.google.accounts.id.initialize({...});

  // Only show One Tap, no button
  window.google.accounts.id.prompt();
}, []);
```

**User Experience:**

- One Tap appears automatically
- If dismissed, no other Google sign-in option
- Minimalist approach

### 4. Button Customization Options

```tsx
window.google.accounts.id.renderButton(buttonElement, {
  // Button type
  type: 'standard', // or 'icon' (just the Google icon)

  // Button size
  size: 'large', // 'small', 'medium', 'large'

  // Button theme
  theme: 'outline', // 'outline', 'filled_blue', 'filled_black'

  // Button text
  text: 'signin_with', // 'signin_with', 'signup_with', 'continue_with', 'signin'

  // Button shape
  shape: 'rectangular', // 'rectangular', 'pill', 'circle', 'square'

  // Logo alignment
  logo_alignment: 'left', // 'left', 'center'

  // Custom width (px)
  width: 300,

  // Locale
  locale: 'en_US', // 'en_US', 'es_ES', 'fr_FR', etc.
});
```

### 5. Control When One Tap Appears

```tsx
// Show One Tap only on certain pages
useEffect(() => {
  if (window.google && !isLoggedIn && isLoginPage) {
    window.google.accounts.id.initialize({...});
    window.google.accounts.id.prompt();
  }
}, [isLoggedIn, isLoginPage]);

// Cancel One Tap programmatically
const cancelOneTap = () => {
  window.google.accounts.id.cancel();
};

// Disable One Tap for this session
const disableOneTap = () => {
  window.google.accounts.id.disableAutoSelect();
};
```

### 6. Complete Login Page Example

```tsx
function LoginPage() {
  const [googleAuth] = useMutation(GOOGLE_AUTH_MUTATION);
  const [emailLogin] = useMutation(EMAIL_LOGIN_MUTATION);

  useEffect(() => {
    if (window.google) {
      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: handleGoogleResponse,
        auto_select: true, // Auto-login returning users
      });

      // Show One Tap
      window.google.accounts.id.prompt();

      // Render button
      window.google.accounts.id.renderButton(
        document.getElementById('googleSignInButton'),
        {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
          width: 300,
        }
      );
    }
  }, []);

  const handleGoogleResponse = async (response) => {
    try {
      const { data } = await googleAuth({
        variables: { input: { idToken: response.credential } }
      });

      localStorage.setItem('accessToken', data.googleAuth.accessToken);
      window.location.href = '/dashboard';
    } catch (error) {
      console.error('Google auth failed:', error);
    }
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    // Handle email/password login
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <h2 className="text-3xl font-bold text-center">Sign In</h2>

        {/* Email/Password Form */}
        <form onSubmit={handleEmailSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            className="w-full px-4 py-2 border rounded-lg"
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full px-4 py-2 border rounded-lg"
          />
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-lg"
          >
            Sign In
          </button>
        </form>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or continue with</span>
          </div>
        </div>

        {/* Google Sign In Button */}
        <div className="flex justify-center">
          <div id="googleSignInButton"></div>
        </div>

        {/* Links */}
        <div className="text-center space-y-2">
          <a href="/forgot-password" className="text-sm text-blue-600">
            Forgot password?
          </a>
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <a href="/register" className="text-blue-600">Sign up</a>
          </p>
        </div>
      </div>
    </div>
  );
}
      />
    </div>
  );
}
```

### 3. GraphQL Mutation

Create the mutation:

```typescript
// graphql/mutations.ts
import { gql } from '@apollo/client';

export const GOOGLE_AUTH_MUTATION = gql`
  mutation GoogleAuth($input: GoogleAuthInput!) {
    googleAuth(input: $input) {
      accessToken
    }
  }
`;
```

### 4. Vanilla JavaScript Example

```html
<!DOCTYPE html>
<html>
  <head>
    <script src="https://accounts.google.com/gsi/client" async defer></script>
  </head>
  <body>
    <div
      id="g_id_onload"
      data-client_id="YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com"
      data-context="signin"
      data-ux_mode="popup"
      data-callback="handleCredentialResponse"
      data-auto_prompt="false"
    ></div>

    <div
      class="g_id_signin"
      data-type="standard"
      data-size="large"
      data-theme="outline"
      data-text="sign_in_with"
      data-shape="rectangular"
      data-logo_alignment="left"
    ></div>

    <script>
      async function handleCredentialResponse(response) {
        // Send ID token to backend
        const res = await fetch('https://notes-stt.baokhangdev.click/graphql', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include', // Important for cookies
          body: JSON.stringify({
            query: `
            mutation GoogleAuth($input: GoogleAuthInput!) {
              googleAuth(input: $input) {
                accessToken
              }
            }
          `,
            variables: {
              input: {
                idToken: response.credential,
              },
            },
          }),
        });

        const data = await res.json();

        if (data.data?.googleAuth?.accessToken) {
          // Store access token
          localStorage.setItem('accessToken', data.data.googleAuth.accessToken);

          // Redirect to dashboard
          window.location.href = '/dashboard';
        }
      }
    </script>
  </body>
</html>
```

## How It Works

### Flow Diagram

```
User clicks "Sign in with Google"
          ↓
Google One Tap displays
          ↓
User selects Google account
          ↓
Google generates ID token
          ↓
Frontend sends ID token to backend
          ↓
Backend verifies token with Google
          ↓
Backend checks if user exists
          ↓
    ┌─────┴─────┐
    │           │
  Exists     New User
    │           │
    │      Create account
    │      + profile
    │           │
    └─────┬─────┘
          ↓
Generate access + refresh tokens
          ↓
Return access token
Set refresh token cookie
          ↓
Frontend stores access token
          ↓
User is authenticated!
```

### Security Features

✅ **Token Verification**: ID token verified with Google's servers
✅ **Audience Check**: Ensures token is for your app
✅ **Expiration Check**: Validates token hasn't expired
✅ **Auto Account Creation**: Seamless registration for new users
✅ **Profile Population**: Automatically sets name and avatar from Google
✅ **Refresh Token**: Set as httpOnly cookie for security
✅ **Access Token**: Short-lived (10 minutes) for API requests

## Testing

### Test the mutation in GraphQL Playground:

1. Get a test ID token from Google (you can use the frontend to generate one)
2. Run this mutation:

```graphql
mutation {
  googleAuth(input: { idToken: "YOUR_ID_TOKEN_HERE" }) {
    accessToken
  }
}
```

### Expected Response:

```json
{
  "data": {
    "googleAuth": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
}
```

## Troubleshooting

### "Invalid Google token"

- Check that GOOGLE_CLIENT_ID matches your frontend client ID
- Verify the ID token hasn't expired
- Ensure Google API is enabled in Cloud Console

### "Account with this email already exists"

- This shouldn't happen with `googleAuth` - it handles existing users
- If you see this, the user might have registered with email/password first
- The system will link the Google account to the existing account

### One Tap not showing

- Check authorized JavaScript origins in Google Cloud Console
- Verify `client_id` in frontend matches backend config
- Clear browser cookies/cache
- Check browser console for errors

### CORS errors

- Ensure frontend origin is in CORS_ORIGIN env variable
- Check that credentials: 'include' is set in fetch requests

## Production Checklist

- [ ] Set GOOGLE_CLIENT_ID in production .env
- [ ] Add production domain to Google Cloud Console authorized origins
- [ ] Set CORS_ORIGIN to production frontend URL
- [ ] Use HTTPS in production (required by Google)
- [ ] Test One Tap on production domain
- [ ] Monitor authentication logs

## Additional Features

The Google auth automatically:

- Creates user profile with Google name and avatar
- Links Google account to existing email if user already registered
- Supports multiple devices (refresh token management)
- Works with existing logout/refresh token flow

## API Reference

### Mutation: `googleAuth`

**Input:**

- `idToken` (String, required): Google ID token from One Tap

**Returns:**

- `accessToken` (String): JWT access token for API requests

**Side Effects:**

- Creates new account if user doesn't exist
- Creates profile with Google info (name, avatar)
- Sets httpOnly refresh token cookie

**Errors:**

- `"Invalid Google token"`: Token verification failed
- `"Maximum active devices reached"`: Too many active sessions
