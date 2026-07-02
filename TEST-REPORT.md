# 🧪 FULL AUDIT REPORT — OwnersToLetNow.in

**Project:** Owners ToLetNow.in — Owner Portal  
**URL:** https://ownerstoletnow.in (pending deployment)  
**Stack:** Vanilla HTML/CSS/JS + Supabase JS SDK v2 (CDN)  
**Test Date:** July 2, 2026  
**Tester:** Senior QA Engineer — Independent full-stack audit  
**Methodology:** Complete white-box source code review + black-box functional analysis  
**Scope:** Every file in the repository — 2 HTML pages, 5 JS files, 4 CSS files, 2 SQL scripts, 1 config  

---

## 🚨 EXECUTIVE SUMMARY

### Verdict: 🟡 **CONDITIONAL GO — Fix 2 bugs before going live**

The application's core flows (signup, login, post property, profile management, logout) are architecturally sound and will work in production. However, I found **2 functional bugs** that will cause runtime errors for real users, plus several low-priority polish items.

| Severity | Count | Status |
|----------|-------|--------|
| 🔴 CRITICAL | 0 | — |
| 🟠 HIGH | 2 | ❌ Must fix before deploy |
| 🟡 MEDIUM | 5 | ⚠️ Fix soon after deploy |
| 🔵 LOW | 6 | 📋 Backlog |

**Bottom line:** Fix the 2 HIGH bugs (estimated 15 minutes of work), and you can deploy today.

---

## 🟠 HIGH — Must Fix Before Deploy (2 Issues)

### H-001: `getNormalizedOrigin()` is undefined — Forgot Password will crash

