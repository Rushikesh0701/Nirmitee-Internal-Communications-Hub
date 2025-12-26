# Frontend Coding Practices — Strict & Advanced Agent Guide

**Stack**: React + TypeScript + Material UI  
**Architecture**: Component-based, hook-driven, service-oriented  
**Philosophy**: Deterministic behavior, zero ambiguity, production-first

**CRITICAL**: This document is the **single source of truth**. All code must strictly follow these practices. No exceptions. Violations result in PR rejection.

---

## 0. Absolute Rules (Non-Negotiable)

These rules are **non-negotiable**. Violation means PR rejection.

- ❌ **No direct `process.env` access** anywhere except `src/config/env.ts`
- ❌ **No business logic inside components** — components are presentation only
- ❌ **No untyped objects, `any`, or implicit `unknown`** — strict typing always
- ❌ **No silent failures, swallowed errors, or fallback defaults** — fail loudly
- ❌ **No temporary hacks, TODOs, or "quick fixes"** — permanent solutions only
- ❌ **No component file exceeding 300 lines** — split into smaller components
- ❌ **No inline styles** — use Material UI `sx` prop or styled components
- ❌ **No `console.log` or `console.error`** — use proper error handling

**Enforcement**: If a rule is violated → PR must be rejected.

---

## 1. Component Size Limit (CRITICAL)

### 300 Line Maximum

**Rule**: No component file may exceed 300 lines of code.

**If a component exceeds 300 lines**:
1. **Extract sub-components** — break into smaller, focused components
2. **Extract custom hooks** — move complex logic to hooks
3. **Extract utilities** — move helper functions to utility files
4. **Split into multiple files** — use composition pattern

```typescript
// ❌ WRONG - Component exceeds 300 lines
export const UserDashboard: React.FC = () => {
  // 400+ lines of code
};

// ✅ CORRECT - Split into smaller components
// UserDashboard.tsx (150 lines)
export const UserDashboard: React.FC = () => {
  return (
    <Box>
      <UserHeader />
      <UserStats />
      <UserActivity />
    </Box>
  );
};

// UserHeader.tsx (80 lines)
// UserStats.tsx (100 lines)
// UserActivity.tsx (120 lines)
```

**Enforcement**: Automated checks should reject PRs with files exceeding 300 lines.

---

## 2. Environment & Configuration (Single Source of Truth)

### Env Discipline

`src/config/env.ts` **must**:

1. **Validate every env var** with proper error messages
2. **Fail fast on boot** if invalid or missing (show clear error in UI)
3. **Export two interfaces**:
   - `env` → raw validated values (for direct access when needed)
   - `appConfig` → derived, runtime-safe config (preferred)

```typescript
// ❌ NEVER
const apiUrl = process.env.REACT_APP_API_URL;

// ✅ ALWAYS
import { env, appConfig } from '../config/env';
const apiUrl = env.REACT_APP_API_URL;
```

### .env.example Requirements

- **Must contain every env var** used in the application
- **No real values** — placeholders only (e.g., `your-api-url-here`)
- **Documentation**: Include comments explaining each variable's purpose

---

## 3. Component Architecture (Hard Boundaries)

### Component Structure (Strict Order)

Every component **must** follow this exact structure:

```typescript
// 1. External dependencies
import React from 'react';
import { Box, Button, Typography } from '@mui/material';

// 2. Internal imports
import { useAuth } from '../hooks/useAuth';
import { userService } from '../services/userService';

// 3. Type imports
import type { UserProps } from './User.types';

// 4. Types/Interfaces (if not in separate file)
interface UserProps {
  id: string;
  name: string;
}

// 5. Component
export const User: React.FC<UserProps> = ({ id, name }) => {
  // 6. Hooks (in strict order):
  //    a. State hooks
  const [loading, setLoading] = React.useState(false);
  
  //    b. Context hooks
  const { user } = useAuth();
  
  //    c. Custom hooks
  const { data } = useUserData(id);
  
  //    d. Effects
  React.useEffect(() => {
    // Side effects
  }, []);
  
  //    e. Callbacks (useCallback for memoization)
  const handleClick = React.useCallback(() => {
    // Handler logic
  }, []);
  
  //    f. Derived values (useMemo)
  const computedValue = React.useMemo(() => {
    return data?.value * 2;
  }, [data]);

  // 7. Early returns (if any)
  if (loading) return <CircularProgress />;
  if (!data) return null;

  // 8. Render
  return (
    <Box>
      <Typography>{name}</Typography>
    </Box>
  );
};
```

