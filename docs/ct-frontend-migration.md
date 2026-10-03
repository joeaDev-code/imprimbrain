# CT Frontend Migration Plan

The organization workspace uses `/ct/admin`, `/ct/officer`, and `/ct/secretary`; Super Admin remains isolated at `/super-admin`.

CT child routes render the shared business modules directly and enforce their declared server permission. UI routes are built from the verified session role, never from a role segment supplied by the browser.

The next phase should migrate each module to `app/ct/[role]/<module>/page.tsx` incrementally, replace its transitional redirect, and use `requireCTPermission()` in the server page or route. `Organization` currently has no logo column, so the CT provider exposes `logo: null`; this phase intentionally adds no schema field or migration.

The Super Admin route group has its own server gate and layout. It does not mount the CT store, CT provider, CT sidebar, or CT permission navigation.
