# GraphQL API Documentation for Frontend

## ✅ Setup Status

Your GraphQL backend is properly configured for frontend consumption with the following features:

### 1. **CORS Configuration** ✅

- **Enabled**: Yes
- **Credentials**: Supported (cookies work)
- **Allowed Headers**: `Content-Type`, `Authorization`
- **Allowed Methods**: `GET`, `POST`, `PUT`, `DELETE`, `OPTIONS`
- **Origin Whitelist**: Configured in `SECURITY_CONFIG`

### 2. **GraphQL Playground** ✅

- **Enabled**: In development mode
- **URL**: `http://localhost:3000/graphql`
- **Introspection**: Enabled (for development)

### 3. **Auto-Generated Schema** ✅

- **File**: `schema.gql` (auto-generated)
- **Type Safety**: Full TypeScript types available

### 4. **Error Handling** ✅

- **Production Mode**: Clean errors with minimal info
- **Format**: `{ message, extensions: { statusCode, errorType } }`
- **Security**: Stack traces hidden in production

---

## 🔐 Authentication Flow

### 1. **Register**

```graphql
mutation Register {
  register(email: "user@example.com", password: "SecurePass123!")
}
```

**Response:**

```json
{
  "data": {
    "register": true
  }
}
```

### 2. **Login**

```graphql
mutation Login {
  login(email: "user@example.com", password: "SecurePass123!") {
    accessToken
  }
}
```

**Response:**

```json
{
  "data": {
    "login": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
}
```

**Side Effect:**

- Sets `refreshToken` as HttpOnly cookie (automatic)

### 3. **Refresh Token**

```graphql
mutation Refresh {
  refresh {
    accessToken
  }
}
```

**Requirements:**

- Must send cookies (credentials: 'include')
- refreshToken cookie must be present

### 4. **Logout**

```graphql
mutation Logout {
  logout
}
```

**Headers Required:**

```
Authorization: Bearer <access-token>
```

---

## 👤 User Profile Operations

### 1. **Get My Profile** (Authenticated)

```graphql
query GetMyProfile {
  getMyProfile {
    id
    accountId
    fullName
    phone
    location
    avatar
    bio
    email
    role
    createdAt
    updatedAt
  }
}
```

**Headers Required:**

```
Authorization: Bearer <access-token>
```

**Response:**

```json
{
  "data": {
    "getMyProfile": {
      "id": 1,
      "accountId": 1,
      "fullName": "John Doe",
      "phone": "+1234567890",
      "location": "New York, USA",
      "avatar": "https://example.com/avatar.jpg",
      "bio": "Software Developer",
      "email": "user@example.com",
      "role": "USER",
      "createdAt": "2025-10-15T10:30:00Z",
      "updatedAt": "2025-10-15T12:00:00Z"
    }
  }
}
```

### 2. **Update My Profile** (Authenticated)

```graphql
mutation UpdateProfile {
  updateMyProfile(
    input: {
      fullName: "Jane Smith"
      phone: "+9876543210"
      location: "San Francisco, USA"
      avatar: "https://example.com/new-avatar.jpg"
      bio: "Full Stack Engineer"
    }
  ) {
    id
    fullName
    phone
    location
    avatar
    bio
    updatedAt
  }
}
```

**Headers Required:**

```
Authorization: Bearer <access-token>
```

**Partial Update (Optional Fields):**

```graphql
mutation UpdatePartial {
  updateMyProfile(input: { fullName: "New Name" }) {
    id
    fullName
    updatedAt
  }
}
```

### 3. **Get User Email by ID** (Public)

```graphql
query GetUserEmail {
  getUserEmail(id: 1)
}
```

**Response:**

```json
{
  "data": {
    "getUserEmail": "user@example.com"
  }
}
```

---

## 🌐 Frontend Integration Examples

### **Using Fetch (with credentials)**

```javascript
// Login
const login = async (email, password) => {
  const response = await fetch('http://localhost:3000/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Important: Send/receive cookies
    body: JSON.stringify({
      query: `
        mutation Login($email: String!, $password: String!) {
          login(email: $email, password: $password) {
            accessToken
          }
        }
      `,
      variables: { email, password },
    }),
  });

  const { data } = await response.json();

  // Store access token in localStorage or state
  localStorage.setItem('accessToken', data.login.accessToken);

  return data.login.accessToken;
};

// Get Profile (Authenticated)
const getProfile = async () => {
  const accessToken = localStorage.getItem('accessToken');

  const response = await fetch('http://localhost:3000/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`, // Include access token
    },
    credentials: 'include', // Include cookies for potential refresh
    body: JSON.stringify({
      query: `
        query GetMyProfile {
          getMyProfile {
            id
            fullName
            email
            role
            avatar
            bio
          }
        }
      `,
    }),
  });

  const { data } = await response.json();
  return data.getMyProfile;
};

