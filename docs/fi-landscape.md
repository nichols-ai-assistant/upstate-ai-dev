# FI AI Landscape — Technical Reference

The FI AI Landscape is a static, client-side vendor intelligence tool published as part of the Upstate AI site. It maps 470+ vendors and 500+ products across the community banking and credit union AI ecosystem.

---

## Architecture

**Single-file app.** All UI logic lives in `fi-landscape.html`. No framework, no build step, no server-side rendering. The page ships as a standalone GitHub Pages static site.

**Data pipeline:**
```
landscape.db (SQLite, source of truth)
  → export-landscape.js (Node script)
  → fi-landscape-data.json (static asset, loaded at runtime)
  → fi-landscape.html (reads JSON via fetch(), renders to DOM)
```

The database is the only place data is edited. The JSON export is generated after every DB change and committed alongside it. The HTML file never touches the DB directly.

**Deployment:** `upstate-ai-dev` repo → GitHub Pages at `nichols-ai-assistant.github.io/upstate-ai-dev/fi-landscape`. Changes propagate in ~2 minutes after `git push origin main`.

---

## Data Model

### vendors

| Column | Type | Description |
|--------|------|-------------|
| vendor_id | INTEGER PK | Auto-increment |
| name | TEXT | Company name |
| homepage_url | TEXT | Primary website |
| logo_url | TEXT | Path to logo (local or external) |
| hq_city / hq_state | TEXT | Headquarters location |
| status | TEXT | `active`, `legacy`, `deprecated`, `sunset`, `defunct` |
| founded_year | INTEGER | Optional |

**Status semantics:**
- `active` — operating, in-market product
- `legacy` — acquired or rebranded; product still exists under new parent
- `deprecated` — acquired, brand absorbed; product discontinued or merged
- `defunct` — company no longer operating; no acquisition

### products

| Column | Type | Description |
|--------|------|-------------|
| product_id | INTEGER PK | Auto-increment |
| vendor_id | INTEGER FK | Parent vendor |
| product_name | TEXT | Display name |
| description | TEXT | One-sentence summary |
| fi_segment | TEXT | `banks`, `credit_unions`, or `both` |
| pervasiveness_tier | INTEGER | 1–6 adoption scale (see tiers) |
| is_ai | INTEGER | 1 = AI product, 0 = supporting infrastructure |
| has_mcp | INTEGER | 1 = MCP-enabled integration |
| status | TEXT | `active`, `legacy`, `deprecated`, `sunset` |
| is_primary | INTEGER | Primary product for the vendor (set in product_categories) |

### categories

Two-tier taxonomy. T1 categories are top-level domains; T2 subcategories sit under each T1.

| Column | Type | Description |
|--------|------|-------------|
| category_id | INTEGER PK | |
| tier | INTEGER | 1 = T1, 2 = T2 |
| code | TEXT UNIQUE | e.g. `T1-03`, `T2-03f` |
| parent_id | INTEGER FK | T2 rows reference their T1 parent |
| name | TEXT | Display name |
| scope | TEXT | One-line definition of what belongs here |
| description | TEXT | Longer overview |
| ai_opportunities | TEXT | AI use cases specific to this category |

**Current taxonomy:** 12 T1 categories, 49 T2 subcategories.

### product_categories

Many-to-many join between products and categories. The `is_primary = 1` flag marks the category used for primary card placement and modal display.

### product_competitors

Explicit competitor relationships between products.

| Column | Type | Description |
|--------|------|-------------|
| product_id | INTEGER | The product |
| competing_product_id | INTEGER | A competing product |
| basis | TEXT | `category`, `manual`, or `inferred` |

Relationships are directional but the UI treats them symmetrically — clicking "Show Competitors" on product A shows all products that list A as a competitor AND all products that A lists.

### product_integrations

Integration relationships between products or vendor platforms.

| Column | Type | Description |
|--------|------|-------------|
| product_id | INTEGER | The integrating product |
| integrates_with_product_id | INTEGER | Specific product (nullable) |
| integrates_with_vendor_id | INTEGER | Platform-level (nullable) |
| integration_type | TEXT | `native`, `api`, `certified`, `informal` |

