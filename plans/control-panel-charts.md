# Plan: Control Panel Charts

> Source PRD: `prds/control-panel-charts.md`

## Architectural decisions

- **Library:** recharts (new dependency, install via `bun add recharts`)
- **Placement:** Both charts stacked vertically below "Your buckets" section on `/control-panel`
- **Data layer:** Two new Convex queries doing server-side aggregation, using `by_userId_date` composite indexes with date range filtering (e.g., `.gte("date", "2026-04-01").lt("date", "2026-05-01")`)
- **Monetary values:** Stored in cents (integers); convert to display units (divide by 100) on client
- **Date filtering:** String prefix comparison on `YYYY-MM-DD` date fields to filter by calendar month
- **Chart components home:** `src/components/analytics/`
- **Styling:** Match existing dark theme -- dark card backgrounds, teal accents, existing card border patterns
- **Empty state:** Text message instead of rendering empty chart
- **No animations/transitions** per project convention
- **Desktop-only**, use recharts `ResponsiveContainer` for basic width adaptation

---

## Phase 1: Earnings vs Expenses (current month)

**User stories**: 1, 2, 3, 4, 9, 10

### Step 1: Install recharts

Install recharts as dependency via `bun add recharts`.

#### Acceptance criteria

- [ ] recharts appears in `package.json` dependencies
- [ ] `bun install` succeeds without errors

### Step 2: Convex query `getEarningsVsExpenses`

Create query that sums all earnings and all expenses for the current calendar month. Returns `{ earnings: number, expenses: number }` (in cents). Month boundaries computed server-side from current date.

#### Acceptance criteria

- [ ] Query uses `by_userId_date` index with date range filter for current month
- [ ] Returns correct sums for earnings and expenses in cents
- [ ] Returns `{ earnings: 0, expenses: 0 }` when no data exists

### Step 3: Earnings vs Expenses chart component

Create chart component in `src/components/analytics/`. Vertical bar chart with 3 bars: Earnings (teal), Expenses (red/coral), Net (teal if positive, red if negative). Values displayed in EUR (cents / 100). Shows empty state message when both earnings and expenses are 0.

#### Acceptance criteria

- [ ] Earnings bar uses teal (`primary-1` / `#2dd4bf`)
- [ ] Expenses bar uses red/coral
- [ ] Net bar is teal when positive, red when negative
- [ ] Values displayed in EUR (divided by 100)
- [ ] Empty state shows "No data yet" message instead of chart
- [ ] Uses `ResponsiveContainer` for width adaptation
- [ ] No animations/transitions

### Step 4: Integrate on control panel

Add chart below "Your buckets" section on control panel page. Wire up Convex query. Match existing card styling (dark bg, section header pattern with icon).

#### Acceptance criteria

- [ ] Chart appears below "Your buckets" section
- [ ] Card styling matches existing dark theme pattern
- [ ] Section has header with icon consistent with other sections
- [ ] Data loads from Convex query

---

## Phase 2: Category Spending vs 6-Month Average

**User stories**: 5, 6, 7, 8, 9, 10

### Step 1: Convex query `getCategorySpending`

Create query that returns per-category expense totals for: (a) current calendar month, (b) average of 6 previous complete calendar months. Returns array of `{ categoryId, name, color, icon, thisMonth: number, sixMonthAvg: number }` sorted alphabetically by name. All categories included even if 0 expenses.

#### Acceptance criteria

- [ ] Query uses `by_userId_date` index with date range filter spanning current month and 6 previous months
- [ ] Correctly computes per-category sums for current month
- [ ] Correctly computes per-category average over 6 previous complete months (excludes current month from average)
- [ ] All categories appear in results, even those with 0 expenses in both periods
- [ ] Results sorted alphabetically by category name
- [ ] Returns empty array when no categories exist

### Step 2: Category Spending chart component

Create chart component in `src/components/analytics/`. Horizontal bar chart with two bars per category: "This month" uses category's own `color` field, "6-month avg" uses muted/lighter version of category color. Shows empty state when no categories exist.

#### Acceptance criteria

- [ ] Horizontal bar chart with two bars per category
- [ ] "This month" bar uses category's own color
- [ ] "6-month avg" bar uses muted/lighter version of category color
- [ ] All categories shown, including those with 0 expenses
- [ ] Categories sorted alphabetically by name
- [ ] Values displayed in EUR (divided by 100)
- [ ] Empty state shows "No data yet" message instead of chart
- [ ] Uses `ResponsiveContainer` for width adaptation
- [ ] No animations/transitions

### Step 3: Integrate on control panel

Add chart below "Earnings vs Expenses" chart on control panel. Wire up Convex query. Match existing card styling.

#### Acceptance criteria

- [ ] Chart appears below Earnings vs Expenses chart
- [ ] Card styling matches existing dark theme pattern
- [ ] Section has header with icon consistent with other sections
- [ ] Data loads from Convex query

### Step 4: Update README.md

Update README todo list to reflect completed/added items.

#### Acceptance criteria

- [ ] README.md todo list updated