// Update Profile
const updateProfile = async (profileData) => {
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
        mutation UpdateProfile($input: UpdateProfileInput!) {
          updateMyProfile(input: $input) {
            id
            fullName
            phone
            location
            avatar
            bio
            updatedAt
          }
        }
      `,
      variables: { input: profileData },
    }),
  });

  const { data } = await response.json();
  return data.updateMyProfile;
};
```

### **Using Apollo Client**

```javascript
import { ApolloClient, InMemoryCache, createHttpLink, gql } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

// HTTP Link
const httpLink = createHttpLink({
  uri: 'http://localhost:3000/graphql',
  credentials: 'include', // Send cookies
});

// Auth Link (add access token to headers)
const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('accessToken');
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    }
  }
});

// Create Apollo Client
const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache()
});

// Login Mutation
const LOGIN = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      accessToken
    }
  }
`;

// Get Profile Query
const GET_MY_PROFILE = gql`
  query GetMyProfile {
    getMyProfile {
      id
      fullName
      email
      role
      avatar
      bio
      createdAt
      updatedAt
    }
  }
`;

// Update Profile Mutation
const UPDATE_PROFILE = gql`
  mutation UpdateProfile($input: UpdateProfileInput!) {
    updateMyProfile(input: $input) {
      id
      fullName
      phone
      location
      avatar
      bio
      updatedAt
    }
  }
`;

// Usage in React component
const MyComponent = () => {
  const [login] = useMutation(LOGIN);
  const { data, loading, error } = useQuery(GET_MY_PROFILE);
  const [updateProfile] = useMutation(UPDATE_PROFILE);

  const handleLogin = async () => {
    const { data } = await login({
      variables: {
        email: 'user@example.com',
        password: 'SecurePass123!'
      }
    });
    localStorage.setItem('accessToken', data.login.accessToken);
  };

  const handleUpdateProfile = async () => {
    await updateProfile({
      variables: {
        input: {
          fullName: 'New Name',
          bio: 'Updated bio'
        }
      }
    });
  };

  return (
    // Your component JSX
  );
};
```

---

## 🔑 Authentication Requirements

### **Public Endpoints** (No Auth Required)

- `health` - Health check
- `register` - User registration
- `login` - User login
- `refresh` - Refresh access token (requires refresh cookie)
- `getUserEmail(id)` - Get user email by ID

### **Protected Endpoints** (Require Authorization Header)

- `getMyProfile` - Get current user's profile
- `updateMyProfile` - Update current user's profile
- `logout` - Logout current user

**Authorization Header Format:**

```
Authorization: Bearer <access-token>
```

---

## 🍪 Cookie Handling

### **Refresh Token Cookie**

- **Name**: `refreshToken`
- **Type**: HttpOnly (JavaScript cannot access)
- **SameSite**: `lax`
- **Secure**: `true` in production, `false` in development
- **Path**: `/`
- **Max-Age**: 7 days

### **Frontend Requirements**

1. Always use `credentials: 'include'` in fetch/axios
2. Configure Apollo Client with `credentials: 'include'`
3. Store access token in localStorage or memory
4. Refresh token is handled automatically via cookies

---

## ⚠️ Error Handling

### **Error Response Format**

```json
{
  "errors": [
    {
      "message": "Invalid credentials",
      "extensions": {
        "statusCode": 400,
        "errorType": "BusinessRuleException"
      }
    }
  ]
}
```

### **Common Error Codes**

- `400` - Bad Request (BusinessRuleException)
- `401` - Unauthorized (Missing/invalid token)
- `403` - Forbidden (Insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

### **Frontend Error Handling Example**

```javascript
try {
  const response = await fetch('http://localhost:3000/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    credentials: 'include',
    body: JSON.stringify({ query, variables }),
  });

  const result = await response.json();

  if (result.errors) {
    const error = result.errors[0];
    const statusCode = error.extensions?.statusCode;

    if (statusCode === 401) {
      // Token expired, try refresh
      await refreshToken();
      // Retry request
    } else if (statusCode === 400) {
      // Business rule violation
      alert(error.message);
    }
  }

  return result.data;
} catch (error) {
  console.error('Network error:', error);
}
```

---

## ✅ Checklist for Frontend Integration

- [x] GraphQL endpoint configured: `http://localhost:3000/graphql`
- [x] CORS enabled with credentials support
- [x] Auto-generated schema available at `schema.gql`
- [x] GraphQL Playground available for testing
- [x] Authentication flow complete (register/login/refresh/logout)
- [x] Profile queries and mutations working
- [x] Error handling with proper status codes
- [x] Cookie-based refresh token implemented
- [x] Bearer token authentication for protected routes
- [ ] Frontend needs to set correct CORS origin in backend config
- [ ] Frontend needs to implement token refresh logic
- [ ] Frontend needs to handle 401 errors and retry

---

## 🚀 Next Steps

1. **Configure CORS origin** in your backend `.env` or config:

   ```
   CORS_ORIGIN=http://localhost:5173
   ```

2. **Test all endpoints** using GraphQL Playground at `http://localhost:3000/graphql`

3. **Implement frontend auth flow**:
   - Login → Store access token
   - Add Bearer token to requests
   - Handle 401 → Refresh token → Retry
   - Logout → Clear tokens

4. **Implement profile management**:
   - Fetch profile on app load
   - Update profile form
   - Display user info

5. **Error handling**:
   - Show user-friendly error messages
   - Handle network errors
   - Implement retry logic

---

## 📝 TypeScript Types (Optional)

You can generate TypeScript types from the GraphQL schema using tools like:

- `graphql-codegen` - Auto-generate TypeScript types from schema
- `apollo-client` codegen plugin

Example `codegen.yml`:

```yaml
schema: http://localhost:3000/graphql
documents: './src/**/*.graphql'
generates:
  ./src/generated/graphql.ts:
    plugins:
      - typescript
      - typescript-operations
      - typescript-react-apollo
```

This will give you full type safety in your frontend! 🎉
