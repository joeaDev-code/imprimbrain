# CT Frontend Migration Plan

The new entry points are `/ct/admin`, `/ct/officer`, `/ct/secretary`, and `/super-admin`. The legacy `/admin/**` pages remain in place during this shell phase to avoid moving business modules prematurely.

The CT sidebar is permission-filtered. For now, known CT child routes call the server permission helper and then redirect to their legacy page:

- `clients` -> `/admin/clients` (`CLIENTS_VIEW`)
- `prestations` -> `/admin/prestations` (`ORDERS_VIEW`)
- `prestations/nouveau` -> `/admin/prestations/nouveau` (`ORDERS_CREATE`)
- `services` -> `/admin/services` (`SERVICES_VIEW`)
- `depenses` -> `/admin/depenses` (`EXPENSES_VIEW`)
- `stock` -> `/admin/stock` (`STOCK_VIEW`)
- `employes` -> `/admin/employes` (`EMPLOYEES_VIEW`)
- `audit` -> `/admin/audit` (`AUDIT_VIEW`)
- `parametres` -> `/admin/parametres` (`SETTINGS_VIEW`)

The next phase should migrate each module to `app/ct/[role]/<module>/page.tsx` incrementally, replace its transitional redirect, and use `requireCTPermission()` in the server page or route. `Organization` currently has no logo column, so the CT provider exposes `logo: null`; this phase intentionally adds no schema field or migration.

The Super Admin route group has its own server gate and layout. It does not mount the CT store, CT provider, CT sidebar, or CT permission navigation.
