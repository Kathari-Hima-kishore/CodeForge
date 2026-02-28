# Phase 2: Session Logic & Speed - User Acceptance Testing (UAT)

## Status
- [ ] Test 1: Session Creation & Persistence
- [ ] Test 2: Real-time File Sync Speed
- [ ] Test 3: Session Resurrection (Server Restart)
- [ ] Test 4: Dashboard Load Performance

---

## Test Results

### Test 1: Session Creation & Persistence
- **Scenario**: Create a new session and verify it persists in the dashboard after refresh.
- **Expected Result**: Session appears instantly in "My Sessions" and remains there after reloading the page.
- **Result**: [PENDING]

### Test 2: Real-time File Sync Speed
- **Scenario**: Type in the editor and observe latency for other participants.
- **Expected Result**: Edits appear within < 500ms for other users.
- **Result**: [PENDING] (Risk identified: Firestore write-frequency bottleneck)

### Test 3: Session Resurrection
- **Scenario**: Host a session, kill the backend server, restart it, and attempt to join/rejoin.
- **Expected Result**: Backend restores session state from Firestore; participants rejoin successfully.
- **Result**: [PENDING]

### Test 4: Dashboard Load Performance
- **Scenario**: Log in with an account having 5+ sessions and measure list load time.
- **Expected Result**: Session list populates in < 1s using direct collection querying.
- **Result**: [PENDING]
