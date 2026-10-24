# KHAZI — Frontend Design Specification

## 1. Product direction

Design a responsive **personal banking and money-management website** inspired by the supplied mobile UI reference.

The reference combines three core experiences:
1. **Home dashboard** — cash balance, quick money actions, people/recipients, account overview, and recent activity.
2. **Activity analytics** — spending and income chart, period filters, summary metrics, and transaction history.
3. **Add money flow** — amount presets, a primary action, and alternative deposit methods.

The website should preserve the same visual identity while using a desktop layout. **Do not enlarge the mobile screens and use them as a website.** Recompose the experience for a wide viewport with responsive behavior for tablet and mobile browsers.

## 2. Visual design system

### Overall style
- Modern digital banking / fintech.
- Calm, trustworthy, minimal, and slightly organic.
- Light gray-green page surfaces, white cards, and deep forest-green accents.
- Rounded corners, restrained shadows, generous spacing, and clean typography.
- Use bright lime only for key highlights, positive metrics, or selected states.

### Color palette

Suggested starting tokens, approximated from the reference:

| Token | Suggested value | Use |
|---|---|---|
| `--color-forest` | `#14270B` | Primary buttons, card backgrounds, dark surfaces |
| `--color-forest-deep` | `#0C1B08` | Dark background and strong contrast |
| `--color-lime` | `#B8E83D` | Active states, chart highlight, positive accents |
| `--color-mint` | `#D8ECEA` | Secondary actions and soft accent backgrounds |
| `--color-page` | `#F2F3EE` | Main light-theme page background |
| `--color-surface` | `#FFFFFF` | Cards and panels |
| `--color-surface-muted` | `#E9EBE5` | Quiet panels and metric surfaces |
| `--color-text` | `#171A15` | Main text |
| `--color-text-muted` | `#74786F` | Secondary labels and timestamps |
| `--color-border` | `#E3E5DE` | Subtle separators and borders |
| `--color-danger` | `#C84646` | Errors or negative financial changes |

Check contrast before implementation; adjust token values when necessary. Do not use lime as the color for long text.

### Typography
- Use a clean sans-serif such as **Inter**, **Manrope**, or a similar system font.
- Page titles: medium-to-bold, short, clearly hierarchical.
- Metric values: large, readable, and tabular-number friendly.
- Supporting labels and timestamps: smaller and muted, but never too faint to read.
- Use consistent number formatting for currency and dates.

### Shape, depth, and iconography
- Cards: approximately `16–24px` radius.
- Inputs and buttons: approximately `12–16px` radius.
- Use subtle borders; shadows should be light and sparse.
- Use consistent outline icons for home, activity, banking, account, add money, withdraw, and deposits.
- Use avatars only where they communicate account holders or recipients.
- Avoid excessive gradients. The reference's visual identity mainly comes from forest green, lime highlights, and softly layered surfaces.

## 3. Website application shell

### Desktop layout
Use a persistent **left sidebar** and a main content area.

Recommended shell:
- Sidebar: roughly `220–260px` wide.
- Top header: page title, optional search/date controls, notifications, and profile menu.
- Main content: max-width container with responsive grid columns.
- Keep the content aligned to a consistent grid and leave whitespace between major sections.

### Sidebar navigation
Product wordmark at the top, followed by:
- Home
- Activity
- Banking
- Accounts / Cards
- Settings

Use a clear active item with a forest-green or lime indicator. Include the user profile or help entry near the bottom if appropriate.

### Top header
Include:
- Current page title and optional short subtitle.
- Global search only if it serves real transaction/account use cases.
- Notifications.
- User avatar and profile menu.
- Optional date range or period selector on analytics pages.

### Responsive navigation
- **Desktop:** persistent sidebar.
- **Tablet:** narrower/collapsible sidebar.
- **Mobile web:** drawer or compact bottom navigation; do not show both a full sidebar and bottom navigation simultaneously.
- Keep critical money actions available without crowding the header.

## 4. Page A — Home dashboard

### Goal
Show the user's current balance and make common banking actions easy to find.

