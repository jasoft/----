# E2E Authentication Caching

## Overview

This system implements a 24-hour caching mechanism for Clerk authentication in E2E tests to significantly reduce test setup time by avoiding unnecessary authentication calls.

## Performance Improvement

- **Without cache**: ~15-20 seconds for authentication setup
- **With cache**: ~500ms for authentication setup  
- **Performance gain**: ~97% faster setup time

## How It Works

1. **First Run**: Performs full Clerk authentication and saves authentication data to cache
2. **Subsequent Runs**: Checks if cached authentication is valid (< 24 hours old) and reuses it
3. **Cache Expiry**: After 24 hours, automatically performs fresh authentication and updates cache

## Cache Files

The following files are created in `e2e/.auth/`:

- `auth-cache.json` - Contains cached authentication data with timestamp
- `state.json` - Playwright storage state (existing file)
- `user-info.json` - User information (existing file)

All cache files are automatically added to `.gitignore` to prevent committing sensitive data.

## Usage

### Normal Usage
```bash
# Run E2E tests - will use cache if valid
npm run test:e2e
```

### Force Cache Refresh
```bash
# Clear cache and perform fresh authentication
CLEAR_AUTH_CACHE=true npm run test:e2e
```

### Manual Cache Management
```bash
# Clear cache manually
rm e2e/.auth/auth-cache.json

# Run setup only
npx playwright test --project="setup clerk"
```

## Cache Structure

The `auth-cache.json` file contains:

```json
{
  "timestamp": 1749100843892,
  "userId": "user_2x4JFHTkMIcPAmaLrHcgJvkvXpP",
  "userInfo": {
    "userId": "user_2x4JFHTkMIcPAmaLrHcgJvkvXpP"
  },
  "hasValidState": true
}
```

## Environment Variables

- `CLEAR_AUTH_CACHE=true` - Forces cache clearing before authentication
- `TEST_USER_NAME` - Clerk test user identifier (required)
- `TEST_USER_PASSWORD` - Clerk test user password (required)

## Troubleshooting

### Cache Not Working
1. Check if `e2e/.auth/auth-cache.json` exists
2. Verify cache timestamp is less than 24 hours old
3. Ensure `e2e/.auth/state.json` exists and is valid

### Force Fresh Authentication
```bash
CLEAR_AUTH_CACHE=true npx playwright test --project="setup clerk"
```

### Authentication Errors
If authentication fails, the system automatically falls back to fresh login without cache.

## Security Notes

- All authentication cache files are excluded from version control
- Cache files contain sensitive authentication tokens
- Cache automatically expires after 24 hours for security
- Never commit cache files to the repository

## Implementation Details

The caching logic is implemented in `e2e/global.setup.ts` with the following functions:

- `isCacheValid()` - Checks if cache exists and is not expired
- `saveAuthCache()` - Saves authentication data to cache
- `loadCachedUserInfo()` - Loads user info from cache
- `clearAuthCache()` - Manually clears cache files
