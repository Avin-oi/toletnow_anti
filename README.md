# OwnersToLetNow.in – Owner Portal

> List your rental property in Salem for free. No broker, no commission.

**Live URL:** https://ownerstoletnow.in  
**Stack:** Vanilla HTML, CSS, JavaScript + Supabase

---

## Project Structure

```
ownerstoletnow/
├── index.html              # Owner landing page + Login/Signup auth
├── owner-profile.html      # Owner dashboard – manage listed properties
├── add-property.html       # (removed) Posting is handled from owner-profile.html
│
├── css/
│   ├── style.css           # Global design system (shared with tenant site)
│   ├── pages.css           # Shared layout styles
│   ├── owner-auth.css      # Auth section styles (login, signup, OTP)
│   └── owner-profile.css   # Owner dashboard styles
│
├── js/
│   ├── owner-auth.js       # Auth logic – login, signup, OTP, password reset
│   ├── owner-profile.js    # Dashboard – view/manage property listings
│   ├── add-property.js     # Add property form logic + image upload
│   ├── pages.js            # Shared page utilities
│   └── supabase-config.js  # ⚠️ LOCAL ONLY – never commit (gitignored)
│
└── assets/
    └── images/
        └── logo.png        # ToLetNow brand logo
```

---

## Local Setup

1. Clone the repo
2. Create `js/supabase-config.js` and fill in your Supabase credentials.
3. Run locally:
```bash
python -m http.server 8001
```
4. Open http://localhost:8001

---

## Auth Flow

1. Owner visits `index.html` → Login / Signup
2. On success → Redirected to `owner-profile.html` (dashboard)
3. From dashboard → "Add Property" → use the post form embedded in `owner-profile.html`
4. All data stored in **Supabase** `properties` + `users` tables

---

## Related Repos
- **Tenant Site:** https://github.com/Avin-oi/toletnow-in (toletnow.in)
