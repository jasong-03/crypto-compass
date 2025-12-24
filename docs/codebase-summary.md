# Codebase Summary

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Browser                             │
│                         (Index Page)                             │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ├─ DashboardHeader (token count, refresh)
                         ├─ SentimentLegend (color key)
                         │
                         ├─ TokenTable ◄─────────────────┐
                         │    ├─ TokenRow (per token)    │
                         │    └─ OnchainDetailModal      │
                         │                                │
                         └─ Pagination Controls          │
                                                          │
                         ┌────────────────────────────────┘
                         │
                    useCryptoData Hook
                         │
         ┌───────────────┴───────────────┐
         │                               │
    TanStack Query              TanStack Query
    (Fundamental)               (Onchain)
         │                               │
         ├─ fetch /fact_q_score         ├─ fetch /netflow_intelligence
         │  (paginated)                 │  (limit=100)
         │                               │
         └───────────────┬───────────────┘
                         │
                Data Merging & Enrichment
                         │
         ┌───────────────┴──────────────┐
         │                              │
    Sentiment Calculation         Token Map Creation
    (lib/sentiment.ts)           (fundamental lookup)
         │                              │
         │ - calculateFundamentalSentiment()
         │ - calculateOnchainSentiment()
         │ - calculateOverallSentiment()
         │                              │
         └───────────────┬──────────────┘
                         │
                  TokenData[] Array
                  (unified interface)
                         │
                         ▼
                  Component Rendering
```

## Component Hierarchy

```
App (React Router)
│
└── Index Page
    │
    ├── DashboardHeader
    │   ├── Refresh button (manual refetch)
    │   └── Token count display
    │
    ├── SentimentLegend
    │   └── Badge examples (bullish/bearish/neutral)
    │
    ├── TokenTable
    │   ├── Table (shadcn/ui)
    │   ├── TableHeader (column definitions)
    │   ├── TableBody
    │   │   ├── LoadingSkeleton (8 rows)
    │   │   └── TokenRow[] (per token)
    │   │       ├── Token info (logo, symbol, protocol)
    │   │       ├── Price display
    │   │       └── SentimentBadge × 4 (F/O/T/Overall)
    │   │
    │   └── OnchainDetailModal
    │       ├── Dialog (shadcn/ui)
    │       ├── Token header info
    │       └── Detailed onchain metrics
    │
    └── Pagination
        ├── PaginationPrevious
        ├── PaginationLink[] (page numbers)
        └── PaginationNext
```

## Data Flow Explanation

### 1. Initial Load Sequence

```
User loads page
    ↓
Index component mounts
    ↓
useCryptoData(page=1) hook executes
    ↓
┌─────────────────────────────┐
│ TanStack Query Manager      │
│                             │
│ [1] fundamentalQuery ────→ fetch /fact_q_score?page=1&limit=20
│                               ↓
│                          FundamentalToken[]
│                               ↓
│ [2] onchainQuery ────────→ fetch /netflow_intelligence?limit=100
│                               ↓
│                          OnchainToken[]
└─────────────────────────────┘
    ↓
Data merging in useCryptoData:
    ↓
    1. Build fundamentalMap (Map<protocol, FundamentalToken>)
    2. Iterate onchainQuery.data (primary source)
    3. For each onchain token:
        - Lookup fundamental data by protocol key
        - Calculate fundamental sentiment (if found)
        - Use onchain overall_sentiment (or calculate)
        - Set technical = 'neutral'
        - Calculate overall sentiment (majority vote)
        - Create TokenData object
    ↓
Return { tokens: TokenData[], pagination, isLoading, isError, refetch }
    ↓
TokenTable receives tokens[]
    ↓
Render TokenRow for each token
```

### 2. Sentiment Calculation Flow

```
Raw API Data
    ↓
┌──────────────────────────────────────────────────────────────┐
│ Fundamental Sentiment (lib/sentiment.ts)                      │
│                                                                │
│ Input: rank_description (e.g., "Top 5%")                      │
│ Logic:                                                         │
│   - "Top 5%" or "Top 10%" → bullish                          │
│   - "Top 20-50%" → neutral                                    │
│   - "Top 50%+" or "Bottom X%" → bearish                      │
│ Output: SentimentType                                         │
└──────────────────────────────────────────────────────────────┘
    ↓
