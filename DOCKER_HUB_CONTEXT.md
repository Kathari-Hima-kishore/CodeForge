# Docker Hub Integration - Development Context

## Overview
This document describes all the work done to implement Docker Hub integration in CodeForge, enabling users to build container images and push them to Docker Hub.

---

## Problem Statement
Users needed a way to deploy their CodeForge projects as Docker containers to Docker Hub. This required:
1. Fetching existing Docker Hub repositories
2. Allowing users to select or create repositories
3. Building Docker images
4. Pushing images to Docker Hub

---

## Implementation Details

### Phase 1: Initial Docker Hub Endpoint
**Files Modified:** `backend/index.js`

Created initial endpoint to fetch Docker Hub repositories:
- Endpoint: `GET /api/dockerhub/repos`
- Authentication using deprecated `/v2/users/login/` endpoint
- Listed repositories for authenticated user

### Phase 2: Docker Hub Credentials Support
**Files Modified:** `frontend/src/components/ide/header.tsx`

Added frontend UI for Docker Hub deployment:
- Added state variables for Docker Hub credentials (username, password)
- Added "Fetch Repositories" button
- Added dropdown to select existing repositories
- Added custom repository name input
- Modified build request to include Docker Hub credentials

### Phase 3: Repository Creation Support
**Files Modified:** `backend/index.js`

Added functions to check and create repositories:
- `checkDockerHubRepository()` - Checks if repository exists
- `createDockerHubRepository()` - Creates repository if not exists
- Modified build endpoint to auto-create repo before pushing

### Phase 4: Fixing Authentication Issues
**Files Modified:** `backend/index.js`, `frontend/src/components/ide/header.tsx`

**Issue 1: Username vs Email**
- Docker Hub API requires username, not email
- Added email-to-username resolution via `/v2/users/{identifier}` endpoint
- Updated UI to clarify "Docker Hub Username or Email"

**Issue 2: Deprecated API**
- Old `/v2/users/login/` endpoint was returning 401
- Updated to new `/v2/auth/token` endpoint
- Changed request body from `{ username, password }` to `{ identifier, secret }`
- Changed Authorization header from `JWT {token}` to `Bearer {token}`

**Issue 3: HTTP Response Handling**
- Fixed HTTP response data not being collected properly
- Added proper `data` accumulation using `res.on('data', ...)`

**Issue 4: Variable Naming**
- Changed query parameter from `username` to `identifier` for flexibility
- Fixed variable scope issues with `resolvedIdentifier`

### Phase 5: Personal Access Token (PAT) Support
**Files Modified:** `backend/index.js`, `frontend/src/components/ide/header.tsx`

- Updated authentication to support both password and PAT
- Added clearer error messages mentioning PAT option
- Added link to Docker Hub security settings

---

## Current API Endpoints

### GET /api/dockerhub/repos
Fetches user's Docker Hub repositories.

**Query Parameters:**
- `identifier` - Docker Hub username or email
- `password` - Password or Personal Access Token (PAT)

**Response:**
```json
{
  "repos": [
    { "name": "repo1", "description": "...", "isPrivate": false, "pulls": 100 }
  ],
  "username": "actual-username",
  "error": null
}
```

### POST /api/build-container
Builds and deploys container image.

**Key Features:**
- Accepts `dockerHubRepo` parameter to specify target repository
- Auto-creates repository if it doesn't exist
- Supports Docker Hub and cloud deployment options

---

## Frontend Components

### IdeHeader Component (`header.tsx`)
State variables added:
- `dockerHubUsername` / `dockerHubPassword` - Credentials
- `dockerHubRepos` - List of user's repositories
- `selectedDockerHubRepo` - Selected repository from dropdown
- `dockerHubCustomRepo` - Custom repository name input
- `dockerHubActualUsername` - Resolved username from Docker Hub
- `isLoadingDockerHubRepos` - Loading state
- `dockerHubReposError` - Error message

Functions:
- `fetchDockerHubRepos()` - Fetches repositories from Docker Hub API

---

## Supported Authentication Methods

| Username | Password | Works? |
|----------|----------|--------|
| ✅ | ✅ (password) | ❌ (deprecated) |
| ✅ | ✅ (PAT) | ✅ |
| ✅ (email) | ✅ (password) | ❌ (deprecated) |
| ✅ (email) | ✅ (PAT) | ✅ |

**Note:** Docker Hub deprecated password authentication. Personal Access Token (PAT) is required.

---

## Testing Checklist

- [x] Username + PAT authentication
- [x] Email + PAT authentication  
- [x] Fetch existing repositories
- [x] Select from dropdown
- [x] Enter custom repository name
- [ ] Build and push image (needs testing with actual project)

---

## Known Issues

1. **Pre-existing TypeScript errors** in:
   - `chat-panel.tsx` - ChatMessage type missing userId
   - `session-dialog.tsx` - className prop issue

---

## Files Modified

| File | Changes |
|------|---------|
| `backend/index.js` | Docker Hub API endpoints, auth functions, build integration |
| `frontend/src/components/ide/header.tsx` | Docker Hub UI, state management, API calls |
| `AGENTS.md` | Documentation updated |

---

## How to Test

1. Start backend: `cd backend && npm run dev`
2. Start frontend: `cd frontend && npm run dev`
3. Create/open a project in CodeForge
4. Click Export → Docker Hub
5. Enter Docker Hub username/email and PAT
6. Click "Fetch Repositories"
7. Select repository or enter custom name
8. Click "Build & Deploy"

---

## References

- Docker Hub API: https://docs.docker.com/reference/api/hub/latest/
- Create PAT: https://hub.docker.com/settings/security

---

*Last Updated: 2026-03-04*