### Component Rules

**Components do**:
- Render UI based on props and state
- Use hooks for state management and side effects
- Call services for data fetching
- Handle user interactions (delegate to handlers)

**Components do NOT**:
- ❌ **No business logic** — move to hooks or services
- ❌ **No direct API calls** — use services
- ❌ **No complex calculations** — extract to utilities or hooks
- ❌ **No inline styles** — use Material UI `sx` prop
- ❌ **No console.log/console.error** — use proper error handling
- ❌ **No files over 300 lines** — split into smaller components

**Component rule of thumb**: If it needs a comment explaining what it does → it's too complex.

---

## 4. Hooks & State Management

### Custom Hooks

**Location**: `src/hooks/` or feature-specific `hooks.ts`

**Naming**: `use<FeatureName>` (e.g., `useAuth`, `useUserData`, `useFormValidation`)

**Rules**:
- ✅ **Single responsibility** — one hook does one thing
- ✅ **Reusable** — extract shared logic
- ✅ **Type-safe** — explicit return types
- ✅ **Error handling** — handle errors properly
- ❌ **No side effects in render** — use `useEffect`
- ❌ **No business logic in components** — move to hooks

```typescript
// ✅ CORRECT
export interface UseUserDataReturn {
  user: User | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export const useUserData = (userId: string): UseUserDataReturn => {
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  const fetchUser = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await userService.getUser(userId);
      setUser(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch user'));
    } finally {
      setLoading(false);
    }
  }, [userId]);

  React.useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return { user, loading, error, refetch: fetchUser };
};

// ❌ WRONG
export const useUserData = (userId: any): any => {
  // No types, implicit any, no error handling
  const [user, setUser] = React.useState();
  React.useEffect(() => {
    fetch(`/api/users/${userId}`).then(r => r.json()).then(setUser);
  }, []);
  return user;
};
```

### State Management Strategy

**Prefer**:
- ✅ **React hooks** (`useState`, `useReducer`) for local state
- ✅ **Context API** for shared state (auth, theme, user preferences)
- ✅ **Custom hooks** for complex state logic
- ✅ **React Query / SWR** for server state (if needed)

**Avoid**:
- ❌ **Prop drilling** — use Context for deeply nested props
- ❌ **Global state for local concerns** — keep state local when possible
- ❌ **Unnecessary re-renders** — use `React.memo`, `useMemo`, `useCallback` appropriately
- ❌ **Over-engineering** — start simple, add complexity only when needed

---

## 5. Services & API Calls

### Service Layer

**Location**: `src/services/`

**Pattern**: One service per domain (e.g., `userService.ts`, `authService.ts`, `productService.ts`)

**Rules**:
- ✅ **Type-safe** — explicit request/response types
- ✅ **Error handling** — transform API errors to app errors
- ✅ **No UI logic** — services are pure data layer
- ✅ **Consistent API** — all services follow same pattern
- ❌ **No React hooks in services** — services are plain functions
- ❌ **No direct fetch calls in components** — always use services

```typescript
// ✅ CORRECT
export interface GetUserRequest {
  id: string;
}

export interface GetUserResponse {
  user: User;
}

export interface User {
  id: string;
  name: string;
  email: string;
}

export const userService = {
  getUser: async (id: string): Promise<User> => {
    const response = await api.get<GetUserResponse>(`/users/${id}`);
    return response.data.user;
  },
  
  getUsers: async (params?: { page?: number; limit?: number }): Promise<User[]> => {
    const response = await api.get<User[]>('/users', { params });
    return response.data;
  },
};

// ❌ WRONG
export const userService = {
  getUser: async (id: any) => {
    // No types, direct fetch, no error handling
    const res = await fetch(`/api/users/${id}`);
    return res.json();
  },
};
```

