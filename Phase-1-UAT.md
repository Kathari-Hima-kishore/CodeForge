# Phase 1: Login & Registration Flow - User Acceptance Testing (UAT)

## Status
- [ ] Test 1: Unregistered Email Check
- [ ] Test 2: Registered Email with Incorrect Password
- [ ] Test 3: Registered Email with Correct Password
- [ ] Test 4: New User Registration (Valid)
- [ ] Test 5: New User Registration (Invalid Password)
- [ ] Test 6: Existing User Registration (Email already in use)

---

## Test Results

### Test 1: Unregistered Email Check
- **Scenario**: Enter an email that is not registered in Firebase and click "Sign In".
- **Expected Result**: Browser shows "Email is not registered" as an error message on the page.
- **Result**: [PENDING]

### Test 2: Registered Email with Incorrect Password
- **Scenario**: Enter a registered email but with a wrong password and click "Sign In".
- **Expected Result**: Browser shows "Incorrect password" as an error message on the page.
- **Result**: [PENDING]

### Test 3: Registered Email with Correct Password
- **Scenario**: Enter correct credentials and click "Sign In".
- **Expected Result**: User is successfully logged in and redirected to the session view.
- **Result**: [PENDING]

### Test 4: New User Registration (Valid)
- **Scenario**: Use "Sign up for free", enter valid name, new email, and strong password.
- **Expected Result**: Account is created, user is logged in, and redirected to session view.
- **Result**: [PENDING]

### Test 5: New User Registration (Invalid Password)
- **Scenario**: Register with a password that doesn't meet requirements (no uppercase, no number, or < 8 chars).
- **Expected Result**: Specific error message explaining the password requirements (e.g., "Password must contain at least one uppercase letter").
- **Result**: [PENDING]

### Test 6: Existing User Registration
- **Scenario**: Try to register with an email that is already registered.
- **Expected Result**: Error message: "This email is already registered".
- **Result**: [PENDING]