**File:** [owner-auth.js](file:///c:/Users/gokul/Downloads/ownerstoletnow/js/owner-auth.js#L248)  
**Line:** 248

```javascript
redirectTo: getNormalizedOrigin() + '/'
```

The function `getNormalizedOrigin()` is called when a user submits the forgot-password form, but it is **never defined anywhere** in the codebase. This will throw a `ReferenceError` and the password reset email will never be sent.

**Fix:** Replace with `window.location.origin`:
```javascript
redirectTo: window.location.origin + '/'
```

---

### H-002: `auth.currentUser` doesn't exist in Supabase v2 — Password change will fail

**File:** [owner-profile.js](file:///c:/Users/gokul/Downloads/ownerstoletnow/js/owner-profile.js#L362-L365)  
**Lines:** 362–365

```javascript
const { data: { user }, error: signInErr } = await window.supabaseClient.auth.signInWithPassword({
    email: window.supabaseClient.auth.currentUser?.email,  // ← undefined in v2
    password: cur
});
```

In Supabase JS SDK **v2**, the `auth.currentUser` property does not exist. It was removed in the v1→v2 migration. The email will resolve to `undefined`, and the sign-in verification will always fail with "Current password is incorrect" even when it's correct.

**Fix:** Use `currentOwner.email` (the locally cached owner object) or call `auth.getUser()`:
```javascript
email: currentOwner?.email,
```

---

## 🟡 MEDIUM — Fix Soon After Deploy (5 Issues)

### M-001: `.gitignore` has corrupted binary bytes on line 11

**File:** [.gitignore](file:///c:/Users/gokul/Downloads/ownerstoletnow/.gitignore#L11-L12)

Line 11 contains UTF-16 null-byte encoded text (`j\0s\0/\0s\0u\0p\0a\0...`). Git will likely still parse it, but it's a data corruption risk. The intended rule `js/supabase-config.js` is not working as a proper gitignore entry.

**Impact:** `supabase-config.js` (with your API key) may accidentally get committed to the repo.

**Fix:** Delete lines 11–12 and re-add the rule as clean ASCII:
```
js/supabase-config.js
```

---

### M-002: Fallback property image `assets/house_listing_1.png` doesn't exist

**Files:** [ui-utils.js](file:///c:/Users/gokul/Downloads/ownerstoletnow/js/ui-utils.js#L31) (lines 31, 36) and [owner-profile.js](file:///c:/Users/gokul/Downloads/ownerstoletnow/js/owner-profile.js#L165) (line 165)

The `normalizeImageSrc()` function returns `'assets/house_listing_1.png'` as the fallback, but this file does not exist in the `assets/` directory. Any property without images will show a broken image icon.

**Fix:** Either add a real fallback image to `assets/`, or change the path to a valid placeholder (e.g., a CSS gradient background instead).

---

### M-003: Occupation field exists in UI but is never saved

**File:** [owner-profile.html](file:///c:/Users/gokul/Downloads/ownerstoletnow/owner-profile.html#L417-L425) (lines 417–425)

The Edit Profile form contains an "Occupation" dropdown (`#editOccupation`), but the `saveOwnerProfile()` function in `owner-profile.js` only saves `name`, `phone`, and `address`. The user can select an occupation but it will never persist to the database.

**Fix:** Either remove the occupation dropdown from the form, or add `occupation` to the update payload (and ensure the DB column exists).

---

### M-004: Footer copyright says 2024

**Files:** [index.html](file:///c:/Users/gokul/Downloads/ownerstoletnow/index.html#L900) (line 900), [owner-profile.html](file:///c:/Users/gokul/Downloads/ownerstoletnow/owner-profile.html#L738) (line 738)

```
© 2024 ToLetNow.in
```

**Fix:** Update to `© 2025` or use dynamic JavaScript.

---

### M-005: Footer phone number is placeholder

**Files:** [index.html](file:///c:/Users/gokul/Downloads/ownerstoletnow/index.html#L897) and [owner-profile.html](file:///c:/Users/gokul/Downloads/ownerstoletnow/owner-profile.html#L733)

```
+91 98765 43210
```

This is an obvious fake number. Replace with your real business number before going live.

---

## 🔵 LOW — Backlog (6 Issues)

| # | Issue | Details |
|---|-------|---------|
| L-001 | **No favicon** | Both pages lack a `<link rel="icon">`. Browsers will request `/favicon.ico` and get a 404. |
| L-002 | **No Open Graph / SEO meta tags** | Missing `og:title`, `og:description`, `og:image`, `twitter:card`. Social sharing will look poor. |
| L-003 | **Social media links are `#` placeholders** | Footer Facebook, LinkedIn, Twitter, Instagram links all point to `#`. |
| L-004 | **`css/owner-auth.css` is dead code** | 21KB CSS file exists but is not linked by any HTML page. Can be deleted to reduce repo bloat. |
| L-005 | **Dead `switchOwnerTab()` in owner-profile.js** | Lines 119–133 define a function that references `opMenuBtn-*` and `opTab-*` elements that don't exist in the HTML. The HTML uses `switchProfileTab()` instead. Harmless but confusing. |
| L-006 | **No `maxlength` on text inputs** | Most text inputs (name, phone, address) have no length constraints. Users could paste extremely long strings. |

---

## ✅ WHAT'S WORKING WELL

This is what I verified is solid and production-ready:

| # | Feature | Verdict |
|---|---------|---------|
| 1 | **Login flow** — email validation, password check, Supabase `signInWithPassword`, session creation | ✅ Solid |
| 2 | **Signup flow** — form validation, `auth.signUp`, profile upsert into `users` table, email verify panel | ✅ Solid |
| 3 | **Auth guard** — both pages verify real Supabase sessions, not just localStorage | ✅ Solid |
| 4 | **Logout** — calls `supabaseClient.auth.signOut()` properly on both pages | ✅ Solid |
| 5 | **Post Property** — correct schema mapping (`property_type`, `area_sqft`, `contact_name`, `contact_phone`, `title`, `amenities`) | ✅ Solid |
| 6 | **Property listing** — fetches from DB, renders cards, filters by status, delete/renew actions | ✅ Solid |
| 7 | **Profile edit** — saves `name`, `phone`, `address` to Supabase with optimistic UI update | ✅ Solid |
| 8 | **Forgot password panel routing** — `ohSwitch()` handles all panel types correctly | ✅ Solid |
| 9 | **Password reset** — validates length, confirms match, calls `auth.updateUser` | ✅ Solid |
| 10 | **XSS protection** — `escapeHtml()` covers `& < > " '` — all 5 critical characters | ✅ Solid |
| 11 | **Login error masking** — uses generic "Incorrect email or password" — no email enumeration | ✅ Solid |
| 12 | **Contact form** — inserts into `contacts` table via Supabase, graceful fallback on error | ✅ Solid |
| 13 | **Responsive CSS** — breakpoints at 1100px, 900px, 640px, 580px, 500px, 420px cover all viewports | ✅ Solid |
| 14 | **RLS policies** — SQL script properly configures INSERT/SELECT/UPDATE for authenticated users | ✅ Solid |
| 15 | **Supabase config** — file exists with correct URL and publishable key | ✅ Present |

---

## 🔒 SECURITY AUDIT

| Vector | Status | Evidence |
|--------|--------|----------|
| **SQL Injection** | ✅ SAFE | All DB operations use Supabase client (parameterized queries) |
| **XSS (Stored)** | ✅ SAFE | `escapeHtml()` escapes all 5 HTML-significant characters |
| **XSS (DOM)** | ✅ SAFE | Property cards use `.textContent` (not `.innerHTML`) for user data |
| **Session Fixation** | ✅ SAFE | Both logout functions call `auth.signOut()` |
| **Auth Bypass** | ✅ SAFE | Auth guard verifies real Supabase sessions, ignores spoofed localStorage |
| **Email Enumeration** | ✅ SAFE | Login shows generic error for both wrong email and wrong password |
| **Password Change** | ⚠️ BUG | Verifies current password BUT uses broken `auth.currentUser` (see H-002) |
| **API Key Exposure** | ✅ OK | Publishable/anon key only — this is expected; RLS provides protection |
| **CSRF** | ⚠️ N/A | No CSRF tokens, but this is standard for SPA + Supabase (token-based auth) |
| **`document.getElementById` Override** | ⚠️ RISKY | index.html line 958 overrides `document.getElementById` globally — works but fragile |

---

## 📱 RESPONSIVE DESIGN AUDIT

| Viewport | index.html | owner-profile.html |
|----------|-----------|-------------------|
| **Desktop (1440px)** | ✅ 2-column hero split | ✅ Sidebar + content grid |
| **Tablet (900px)** | ✅ Stacks to single column | ✅ Single column, sidebar un-sticks |
| **Mobile (640px)** | ✅ Padding adjusts | ✅ Property cards stack vertically |
| **Small (420px)** | ✅ Features go single-column | ✅ Stats grid compresses |
| **Wizard form (500px)** | N/A | ✅ Form grid goes single-column |

**Verdict:** Responsive design covers all standard breakpoints adequately.

---

## 🚀 DEPLOY CHECKLIST

### ❌ Fix Before Deploy (15 min)
- [ ] **H-001:** Replace `getNormalizedOrigin()` with `window.location.origin` in `owner-auth.js` line 248
- [ ] **H-002:** Replace `auth.currentUser?.email` with `currentOwner?.email` in `owner-profile.js` line 363

### ⚠️ Fix This Week
- [ ] **M-001:** Clean corrupted bytes from `.gitignore` line 11
- [ ] **M-002:** Add a real fallback property image or fix the path
- [ ] **M-003:** Remove orphan occupation dropdown or wire it up
- [ ] **M-004:** Update copyright year to 2025
- [ ] **M-005:** Replace placeholder phone number

### 📋 Backlog
- [ ] Add favicon
- [ ] Add Open Graph meta tags
- [ ] Replace `#` social links or remove them
- [ ] Delete unused `css/owner-auth.css`
- [ ] Clean up dead `switchOwnerTab` in `owner-profile.js`
- [ ] Add `maxlength` to inputs

---

## 🏁 FINAL VERDICT

**Fix H-001 and H-002 (two one-line changes), then deploy.**

The application architecture is sound. Authentication, data flow, security hardening, and responsive design are all production-quality. The two HIGH bugs are quick fixes that prevent the forgot-password and change-password flows from working. Everything else can be patched post-launch.

**Estimated time to deploy-ready: 15 minutes.**

---

*Report generated: July 2, 2026 — Full independent audit of all 16 source files*
