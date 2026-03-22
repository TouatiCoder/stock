# Manual Test Checklist

## Setup
1. Run DB migrations.
2. Login as each role: `admin`, `site_manager`, `structural_engineer`.
3. Ensure company-scoped test data exists (projects, materials, users).

## QA
1. Create template at `/qa/templates`.
2. Create inspection at `/qa/inspections` (site manager/admin).
3. Record pass/fail results (engineer/admin).
4. Submit inspection for review.
5. Approve/reject as admin.
6. Create anomaly from failed result via API.
7. Assign corrective action from `/qa/anomalies`.
8. Close anomaly.

## Procurement
1. Submit purchase request at `/procurement/purchase-requests`.
2. Approve/reject in `/procurement/approvals` as admin.
3. Post goods receipt for approved request.
4. Create supplier invoice in `/procurement/invoices`.
5. Verify expense linkage through budget-vs-actual endpoint.

## Project Execution
1. Add/update/delete milestone in `/projects/{id}/execution`.
2. Update progress with valid 0-100 values.
3. Attempt invalid progress (<0 or >100) and verify rejection.
4. Update project status with valid transitions.
5. Log delay and verify notification created.

## Stock
1. Create and release reservation at `/stock/reservations`.
2. Attempt out movement without reservation and verify rejection.
3. Create count session at `/stock/count-sessions`.
4. Post variance and verify stock adjustment records.
5. Open `/stock/alerts` and verify low-stock alerts list.

## Reporting & Exports
1. Open `/reports` and load project summary + budget vs actual.
2. Download stock movements CSV.
3. Download procurement summary CSV.

## Notifications
1. Open `/notifications` and verify triggered notifications:
   - low stock
   - approval pending
   - anomaly created
   - project delayed
2. Mark one read.
3. Mark all read.

## Security & Audit
1. Verify unauthorized requests return 401.
2. Verify forbidden role actions return 403.
3. Verify sensitive mutations write entries in `platform_company_status_events`.