┌──────────────────────────────────────────────────────────────┐
│ Onchain Sentiment (lib/sentiment.ts)                          │
│                                                                │
│ Input: OnchainToken with *_chg_7h fields                     │
│ Logic:                                                         │
│   - For each _chg_7h field:                                   │
│     • value < 0 → bullish (buying pressure)                   │
│     • value > 0 → bearish (selling pressure)                  │
│     • value = 0 or null → neutral                             │
│   - Count sentiments across all fields                        │
│   - Majority voting:                                          │
│     • bullish_count highest → bullish                         │
│     • neutral_count highest → neutral                         │
│     • bearish_count highest → bearish                         │
│ Output: SentimentType                                         │
└──────────────────────────────────────────────────────────────┘
    ↓
┌──────────────────────────────────────────────────────────────┐
│ Technical Sentiment                                            │
│                                                                │
│ Currently hardcoded: 'neutral'                                │
│ Future: RSI, MACD, MA calculations                            │
└──────────────────────────────────────────────────────────────┘
    ↓
┌──────────────────────────────────────────────────────────────┐
│ Overall Sentiment (lib/sentiment.ts)                          │
│                                                                │
│ Input: fundamental, onchain, technical sentiments             │
│ Logic:                                                         │
│   - Count occurrences of each sentiment type                  │
│   - Find maximum count                                        │
│   - If tie (including neutral) → neutral                      │
│   - Otherwise → sentiment with max count                      │
│ Output: SentimentType                                         │
└──────────────────────────────────────────────────────────────┘
    ↓
Final TokenData object with all sentiments
```

### 3. User Interaction Flow

```
User clicks TokenRow
    ↓
handleRowClick(token) triggered
    ↓
setSelectedToken(token)
setModalOpen(true)
    ↓
OnchainDetailModal renders
    ↓
Display token.onchainData
    ↓
Show all _chg_7h metrics
Show calculated sentiments per field
```

### 4. Refresh Flow

```
User clicks refresh button (DashboardHeader)
    ↓
onRefresh() callback triggered
    ↓
refetch() from useCryptoData
    ↓
TanStack Query invalidates cache
    ↓
Re-fetches both APIs
    ↓
Re-calculates all sentiments
    ↓