### Suggested desktop layout
1. Page greeting and account context.
2. A prominent balance card beside quick actions or an account summary.
3. Quick actions: `Add money`, `Withdraw`, and optionally `Transfer`.
4. Frequently used recipients / people.
5. Account overview cards.
6. Recent transactions table or list.

For large screens, use a two-column layout where useful; do not force every section into a narrow vertical stack.

### Balance card
- Label: `Cash balance`.
- Large balance value.
- Masked card/account number with a small dropdown when account selection is supported.
- Optional subtle abstract forest/leaf pattern in the card background.
- Keep decorative patterns low contrast so they do not reduce number readability.

### Quick actions
Use clearly labeled buttons:
- `Add money` — mint or pale-green secondary surface.
- `Withdraw` — mint or pale-green secondary surface.
- `Transfer` — optional action if supported.

Use icon + text. Buttons must be real controls, not decorative shapes.

### Frequent recipients
- Show a row or grid of recipient avatars.
- Include an `Add recipient` item.
- On wide screens, provide labels beneath avatars.
- On small screens, allow a horizontal scroll with sufficient touch targets.
- Provide a clear way to open a recipient or start a transfer.

### Account overview
Show compact account cards for supported categories, such as:
- Cash
- Investments
- Savings or other accounts

Each card should display its label and value, with a simple category icon or colored tile. Do not show categories that the product does not actually support.

### Recent transactions
Use a readable table on desktop and compact rows on mobile:
- Merchant or transaction name.
- Category or account.
- Date/time.
- Amount.
- Optional transaction type/status.

Add a `View all` link to the Activity page. Show incoming and outgoing amounts with text and/or icons as well as color.

## 5. Page B — Activity and analytics

### Goal
Help the user understand cash flow and navigate their transaction history.

### Suggested layout
- Header: `Your activity`.
- Period selector: `Day`, `Week`, `Month` or a date-range picker.
- Main income/expense chart.
- Summary metrics for income and expenses.
- Recent transaction list/table, with a `View all` action.
- Optional filter bar for account, category, transaction type, and date.

### Chart
- Use a clean line chart with distinct series for income and expenses.
- Reference direction: one dark/black line and one lime line on a light background.
- Include axis labels, tooltips, and a visible selected period.
- Keep the chart's gridlines subtle.
- Provide a legend and accessible text summary; don't rely on color alone.
- The chart should resize to the available width without clipping labels.

### Income and expense metrics
Two cards below or beside the chart:
- `Income` — total received during the selected period.
- `Expenses` — total spent during the selected period.

Use clear labels, currency formatting, and optional comparison with the previous period when the data exists.

### Transaction history
Desktop table columns can include:
- Transaction / recipient
- Date
- Account or category
- Status/type
- Amount

Support practical search and filters. On smaller screens, use a card or row layout that preserves the most important information.

## 6. Page C — Add money

### Goal
Make adding funds simple and clear, while explaining the available methods.

### Desktop experience
Present the action as a dedicated page or a centered right-side panel/modal over the relevant page. Avoid making a desktop form resemble a full-screen phone bottom sheet.

### Amount selection
- Heading: `Add money`.
- Brief helper text explaining the source or transfer timing.
- Preset amount buttons, for example `$10`, `$25`, `$50`, `$100`, `$200`, and `Custom`.
- Clearly show the selected amount.
- Allow a custom amount via a labeled currency input.
- Primary action: `Add money` or `Continue`, depending on the flow.

The reference uses example amounts; treat them as illustrative values, not fixed business requirements.

### Deposit methods
Show selectable method rows, such as:
- Bank transfer / linked bank
- Deposit cash at a supported retailer, if offered
- Deposit check, if supported

Each row should have an icon, title, short explanation, and chevron or selection control. Show only methods that the product actually provides.

### Confirmation and states
Include:
- Review of source and amount before final submission when appropriate.
- Clear success confirmation.
- Inline validation for invalid amounts.
- Loading, failure, retry, and cancellation states.
- Prevent accidental duplicate submissions.
- Never imply that a money movement completed before the backend confirms it.

## 7. Page D — Transaction details (recommended)

A web experience benefits from a dedicated transaction detail view accessible from Home and Activity.

