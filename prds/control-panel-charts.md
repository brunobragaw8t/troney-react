# Control Panel Charts

## Problem Statement

The control panel currently shows wallet balances and bucket statuses but provides no insight into spending patterns or income. The user has no way to see how much they earned vs spent in the current month, or how their category spending compares to recent history.

## Solution

Add two charts to the control panel using recharts, stacked vertically below existing content:

1. **Earnings vs Expenses** -- a bar chart showing total earnings, total expenses, and net difference for the current calendar month.
2. **Category Spending: This Month vs Average** -- a horizontal bar chart comparing amount spent per category this month against the average of the 6 previous complete calendar months.

## User Stories

1. As a user, I want to see my total earnings for the current month at a glance, so that I know how much income I received.
2. As a user, I want to see my total expenses for the current month at a glance, so that I know how much I spent.
3. As a user, I want to see the net difference between earnings and expenses, so that I know if I'm saving or overspending this month.
4. As a user, I want the net bar to be visually green/teal when positive and red when negative, so that I can instantly assess my financial health.
5. As a user, I want to see how much I spent per category this month, so that I can identify where my money is going.
6. As a user, I want to compare this month's category spending against the average of the 6 previous months, so that I can detect unusual spending patterns.
7. As a user, I want all my categories to appear in the chart even if they have 0 expenses, so that I have a complete view.
8. As a user, I want categories sorted alphabetically by name, so that I can easily find a specific category.
9. As a user, I want to see an empty state message when there is no data, so that I understand the chart isn't broken.
10. As a user, I want the charts to match the existing dark theme of the app, so that the UI feels consistent.

## Implementation Decisions

- **Library:** recharts (new dependency to install)
- **Placement:** Both charts stacked vertically below the existing "Your buckets" section on the control panel
- **Chart 1 -- Earnings vs Expenses (current month):**
  - Vertical bar chart with 3 bars: Earnings, Expenses, Net
  - Earnings bar: teal (`primary-1` / `#2dd4bf`)
  - Expenses bar: red/coral
  - Net bar: teal if positive, red if negative
  - Data for current calendar month only (no time range picker, no multi-month comparison)
- **Chart 2 -- Category Spending vs 6-Month Average:**
  - Horizontal bar chart, two bars per category
  - "This month" bar uses the category's own `color` field
  - "6-month avg" bar uses a muted/lighter version of the category color
  - All categories shown, even those with 0 expenses in both periods
  - Categories sorted alphabetically by name
  - "This month" = current calendar month
  - "6 previous months" = 6 complete calendar months excluding current (e.g., if April 2026, then Oct 2025 - Mar 2026)
- **Data layer:** Two new dedicated Convex queries for server-side aggregation:
  - `getEarningsVsExpenses` -- sums earnings and expenses for the current calendar month
  - `getCategorySpending` -- sums expenses per category for the current month and the 6 previous months, returns per-category totals with averages
  - Both queries filter using date string prefix matching (e.g., `"2026-04"`) against the `by_userId_date` indexes
- **Date format:** Dates stored as `YYYY-MM-DD` strings; filter by month using string prefix comparison
- **Monetary values:** Stored in cents (integers); convert to display units (divide by 100) on the client
- **Chart cards:** Match existing dark theme styling (dark background, teal accents, consistent card styling)
- **Empty state:** Show a message like "No data yet" instead of rendering an empty chart
- **Responsive:** Desktop-only, no special mobile handling. Use recharts `ResponsiveContainer` for basic width adaptation
- **No animations/transitions** (per existing project convention)

## Testing Decisions

No tests for v1.

## Out of Scope

- Multi-month time series / comparison over time
- Pie charts or chart type switching
- Time range picker
- Mobile responsive design
- Line charts (balance over time, recurring bills)
- Marking expenses as extraordinary (excluded from averages)

## Further Notes

- The `src/components/analytics/` directory already exists (empty) and is a natural home for chart components
- The README.md todo list should be updated with new completed/added items after implementation
- Category colors and icons are defined in schema and seeded on user creation (11 default categories)