Updates UI with new data
```

## Key Modules and Responsibilities

### Core Hooks (`src/hooks/`)

**`useCryptoData.ts`** (177 lines)
- **Responsibility:** Primary data fetching and aggregation
- **Key Functions:**
  - `fetchFundamentalData(page)`: Fetches paginated fundamental data
  - `fetchOnchainData()`: Fetches all onchain data (limit=100)
  - `useCryptoData(page)`: Main hook orchestrating data flow
- **Returns:** `{ tokens, pagination, isLoading, isError, error, refetch }`
- **Dependencies:** TanStack Query, sentiment calculation functions

**`useOnchainData.ts`**
- **Responsibility:** Fetch individual token onchain details for modal
- **Used By:** OnchainDetailModal component

**`use-toast.ts`**
- **Responsibility:** Toast notification state management
- **Type:** shadcn/ui generated hook

**`use-mobile.tsx`**
- **Responsibility:** Mobile viewport detection
- **Type:** shadcn/ui responsive utility

### Sentiment Logic (`src/lib/`)

**`sentiment.ts`** (117 lines)
- **Responsibility:** All sentiment calculation algorithms
- **Key Functions:**
  - `calculateFundamentalSentiment(rankDescription)`: Parses rank percentile
  - `calculateOnchainSentiment(token)`: Analyzes flow changes
  - `calculateOverallSentiment(f, o, t)`: Majority voting
- **Algorithm Details:**
  - Fundamental: String parsing of percentile ranges
  - Onchain: Majority vote across _chg_7h fields (negative = bullish)
  - Overall: Majority vote with neutral tie-breaking

**`utils.ts`**
- **Responsibility:** Utility functions
- **Key Function:** `cn()` - TailwindCSS class merger using clsx + tailwind-merge

### Type Definitions (`src/types/`)

**`crypto.ts`** (28 lines)
- **Responsibility:** TypeScript interfaces for all data structures
- **Key Types:**
  - `SentimentType`: Union type ('bullish' | 'bearish' | 'neutral')
  - `FundamentalToken`: API response shape from /fact_q_score
  - `OnchainToken`: API response shape from /netflow_intelligence
  - `TokenData`: Unified interface for UI rendering

### Custom Components (`src/components/`)

**`DashboardHeader.tsx`**
- **Props:** `tokenCount`, `isLoading`, `onRefresh`
- **Renders:** Title, subtitle, token count, refresh button
- **Features:** Loading state indicator

**`TokenTable.tsx`**
- **Props:** `tokens`, `isLoading`
- **Renders:** Table structure, loading skeletons, token rows
- **State:** Selected token, modal open state
- **Features:** Click handling, modal trigger

**`TokenRow.tsx`**
- **Props:** `token`, `onRowClick`
- **Renders:** Single table row with token info and sentiment badges
- **Features:** Hover effects, cursor pointer, click handler

**`SentimentBadge.tsx`**
- **Props:** `sentiment` (SentimentType)
- **Renders:** Color-coded badge with sentiment label
- **Styling:**
  - Bullish: Green (#10b981)
  - Bearish: Red (#ef4444)
  - Neutral: Gray (#6b7280)

**`SentimentLegend.tsx`**
- **Props:** None
- **Renders:** Explanation card with badge examples
- **Purpose:** User education on color coding

**`OnchainDetailModal.tsx`**
- **Props:** `token`, `open`, `onOpenChange`
- **Renders:** Dialog with detailed onchain metrics
- **Features:** JSON-like display of all token fields, responsive layout

**`NavLink.tsx`**
- **Props:** Standard link props
- **Purpose:** Reusable navigation link component

### shadcn/ui Components (`src/components/ui/`)

52 components including:
- Layout: `card`, `table`, `sheet`, `tabs`, `accordion`
- Forms: `input`, `label`, `select`, `checkbox`, `radio-group`, `switch`
- Feedback: `alert`, `toast`, `skeleton`, `progress`
- Overlays: `dialog`, `popover`, `tooltip`, `hover-card`
- Navigation: `pagination`, `navigation-menu`
- Data: `chart` (recharts wrapper)

### Pages (`src/pages/`)

**`Index.tsx`** (132 lines)
- **Responsibility:** Main dashboard page
- **State:** `currentPage` for pagination
- **Renders:** Complete dashboard layout
- **Features:** Error handling, pagination, footer

**`NotFound.tsx`**
- **Responsibility:** 404 error page
- **Usage:** React Router fallback

### Mock Data (`src/data/`)

**`mockData.ts`**
- **Responsibility:** Development fallback data
- **Contains:** `mockFundamentalData`, `mockOnchainData`
- **Status:** Currently disabled (USE_MOCK_DATA = false)

## Build System

**Entry Point:** `src/main.tsx`
- React 18 StrictMode
- TanStack QueryClientProvider
- React Router setup

**App Root:** `src/App.tsx`
- Route configuration
- Layout wrapper

**Styling:** `src/index.css`
- TailwindCSS directives
- Custom CSS variables (shadcn/ui theme)
- Global styles

**Build Tool:** Vite
- Fast HMR in development
- Optimized production builds
- SWC-based React plugin for performance

## State Management Architecture

**Server State:** TanStack React Query
- Cache management (5-minute stale time)
- Automatic refetching
- Loading/error states
- Retry logic (2 attempts)

**UI State:** React Hooks
- `useState`: Page number, modal state, selected token
- `useCryptoData`: Custom hook encapsulating query logic

**No Global State:**
- No Redux, Zustand, or Context API
- Component composition for prop drilling
- TanStack Query handles all async state

## API Integration Strategy

**Parallel Fetching:**
- Fundamental and onchain queries run simultaneously
- Reduces total load time
- Independent error handling

**Data Merging:**
- Onchain data is primary source (48 tokens)
- Fundamental data enriches onchain tokens
- Fallback to neutral sentiment if fundamental data missing

**Error Handling:**
- Per-query error states
- Combined error display in UI
- Automatic retry with exponential backoff (TanStack default)

**Caching:**
- 5-minute stale time (configurable)
- Cache persists across page navigation
- Manual refetch clears cache

---

**Document Version:** 1.0
**Last Updated:** 2025-12-23
