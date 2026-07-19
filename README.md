# Troney

## Overview

Troney (word-play for tracking money) is an expense tracker web app focused on a
simple and fast UI to keep my life on track.

This project started as a spreadsheet, then moved to WordPress, evolved into a
[Nuxt app](https://github.com/brunobragaw8t/troney), got reworked and redesigned
in [Next.js](https://github.com/brunobragaw8t/troney-next) and finally migrated
to a blazingly fast React SPA, powered by Convex.

Some of its features are:

- Record earnings, expenses and movements;
- Separate money by wallets;
- Organize expenses with buckets and categories;
- Keyboard shortcuts for navigating the UI.

Here's a [demo](https://troney.vercel.app/),
and here's the [Storybook](https://troney-storybook.vercel.app/)

## ToDo and milestones

- [x] Add expense groups (for supermark groceries)
- [ ] Add profile page
- [ ] Allow to delete account
- [ ] Add autocomplete of previously registered expenses, with price
- [ ] View history of prices
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
