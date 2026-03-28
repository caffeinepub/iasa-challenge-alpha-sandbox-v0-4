# IASA Challenge Alpha Sandbox v0.4

## Current State

The app has a landing page with two countdown clocks (IASA Challenge Launch: March 30 2026 03:00 CLT; Finish Line: Oct 26 2026 15:00 CLT), Internet Identity login, and a basic access system. The backend uses Motoko with:
- Users stored via the `user-approval` component (OrderedMap) with status: #pending, #approved, #blocked
- First user auto-assigned as Admin with #approved status
- Admin bar (on landing and dashboard) showing pending/approved/blocked users with Approve/Reject/Block/Unblock buttons
- Dashboard page with admin sidebar showing user management

Current user entity has only: principal, status, registrationDate.
No roles, no reputation points, no projects.

## Requested Changes (Diff)

### Add
- **User fields**: `role` variant (#mentor, #journeyman, #apprentice, #invitedArtist, #admin, #none) and `reputationPoints` (Float)
- **Admin hierarchy**: Admin1 (first user) can appoint Admin2 with same powers. Admin1 has override: can reverse Admin2's role assignments and approvals. Admin2 cannot override Admin1. Backend stores `adminLevel` (1=Admin1, 2=Admin2) to distinguish.
- **New backend functions**:
  - `assignUserRole(principal, role)`: Admin assigns/confirms role to user (also approves them)
  - `reverseUserRole(principal, newRole)`: Admin changes user's role (same mechanism, e.g. demote mentor → journeyman); Admin1 can also reverse assignments made by Admin2
  - `updateReputation(principal, points)`: Admin sets user's reputationPoints (Marker A)
  - `promoteToAdmin2(principal)`: Admin1 only — promotes a user to Admin2
  - `revokeAdmin2(principal)`: Admin1 only — revokes Admin2 status
- **Project entity**: projectId (Nat, starts at 1000000, auto-incrementing), title (Text), creator (Principal), status (#pending, #active, #archived), creationTime (Time)
- **Project backend functions**:
  - `createProject(title)`: Any authenticated user EXCEPT #apprentice can create a project (starts as #pending)
  - `confirmProject(projectId)`: Admin only — moves project to #active
  - `archiveProject(projectId)`: Admin only — moves project to #archived
  - `getProjects()`: Returns all non-archived projects (public view)
  - `getAllProjects()`: Admin only — returns all projects including archived
- **48-hour auto-block**: Pending users not assigned a role within 48 hours get auto-blocked (Heartbeat-based or on-query check)
- **Frontend: Admin Dashboard tabs**:
  - "Users" tab: table with each user showing truncated principal, status, role, reputation; dropdowns to assign role; input for reputation points; Assign, Reverse Role, Block buttons; visual warning badge if user is within 2 hours of 48-hour expiry
  - "Projects" tab: shows all projects (including #pending). Confirm and Archive buttons for each. Filter toggle for Archived projects.
- **Frontend: Main Dashboard (all users including spectators)**:
  - Projects section showing #active projects in a grid/list
  - "Create New Project" button — hidden/disabled for #apprentice and #none (no role) users
  - Spectators (#pending, no role) see projects but cannot interact

### Modify
- `requestApproval()` — keep existing logic; first user still becomes Admin1 automatically
- `setApproval()` — Admin2 can also call this, but Admin1 can reverse any Admin2 approval
- `listApprovals()` — extend to return user role and reputation points alongside status
- Dashboard `AdminSidebar` → replace with tabbed admin panel (Users + Projects tabs)
- Dashboard main content → replace "Coming Soon" with Projects grid for all users

### Remove
- Nothing removed; all existing access logic preserved

## Implementation Plan

1. **Backend (main.mo)**: Rewrite to add role/reputation/adminLevel fields to user records. Add project OrderedMap. Implement all new functions above. Add Heartbeat for 48-hour auto-block. Admin1 vs Admin2 permission checks inline.
2. **backend.d.ts**: Update type definitions to include new enums (UserEcosystemRole, ProjectStatus), new interfaces (ProjectInfo, ExtendedUserInfo), and new function signatures.
3. **Frontend hooks (useQueries.ts)**: Add hooks for new backend calls (assignUserRole, reverseUserRole, updateReputation, createProject, confirmProject, archiveProject, getProjects, getAllProjects, promoteToAdmin2, revokeAdmin2).
4. **DashboardPage.tsx**: Refactor AdminSidebar into tabbed panel. Add Projects tab. Replace main content placeholder with ProjectsView component.
5. **AdminBar.tsx**: Optionally extend to show role assignment inline (or remove in favor of dashboard-only management).
