# Troney

## Overview

Reworking this in React. Original project [made with Nuxt](https://github.com/brunobragaw8t/troney).

Troney (word-play for tracking money) is an expense tracker web app focused on a
simple and fast UI to keep my life on track.

Some of its features are:

- Record earnings, expenses and movements;
- Separate money by wallets;
- Organize expenses with buckets and categories;
- Monthly graphs;
- Keyboard shortcuts for navigating the UI.

Here's a [demo](https://troney.vercel.app/),
and here's the [Storybook](https://troney-storybook.vercel.app/)

## ToDo and milestones

- [x] Validate environment variables
- [x] Setup Prettier
- [x] Setup Tailwind
- [x] Install icons
- [x] Setup router
- [x] Setup Storybook
- [x] Add auth
- [x] Define categories schema
- [x] Create categories CRUD
- [x] Seed default categories for user
- [ ] Create wallets CRUD
- [ ] Seed default wallets for user
- [ ] Emoji in categories (to serve as icons when minimized)
- [ ] Create buckets CRUD
- [ ] Seed default buckets for user
- [ ] Create earnings CRUD
- [ ] Prevent registering earnings if buckets aren't 100%
- [ ] Create expenses CRUD
- [ ] Create movements CRUD
- [ ] Format currency consistently
- [ ] Paginate data tables
- [ ] Add autocomplete of previously registered expenses, with price
- [ ] View history of prices
- [ ] Keyboard navigation in lists
- [ ] Charts per month, trimester, semester and year
- [ ] Switch between pie and bar chart
- [ ] OCR
- [ ] Extraordinary expense (doesn't count toward average)
- [ ] Line chart of balance across wallets (with average growth per month)
- [ ] Mark expenses as recurring
- [ ] Line chart of recurring bills going up and down (e.g. to track electricity consumption and water usage)
- [ ] Semi-automate the registration of a recurring expense

## Technologies

- [React](https://react.dev/)
- [TanStack Router](https://tanstack.com/router/)
- [Convex](https://www.convex.dev/)
- [Tailwind CSS](https://tailwindcss.com/)

## Key decisions

- No shadcn/ui, to learn more about accessibility;
- No animations nor transitions, focusing on simplicity;
- Desktop-first experience, focused on keyboard navigation and accessibility.