### API Client

**Location**: `src/services/api.ts`

**Must include**:
- Base URL configuration (from env)
- Request/response interceptors
- Error handling and transformation
- Authentication headers (if needed)
- Request/response logging (development only)

---

## 6. Routing & Navigation

### Route Structure

```
/                → Home page
/<feature>       → Feature pages
/<feature>/:id   → Feature detail pages
```

**Rules**:
- ✅ **Use React Router** for navigation
- ✅ **Lazy load routes** — use `React.lazy` for code splitting
- ✅ **Protected routes** — use route guards for auth
- ✅ **Route constants** — define routes in constants file
- ❌ **No hardcoded URLs** — use route constants
- ❌ **No navigation logic in components** — use hooks or utilities

### Route Guards

**Pattern**:
```typescript
interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <CircularProgress />;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};
```

### Lazy Loading

```typescript
// ✅ CORRECT
const UserDashboard = React.lazy(() => import('../pages/UserDashboard'));

<Route path="/dashboard" element={
  <React.Suspense fallback={<CircularProgress />}>
    <ProtectedRoute>
      <UserDashboard />
    </ProtectedRoute>
  </React.Suspense>
} />
```

---

## 7. Material UI & Styling

### Material UI Rules

- ✅ **Use Material UI components** — don't reinvent the wheel
- ✅ **Use `sx` prop** for styling — consistent with MUI theme
- ✅ **Use theme** for colors, spacing, typography
- ✅ **Responsive design** — use MUI breakpoints
- ❌ **No inline styles** — use `sx` or styled components
- ❌ **No custom CSS files** unless absolutely necessary
- ❌ **No hardcoded colors** — use theme palette
- ❌ **No hardcoded spacing** — use theme spacing

```typescript
// ✅ CORRECT
<Box 
  sx={{ 
    p: 2, 
    bgcolor: 'primary.main',
    borderRadius: 1,
    boxShadow: 2,
  }}
>
  <Typography variant="h6" color="text.primary">
    Title
  </Typography>
</Box>

// ❌ WRONG
<div style={{ padding: '16px', backgroundColor: '#1976d2' }}>
  <h6 style={{ color: '#000' }}>Title</h6>
</div>
```

### Theme Configuration

**Location**: `src/theme/theme.ts`

**Must include**:
- Color palette (primary, secondary, error, warning, info, success)
- Typography settings (font family, sizes, weights)
- Spacing (consistent spacing scale)
- Component overrides (if needed)
- Breakpoints (if custom)

```typescript
// ✅ CORRECT
import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
  spacing: 8,
});
```

---

## 8. Error Handling & Loading States

### Error Handling

**Pattern**:
- ✅ **Error boundaries** for component tree errors
- ✅ **Try-catch in async operations** (services, hooks)
- ✅ **User-friendly error messages** — never expose stack traces
- ✅ **Error context** — show what went wrong and how to fix it
- ❌ **No silent failures** — always show error state
- ❌ **No generic errors** — specific error messages

```typescript
// ✅ CORRECT
const { data, error, loading } = useUserData(userId);

if (error) {
  return (
    <Alert severity="error">
      Failed to load user: {error.message}
    </Alert>
  );
}

// ❌ WRONG
try {
  const user = await fetchUser();
} catch (e) {
  // Silent failure - user sees nothing
}
```

### Error Boundaries

```typescript
// ✅ CORRECT
export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to error reporting service
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Alert severity="error">
          Something went wrong. Please refresh the page.
        </Alert>
      );
    }

    return this.props.children;
  }
}
```

### Loading States

