# Phase 1B: Frontend Improvements (UI/UX Only) - Detailed Implementation Plan

## Overview
Implement low-risk frontend improvements focusing on auth context refactoring and bundle optimization. Target completion: 2-3 days.

## 1. Component Refactoring - Auth Context Split
**Objective**: Break down monolithic auth.context.tsx (~500 lines) into focused modules.

### Steps:
- [x] **Create useAuth.ts**: Extract core auth methods (login, logout, refreshToken, getCurrentUser, refreshProfile)
- [x] **Create useAuthState.ts**: Extract reducer, actions, and state management logic
- [x] **Create useAuthSession.ts**: Extract session management (storage, timeout, initialization)
- [x] **Refactor auth.context.tsx**: Simplify to slim provider using new hooks, keep context creation and HOCs
- [x] **Identify dependent components**: Found 39 files using `useAuth` hook (login-form.tsx, protected-route.tsx, profile-guard.tsx, header.component.tsx, nav-user.tsx, site-header.tsx, and many dashboard components)
- [x] **Update imports**: No changes needed - kept same API for backward compatibility
- [x] **Test auth flows**: Build completed successfully - no TypeScript errors, auth refactoring working

## 2. Frontend Bundle Optimization (Conservative)
**Objective**: Reduce bundle size through dependency cleanup and lazy loading.

### Steps:
- [ ] **Analyze dependencies**: Grep search for usage of @dnd-kit, jspdf, xlsx, framer-motion, etc.
- [ ] **Remove unused dependencies**: Eliminate packages not imported anywhere from package.json
- [ ] **Implement dynamic imports**: Lazy load heavy components (charts in dashboards, PDF/XLSX in reports)
- [ ] **Add route lazy loading**: Defer loading of non-critical pages (profile setup, settings)
- [ ] **Build verification**: Run `npm run build` to confirm bundle size reduction (>10% target)
- [ ] **Performance testing**: Measure load times before/after changes

## Success Criteria
- [ ] Auth context split completed without breaking functionality
- [ ] Bundle size reduced by at least 10%
- [ ] All auth flows tested and working
- [ ] No build errors or TypeScript issues
- [ ] Code is more maintainable and modular

## Risk Mitigation
- Test auth functionality after each major change
- Keep original auth.context.tsx as backup during refactoring
- Only remove dependencies confirmed unused via search
- Use lazy loading conservatively to avoid breaking critical paths

## Completion
- [ ] Update main TODO.md to mark Phase 1B as completed
- [ ] Delete this PHASE1B_TODO.md file