Include:
- Merchant/recipient and amount.
- Date and status.
- Source or destination account.
- Category and reference information when available.
- Available actions such as `View receipt`, `Report a problem`, or `Repeat transfer`, only if supported.

On desktop, use a detail page, drawer, or modal. On mobile web, use a full-width detail view.

## 8. Reusable frontend components

Build reusable components to maintain consistency:
- `AppShell`
- `SidebarNavigation`
- `TopBar`
- `PageHeader`
- `BalanceCard`
- `QuickActionButton`
- `RecipientAvatar`
- `AccountSummaryCard`
- `TransactionTable`
- `TransactionRow`
- `PeriodSelector`
- `CashFlowChart`
- `IncomeExpenseCard`
- `AmountPresetGrid`
- `CurrencyInput`
- `DepositMethodRow`
- `ConfirmationDialog`
- `ToastNotification`
- `EmptyState`
- `LoadingSkeleton`
- `ErrorState`
- `ThemeToggle` (optional)

Use shared design tokens for colors, typography, spacing, border radius, shadows, and focus rings.

## 9. Interaction rules

- Navigation updates the page and the active nav state.
- `Add money`, `Withdraw`, and `Transfer` open the correct flow.
- Period filters update the chart and summary metrics together.
- Selecting an amount preset updates the displayed selected amount.
- Custom amount input validates currency and allowed limits.
- Clicking a transaction opens its details.
- `View all` opens the full activity list.
- Deposit-method selection changes the next step appropriately.
- Show a clear loading, success, validation, and error state for financial actions.
- Use confirmation for consequential money movement.
- Support keyboard navigation and visible focus states.
- Do not include non-functional buttons or links.

## 10. Responsive behavior

### Large desktop
- Sidebar plus main content.
- Balance card and account/quick-action cards can share a row.
- Activity chart and metrics can use a two-column layout.
- Transactions span the content area.

### Tablet
- Sidebar collapses or becomes a drawer.
- Summary cards use two columns.
- Chart and transaction content stack if needed.

### Mobile web
- Single-column content.
- Compact account summary.
- Quick actions remain prominent.
- Recipient row can scroll horizontally.
- Data tables transform into transaction rows/cards.
- Forms use full-width controls.
- Modals become full-width sheets/pages as space requires.
- No horizontal page overflow.

## 11. Accessibility and financial trust

- Meet WCAG contrast expectations for text and controls.
- Label every form input and include clear validation messages.
- Provide keyboard access and visible focus indicators.
- Add text summaries for charts.
- Do not use color as the only indicator of incoming/outgoing activity.
- Format currency and dates consistently.
- Use plain, neutral wording for transaction statuses.
- Mask sensitive financial identifiers by default.
- Never place real personal or financial information in design mock data.
- Show only verified account values and transaction statuses.

## 12. Suggested implementation sequence

1. Create color, typography, spacing, and radius tokens.
2. Build the responsive app shell and navigation.
3. Implement Home with balance, actions, recipients, overview cards, and transactions.
4. Build the Activity page and chart/period filters.
5. Build the Add Money flow, including validation and confirmation states.
6. Add transaction detail views and responsive layouts.
7. Test keyboard navigation, contrast, and small-screen behavior.
8. Connect components to actual data and backend operations.

## 13. Acceptance checklist

- [ ] The result is a responsive website, not a desktop-sized phone mockup.
- [ ] The dark forest-green and lime identity is preserved without compromising readability.
- [ ] Home makes balance and key money actions immediately visible.
- [ ] Activity combines analytics, period selection, summary metrics, and transaction history.
- [ ] Add Money supports preset and custom amounts with validation and clear next steps.
- [ ] Deposit methods are shown only when available.
- [ ] All money actions have loading, success, and error states.
- [ ] Components work on desktop, tablet, and mobile browsers.
- [ ] Sensitive values are treated carefully, and mock data is clearly illustrative.

---

**Design principle:** Keep the reference's organic forest-green identity, bright lime highlights, soft off-white surfaces, rounded cards, and straightforward money actions. Rebuild the composition around a desktop web sidebar and responsive content grid, with clear page-level flows for Home, Activity, and Add Money.