**Rules**:
- ✅ **Always show loading state** for async operations
- ✅ **Use Material UI loading components** (CircularProgress, Skeleton)
- ✅ **Optimistic updates** when appropriate
- ✅ **Skeleton screens** for better UX
- ❌ **No blank screens** during loading

```typescript
// ✅ CORRECT
if (loading) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
      <CircularProgress />
    </Box>
  );
}

// Or with skeleton
if (loading) {
  return (
    <Box>
      <Skeleton variant="text" width="60%" />
      <Skeleton variant="rectangular" height={200} />
    </Box>
  );
}
```

---

## 9. Type Safety (Zero `any` Tolerance)

### TypeScript Configuration

- **`strict: true` always** — no exceptions
- **No implicit `any`** — all types must be explicit
- **No `any` types** — use `unknown` if type is truly unknown, then narrow it

### Type Rules

- **No implicit return types** for public functions — always explicit
- **Shared types** → `src/types/` directory
- **Component-specific types** → `<Component>.types.ts`
- **Service types** → in service file or `src/types/`
- **If TS can't prove it** → refactor until it can

### Type Patterns

```typescript
// ✅ CORRECT
export interface UserProps {
  id: string;
  name: string;
  email: string;
  onUpdate?: (user: User) => void;
}

export const User: React.FC<UserProps> = ({ id, name, email, onUpdate }) => {
  // ...
};

// ❌ WRONG
export const User = ({ id, name, email, onUpdate }: any) => {
  // ...
};
```

### Type Narrowing

```typescript
// ✅ CORRECT
function processData(data: unknown): void {
  if (typeof data === 'string') {
    // Type narrowed to string
    console.log(data.toUpperCase());
  } else if (data && typeof data === 'object' && 'value' in data) {
    // Type narrowed to object with 'value' property
    console.log((data as { value: string }).value);
  }
}
```

---

## 10. Code Organization

### Import Order (Strict)

1. **React and React-related** (React, React Router, etc.)
2. **External libraries** (Material UI, Axios, etc.)
3. **Internal services** (API services, utilities)
4. **Internal hooks** (custom hooks)
5. **Internal components** (other components)
6. **Types** (use `import type` for type-only imports)
7. **Styles** (if any)

```typescript
// ✅ CORRECT
import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

import { userService } from '../services/userService';
import { useAuth } from '../hooks/useAuth';
import { UserCard } from '../components/UserCard';
import type { User } from '../types/user';
```

### File Naming

- **Components**: PascalCase (e.g., `UserCard.tsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useAuth.ts`)
- **Services**: camelCase (e.g., `userService.ts`)
- **Types**: PascalCase (e.g., `User.types.ts`)
- **Utils**: camelCase (e.g., `formatDate.ts`)

### Folder Structure

```
src/
├── components/        # Reusable components
│   ├── Button/
│   │   ├── Button.tsx
│   │   ├── Button.types.ts
│   │   └── Button.test.tsx
├── pages/            # Page components
├── services/         # API services
├── hooks/            # Custom hooks
├── layouts/          # Layout components
├── context/          # React context providers
├── types/            # Shared TypeScript types
├── utils/            # Shared utilities
├── theme/            # Material UI theme
└── config/           # Configuration (env, constants)
```

---

## 11. Testing & Validation

### Testing Requirements

**Minimum**: Manual testing of components

**At least test**:
- Happy path (successful rendering/interaction)
- Error states (error handling)
- Loading states (loading indicators)
- Edge cases (empty data, null values)

**No component considered "done"** without being manually tested.

### Code Quality

- **Linting**: Run `npm run lint` before merging
- **Type checking**: `tsc --noEmit` must pass
- **Component size**: No file exceeding 300 lines
- **Code review**: All code must be reviewed

---

## 12. Performance Optimization

### React Performance

- ✅ **Use `React.memo`** for expensive components
- ✅ **Use `useMemo`** for expensive calculations
- ✅ **Use `useCallback`** for stable function references
- ✅ **Lazy load routes** — code splitting
- ✅ **Virtualize long lists** — use `react-window` or similar
- ❌ **Don't over-optimize** — measure first, optimize second

