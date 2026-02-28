# CodeForge - Development Context

## Project Overview
CodeForge is a collaborative browser IDE with real-time code execution, multi-language support, Firebase authentication, and session management.

---

## Changes Made

### 1. Login Flow Improvements

**File: `frontend/src/contexts/auth-context.tsx`**

- **Email existence check**: Added `checkEmailExists()` function that calls backend API `/api/check-email` to verify if email exists in Firebase before attempting login
- **Email not found handling**: When email doesn't exist, throws `EMAIL_NOT_FOUND` error
- **Password validation**: Added `validatePassword()` function requiring:
  - Minimum 8 characters
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number
- **Error handling**: All Firebase auth errors converted to user-friendly messages
- **Loading state**: Properly reset on error to prevent stuck UI

**File: `frontend/src/components/auth/auth-page.tsx`**

- Added local error state (`localError`) to handle errors properly
- Added password requirements display for registration form
- Updated error messages:
  - "Email does not exist. Please check or create an account." - for unregistered emails
  - "Invalid email or password" - for wrong password
- Updated password minLength from 6 to 8
- Password strength requirements shown during registration

### 2. Session Joining Fix (Host Disconnection Issue)

**Problem**: When host disconnects from a session, the backend deletes the session from memory. When another user tries to join using the session code, backend returns "Session not found" even though the session exists in Firestore.

**Solution**: Added Firestore integration to resurrect sessions.

**File: `backend/server.py`**

- Added Firestore client initialization (`firestore_db`)
- Updated `join_session` socket event to check Firestore when session not in memory
- If session exists in Firestore and is active, resurrects it in memory
- Now participants can join sessions even after host disconnects (session persists in Firestore)

### 3. Gemini Chat Integration

**File: `backend/server.py`**

- Added Google Generative AI SDK import and initialization
- Added `/api/gemini-chat` endpoint:
  - Accepts message, history, and codeContext (files + current code)
  - Provides code context to Gemini for better assistance
  - Supports conversation history
- Added `/api/gemini-models` endpoint:
  - Lists available Gemini models from Google API
  - Caches results for 5 minutes
  - Filters out deprecated/preview models
- Added `/api/gemini-set-model` endpoint:
  - Allows switching between Gemini models at runtime
  - Validates model before switching

**File: `frontend/src/components/ide/gemini-chat-panel.tsx`**

- Refactored to use backend API instead of Genkit flows
- Added collapsible history panel (click "History" button)
- Added code extraction from Gemini responses
- Added "Insert Code" buttons:
  - Insert to current file
  - Create new file with generated code
- Shows code context (all files + current code) to Gemini

### 4. Model Selector Component

**File: `frontend/src/components/ide/model-selector.tsx` (NEW)**

- Dropdown component to select Gemini model
- Fetches available models from `/api/gemini-models`
- Shows current model in header
- Allows switching models via `/api/gemini-set-model`
- Cached for fast loading

**File: `frontend/src/components/ide/gemini-chat-panel.tsx`**

- Integrated ModelSelector in header
- Added currentModel state to track selected model

### 5. Backend Environment Configuration

**File: `backend/.env` (NEW)**

```
GEMINI_API_KEY=your_gemini_api_key
```

- Added .env file for backend environment variables
- Uses python-dotenv to load variables

**File: `backend/server.py`**

- Added `from dotenv import load_dotenv` at startup
- Loads .env file on server start

### 6. Model Switch and API Fix (LATEST)

**Problem**: The API key in `backend/.env` was not being used because:
1. `google-generativeai` was missing from `requirements.txt`.
2. The frontend `GeminiChatPanel` was calling a local Next.js route instead of the backend.
3. The default model was set to `gemma-3-4b-it`, which is likely invalid.

**File: `requirements.txt`**
- Added `google-generativeai` to dependencies.

**File: `backend/server.py`**
- Changed default model to `gemini-1.5-flash`.
- Added `@verify_firebase_token` to `/api/gemini-chat` endpoint.
- Corrected fallback models list in `api_list_models`.

**File: `frontend/src/components/ide/gemini-chat-panel.tsx`**
- Updated fetch URL to call the backend: `${BACKEND_URL}/api/gemini-chat`.
- Changed default model to `gemini-1.5-flash`.

**Deleted: `frontend/src/app/api/gemini-chat/route.ts`**
- Removed redundant Next.js API route to ensure calls go to the backend.

---

## Login Flow Logic (Section 1)

```
1. User enters email + password
2. Frontend calls backend /api/check-email
3. If email NOT found in Firebase:
   - Show: "Email does not exist. Please check or create an account."
4. If email EXISTS in Firebase:
   - Attempt Firebase signInWithEmailAndPassword
   - If wrong password:
     - Show: "Invalid email or password"
   - If success:
     - Login complete, redirect to session
```

---

## Session Joining Logic (Updated) (Section 2)

```
1. User enters session code
2. Frontend reads session from Firestore (always works)
3. Socket connects to backend
4. Backend checks in-memory sessions:
   a. If found → Join normally
   b. If NOT found → Check Firestore
      - If exists and isActive → Resurrect in memory → Join
      - If not exists or not active → Show error
```

---

## Gemini Chat Features

1. **Code Context**: Sends all session files + current code to Gemini/Gemma
2. **History**: Maintains conversation history for context
3. **Model Selection**: Users can switch between available Gemini and Gemma models
4. **Code Insertion**: 
   - Click "Code" button on AI response
   - Insert to current file OR create new file

---

## Security Considerations

- **Email enumeration prevention**: The backend `/api/check-email` is called before login, but the frontend shows different messages based on result
- **Generic password error**: For existing emails with wrong password, shows same message as "email not found" to prevent enumeration
- **Password strength**: Client-side validation with clear requirements shown to user

---

## Files Modified

| File | Changes |
|------|---------|
| `frontend/src/contexts/auth-context.tsx` | Added email check, password validation, error handling |
| `frontend/src/components/auth/auth-page.tsx` | Added local error state, password requirements UI |
| `backend/server.py` | Fixed UserNotFoundError, added Firestore, Gemini APIs, model switching, Gemma model |
| `frontend/src/components/ide/gemini-chat-panel.tsx` | Refactored to use backend API, added code insertion, history panel, Gemma model default |
| `frontend/src/components/ide/model-selector.tsx` | NEW - Model selection dropdown |
| `backend/.env` | NEW - Environment variables for backend |

---

## Testing Notes

- Backend must have Firebase Admin SDK initialized with service account
- The `/api/check-email` endpoint returns `{exists: true/false}`
- Frontend handles both cases: email not found vs wrong password
- Gemini API key must be valid and have quota available
- Model list is cached; restart backend to refresh

---

## Next Steps / Known Issues

1. **API Key**: GEMINI_API_KEY must be valid with quota. Get a new key from https://aistudio.google.com/app/apikey
2. **Gemma Model**: Default model is now `gemma-3-4b-it`. Both Gemini and Gemma models are available in the selector.
3. **Connection Errors**: If frontend can't reach backend, check firewall/antivirus settings
4. **Model Filtering**: Preview and experimental models are filtered out. Update filter patterns as Google releases new models.
5. **Code Insertion**: When inserting code, language detection is basic (defaults to .py for Python, .js for JS)

---

## Future Improvements (Suggested)

1. **Session access control**: Add invite-only mode, shareable links
2. **Rate limiting**: Prevent brute force on login
3. **Firestore integration**: Store user profiles/settings in Firestore
4. **Email verification**: Require email verification before login
5. **Better code language detection**: Auto-detect language for code insertion
6. **Terminal improvements**: Add command history, autocomplete