One of the two target columns must be non-null.

### Pervasiveness Tiers

| Tier | Label | FI Range |
|------|-------|----------|
| 1 | Emerging | 1–5 FIs |
| 2 | Growing | 5–25 FIs |
| 3 | Moderate | 25–100 FIs |
| 4 | Established | 100–250 FIs |
| 5 | Dominant | 250–1,000 FIs |
| 6 | Ubiquitous | 1,000+ FIs |

---

## JSON Export Format

`fi-landscape-data.json` is the runtime data source. Structure:

```json
{
  "meta": {
    "generated_at": "2026-05-16T17:00:00Z",
    "vendor_count": 470,
    "product_count": 512
  },
  "categories": [
    {
      "code": "T1-03",
      "name": "Customer Experience",
      "description": "...",
      "ai_opportunities": "...",
      "subcategories": [
        {
          "code": "T2-03f",
          "name": "Print, Mail & Member Communications",
          "scope": "...",
          "description": "...",
          "ai_opportunities": "...",
          "vendors": [
            {
              "vendor_id": 123,
              "name": "HC3",
              "homepage_url": "https://hc3.com",
              "logo_url": "/fi-landscape-logos/hc3.png",
              "hq_city": "Cincinnati",
              "hq_state": "OH",
              "status": "active",
              "products": [
                {
                  "product_id": 456,
                  "product_name": "HC3 Platform",
                  "description": "...",
                  "fi_segment": "both",
                  "pervasiveness_tier": 3,
                  "is_primary": 1,
                  "mcp_enabled": false,
                  "status": "active",
                  "competitor_ids": [789, 101],
                  "integration_ids": [202, 303]
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

Each vendor appears once per T2 subcategory it participates in. A vendor with products in two T2s appears in both T2 vendor arrays.

---

## Filter System

Seven independent filter dimensions. All filters are ANDed together. The grid re-renders on every filter change.

### 1. Search

- Debounced 180ms after last keystroke
- Matches against: vendor name, product name, product description
- Case-insensitive substring match
- Searches the data array, not the DOM

### 2. Category (T1)

- "All" or one of 12 T1 categories
- Selecting a T1 shows only sections belonging to that category
- Clears any active T2 filter

### 3. Tier

- "All" or one of 6 pervasiveness tiers
- Filters by primary product tier
- Buttons have tier-specific active colors

### 4. Segment

- `all` / `banks` / `credit_unions` / `both`
- `both` means "products serving both banks and credit unions"
- A vendor matches if any of its products match the selected segment

### 5. T2 Subcategory (implicit)

- Activated by clicking a subcategory header in the grid
- Dims all other T2 blocks to 25% opacity
- Cleared when T1 filter changes or Reset is clicked

### 6. Competitor Filter

- Activated from a vendor card modal via "Show Competitors"
- Shows only vendors whose products appear in the source product's `competitor_ids`
- Source vendor always passes through (highlighted with orange border)
- Grid is scoped to only the T2 subcategories the source product belongs to

### 7. Ecosystem Filter

- Activated from a vendor card modal via "Show Ecosystem"
- Shows only vendors whose products appear in the source product's `integration_ids`
- Same T2 scoping and source-vendor passthrough as competitor filter

### Defunct Vendor Exclusion

Vendors with `status = 'defunct'` are unconditionally hidden from all views. The `vendorVisible()` function returns `false` for defunct vendors before any other filter is evaluated. There is no UI control to show defunct vendors.

### Filter Chips

Active filters are displayed as removable chips below the filter bar. Each chip has an `×` dismiss button that clears only that filter. Chips appear for: competitor filter, ecosystem filter, T2, T1, tier, segment, search. The chips row is always visible; the filter panel above it is collapsible.

### Reset Button

Appears when any non-default filter is active. Clears all filters and returns to the full unfiltered view.

### Empty State

When no vendors match the combined filters, a "No products found" state is shown with a "Reset Filters" button.

---

## Filter Panel

The filter panel is collapsible. State is persisted in `localStorage` under the key `fi-filters-expanded`.

**Auto-collapse triggers:** Selecting a T1 category, tier, or segment automatically collapses the panel. Clicking "Apply" collapses it manually.

**Pulse behavior:** On page load, if the panel starts collapsed, the filter toggle bar pulses for 10 seconds to draw attention. The pulse also stops when the user scrolls past the hero section.

---

## Vendor Cards

Each vendor is rendered as a card inside its T2 subcategory block.

**Card contents:**
- Logo (image if available, initials fallback)
- Product name (primary product's name, not the company name)
- Adoption tier dot (colored, with tooltip showing tier label)
- Segment badges: `BANK`, `CU`, or both
- `MCP Enabled` badge if the primary product has MCP integration

**Card states:**
- Default: clickable, opens vendor modal
- `deprecated`: 40% opacity, grayscale, not clickable
- `filter-source`: orange border/shadow — the vendor whose modal triggered the current competitor or ecosystem filter

**Card sort order within each T2 block:** Descending by pervasiveness tier, then alphabetical by product name.

---

## Vendor Detail Modal

Opens on card click. Shows:

- Vendor logo and product name
- Tier label and adoption description
- Segment (Banks Only / Credit Unions Only / Banks & Credit Unions)
- HQ location (city, state)
- Category path (T1 > T2)
- Product description
- MCP Enabled badge (if applicable)
- "Show Competitors" button (disabled if no competitors are tracked)
- "Show Ecosystem" button (disabled if no integrations are tracked)

**Show Competitors:** Closes the modal, resets all other filters, applies the competitor filter for the viewed product, scrolls to the top of the product canvas.

**Show Ecosystem:** Same behavior for the ecosystem/integration filter.

**Close:** X button, backdrop click, or Escape key. Does not affect filter state.

---

## Category Info Modal

Clicking a T1 or T2 section header in the grid opens a category info modal showing:

- Category name and parent T1 (for T2)
- Overview / scope description
- AI Opportunities specific to that category
- "Show Vendors →" button: closes the modal and applies the T1 or T2 filter

---

## Disclaimer Modal

Accessible via the "Disclaimer" button in the filter toggle bar. States that Upstate AI has no commercial relationships with vendors, all data is from public sources, and vendors can send corrections to `ben@up-state-ai.com`.

---

## Scroll Behavior

`scrollToGrid()` scrolls to the top of the product canvas (just below the navbar) using `filterBar.offsetTop - NAVBAR_H - 8`. `offsetTop` is used rather than `getBoundingClientRect().top` because the filter bar is `position: sticky` — once scrolled past, `getBoundingClientRect().top` always returns the stuck value (60px), making the computed target equal to the current scroll position.

---

## Logo Resolution

Logos are stored in `/fi-landscape-logos/` as `.png` files fetched during initial setup via a Node script (`fetch-logos.js`). Fetch order: Clearbit logo API → Google favicon fallback. Vendors with no fetchable logo fall back to a colored initials box (2–3 letter abbreviation of the company name).

---

## Data Maintenance Workflow

1. Edit data in `landscape.db` (SQL `UPDATE` / `INSERT`)
2. Run `node export-landscape.js` to regenerate `fi-landscape-data.json`
3. `git add landscape.db fi-landscape-data.json && git commit && git push origin main`
4. GitHub Pages propagates in ~2 minutes

The JSON file and DB are always committed together. The JSON is the deployed artifact; the DB is the source of truth. Never edit the JSON directly.

---

## Analytics

Google Analytics (GA4, property `G-KKZRVLYRV0`) is loaded via the standard gtag.js snippet. CSP allows outbound connections to `google-analytics.com` and related domains.

---

## Security Headers

Set via `<meta>` tags:
- `Content-Security-Policy`: restricts scripts to self + Google Analytics; images allowed from any HTTPS source; no inline styles from untrusted sources
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`

---

## Responsive Behavior

- **Desktop (≥1024px):** Vendor grid uses `auto-fill, minmax(140px, 1fr)`; filter toggle bar is 36px tall
- **Tablet (≤768px):** Grid shrinks to `minmax(110px, 1fr)`; modal slides up from bottom as a sheet; filter rows stack vertically
- **Mobile (≤480px):** Grid shrinks to `minmax(95px, 1fr)`
