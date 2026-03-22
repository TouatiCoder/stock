# Backlog to Feature Mapping

## Workstream A - Engineering QA
- `inspection_templates`, `inspection_template_items`, `inspections`, `inspection_results`, `qa_anomalies`, `qa_corrective_actions`
- APIs:
  - `GET/POST /api/qa/templates`
  - `GET/PUT/DELETE /api/qa/templates/[id]`
  - `GET/POST /api/qa/inspections`
  - `GET/POST /api/qa/inspections/[id]/results`
  - `POST /api/qa/inspections/[id]/submit`
  - `POST /api/qa/inspections/[id]/approve`
  - `GET/POST /api/qa/anomalies`
  - `POST /api/qa/anomalies/[id]/assign`
  - `POST /api/qa/anomalies/[id]/close`
- UI:
  - `/qa/templates`
  - `/qa/inspections`
  - `/qa/anomalies`

## Workstream B - Procurement & Cost
- `purchase_requests`, `purchase_request_items`, `purchase_request_approvals`, `goods_receipts`, `goods_receipt_items`, `supplier_invoices`, `project_expenses`
- APIs:
  - `GET/POST /api/procurement/purchase-requests`
  - `POST /api/procurement/purchase-requests/[id]/approve`
  - `POST /api/procurement/goods-receipts`
  - `POST /api/procurement/supplier-invoices`
  - `GET /api/procurement/budget-vs-actual`
- UI:
  - `/procurement/purchase-requests`
  - `/procurement/approvals`
  - `/procurement/goods-receipts`
  - `/procurement/invoices`

## Workstream C - Project Execution
- `project_milestones`, `project_delay_logs`, `projects.progress_pct`
- APIs:
  - `GET/POST /api/projects/[id]/milestones`
  - `PUT/DELETE /api/projects/[id]/milestones/[milestoneId]`
  - `PATCH /api/projects/[id]/progress`
  - `GET/POST /api/projects/[id]/delays`
  - `PATCH /api/projects/[id]/status`
- UI:
  - `/projects/[id]/execution`

## Workstream D - Stock Workflow
- `stock_reservations`, `stock_count_sessions`, `stock_count_items`, `stock_adjustments`, `low_stock_alerts`
- APIs:
  - `POST /api/stock/reservations`
  - `POST /api/stock/reservations/[id]/release`
  - `POST /api/stock/movements`
  - `GET/POST /api/stock/count-sessions`
  - `POST /api/stock/count-sessions/[id]/post-variance`
  - `GET /api/stock/alerts`
- UI:
  - `/stock/reservations`
  - `/stock/count-sessions`
  - `/stock/alerts`

## Workstream E - Reporting & Exports
- APIs:
  - `GET /api/reports/project-summary`
  - `GET /api/reports/budget-vs-actual`
  - `GET /api/exports/stock-movements.csv`
  - `GET /api/exports/procurement-summary.csv`
- UI:
  - `/reports`

## Workstream F - Notifications
- `notifications`
- APIs:
  - `GET /api/notifications`
  - `POST /api/notifications/[id]/read`
  - `POST /api/notifications/read-all`
- UI:
  - `/notifications`

## Workstream G - Role Enforcement & Audit
- Deny-by-default role checks in all new mutation/read routes via `lib/backlog/security.ts`
- Audit writes on all sensitive mutations via `lib/backlog/audit.ts`
- Unauthorized/role tests in `tests/backlog/role-enforcement.test.ts`