### Bundle Size

- ✅ **Tree shaking** — import only what you need
- ✅ **Code splitting** — lazy load routes and heavy components
- ✅ **Bundle analysis** — regularly check bundle size
- ❌ **No unnecessary dependencies** — audit dependencies regularly

---

## 13. Accessibility (a11y)

### Accessibility Rules

- ✅ **Semantic HTML** — use proper HTML elements
- ✅ **ARIA labels** — when semantic HTML isn't enough
- ✅ **Keyboard navigation** — all interactive elements keyboard accessible
- ✅ **Focus management** — proper focus handling
- ✅ **Color contrast** — meet WCAG AA standards
- ✅ **Screen reader support** — test with screen readers

```typescript
// ✅ CORRECT
<Button
  aria-label="Close dialog"
  onClick={handleClose}
>
  <CloseIcon />
</Button>

// ❌ WRONG
<div onClick={handleClose}>
  <CloseIcon />
</div>
```

---

## 14. Security Best Practices

### Input Validation

- ✅ **Validate all user inputs** — client-side validation
- ✅ **Sanitize inputs** — prevent XSS attacks
- ✅ **Type validation** — validate types, not just presence
- ❌ **Never trust client-side validation alone** — server validates too

### Data Protection

- ✅ **Never log sensitive data** — passwords, tokens, PII
- ✅ **Secure API calls** — use HTTPS, proper authentication
- ✅ **XSS prevention** — sanitize user input, use React's built-in escaping
- ✅ **CSRF protection** — use proper CSRF tokens

---

## 15. Production Readiness Checklist

Before deploying to production, ensure:

- [ ] All environment variables are set correctly
- [ ] API URLs are configured for production
- [ ] Error handling doesn't expose sensitive information
- [ ] Loading states are implemented
- [ ] Error boundaries are in place
- [ ] All components tested manually
- [ ] Code passes linting (`npm run lint`)
- [ ] TypeScript compiles without errors (`tsc --noEmit`)
- [ ] No component files exceeding 300 lines
- [ ] No `console.*` statements
- [ ] No `process.env` direct access
- [ ] No `any` types
- [ ] Bundle size is optimized
- [ ] Accessibility standards met
- [ ] Responsive design tested on multiple devices

---

## 16. When Making Any Change

**Always follow this checklist:**

1. **Re-check `agent.md`** — Ensure the change aligns with established patterns
2. **Confirm pattern alignment** — Verify it follows component pattern
3. **Check component size** — Ensure no file exceeds 300 lines
4. **Update related files** — If adding routes, update route constants
5. **Run linting** — `npm run lint` must pass
6. **Type checking** — `tsc --noEmit` must pass
7. **Manually test** — Verify the change works as expected
8. **Add comments for non-obvious logic** — Document complex decisions

**Skipping steps is not acceptable.**

---

## 17. Prohibited Practices (Zero Tolerance)

- ❌ **Direct `process.env` access** (use `env`/`appConfig` from `src/config/env.ts`)
- ❌ **`console.log` or `console.error`** (use proper error handling)
- ❌ **Temporary patches or workarounds** (implement permanent fixes)
- ❌ **Component files over 300 lines** (split into smaller components)
- ❌ **Skipping error handling or type checking**
- ❌ **Using `any` type without justification**
- ❌ **Bypassing established patterns without good reason**
- ❌ **No business logic in components** — move to hooks or services
- ❌ **No untyped objects, `any`, or implicit `unknown`** — strict typing always
- ❌ **No silent failures, swallowed errors, or fallback defaults** — fail loudly
- ❌ **No temporary hacks, TODOs, or "quick fixes"** — permanent solutions only
- ❌ **No inline styles** — use Material UI `sx` prop
- ❌ **"Just this once" solutions**

**Enforcement**: If a rule is violated → PR must be rejected.

---

**Remember**: This guide is the **single source of truth**. When in doubt, refer to this document. All code must comply with these practices. Violations result in PR rejection.

