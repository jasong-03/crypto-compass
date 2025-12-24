# System Architecture

## Technical Architecture Overview

Crypto Compass is a single-page application (SPA) built on a modern React stack with server-side APIs for data retrieval. The architecture follows a three-tier pattern: presentation layer (React frontend), API layer (external microservices), and data layer (backend databases managed by API services).

```
┌────────────────────────────────────────────────────────────────────┐
│                         Presentation Layer                          │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    React Application (SPA)                    │  │
│  │                                                                │  │
│  │  ├─ Components (UI Rendering)                                 │  │
│  │  ├─ Hooks (State & Side Effects)                              │  │
│  │  ├─ TanStack Query (Server State Cache)                       │  │
│  │  └─ React Router (Client-side Routing)                        │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
│                              ▼ HTTPS                                │
└────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│                          API Layer (External)                       │
│                                                                      │
│  ┌────────────────────────────┐  ┌────────────────────────────┐   │
│  │   Fundamental Data API     │  │   Onchain Data API         │   │
│  │                            │  │                            │   │
│  │  /fact_q_score             │  │  /netflow_intelligence     │   │
│  │  - Protocol rankings       │  │  - 7h flow changes         │   │
│  │  - Metadata (logo, symbol) │  │  - Net flow metrics        │   │
│  │  - Pagination support      │  │  - Calculated sentiments   │   │
│  └────────────────────────────┘  └────────────────────────────┘   │
│                                                                      │
│  Hosted: Google Cloud Run (asia-southeast1)                         │
│  Base URL: mvp-testidea-1094890588015.asia-southeast1.run.app      │
└────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│                        Data Layer (Managed by APIs)                 │
│                                                                      │
│  - Database type: Unknown (abstracted by APIs)                      │
│  - Fundamental data: Protocol quality scores                        │
│  - Onchain data: Time-series net flow metrics                       │
│  - Update frequency: Real-time or near real-time                    │
└────────────────────────────────────────────────────────────────────┘
```

## Frontend Architecture

### Component Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                           App Root                               │
│                         (React Router)                           │
└────────────────────────┬────────────────────────────────────────┘
                         │
         ┌───────────────┴───────────────┐
         │                               │
    Index Route                    NotFound Route
    (/dashboard)                   (fallback)
         │
         ├─ Layout Components
         │  ├─ DashboardHeader (title, refresh, count)
         │  ├─ SentimentLegend (color key)
         │  └─ Pagination (controls)
         │
         ├─ Data Display Components
         │  ├─ TokenTable (table structure)
         │  │   ├─ TableHeader (column definitions)
         │  │   ├─ TableBody
         │  │   │   └─ TokenRow[] (per token)
         │  │   │       └─ SentimentBadge × 4 (indicators)
         │  │   └─ LoadingSkeleton (loading state)
         │  │
         │  └─ OnchainDetailModal (detail view)
         │
         └─ UI Primitives (shadcn/ui)
            ├─ Table, TableRow, TableCell
            ├─ Dialog
            ├─ Button
            ├─ Skeleton
            ├─ Alert
            └─ Badge
```

### State Management Architecture

**Server State (TanStack React Query):**
```
QueryClient
  │
  ├─ QueryCache
  │  ├─ ['fundamental', page] → FundamentalApiResponse
  │  └─ ['onchain'] → OnchainToken[]
  │
  ├─ MutationCache (unused in current implementation)
  │
  └─ Configuration
     ├─ staleTime: 5 minutes
     ├─ retry: 2 attempts
     └─ refetchOnWindowFocus: enabled (default)
```

**UI State (React Hooks):**
```
Index Component State:
  └─ currentPage: number (pagination state)

TokenTable Component State:
  ├─ selectedToken: TokenData | null (modal data)
  └─ modalOpen: boolean (modal visibility)

Global State:
  └─ None (no Redux, Context, or Zustand)
```

### Rendering Pipeline

```
1. Initial Mount
   ├─ React StrictMode wraps app
   ├─ QueryClientProvider initializes cache
   ├─ Router resolves route to Index component
   └─ Index component renders

2. Data Fetching Phase
   ├─ useCryptoData hook executes
   ├─ TanStack Query checks cache
   ├─ On cache miss: parallel API calls
   │  ├─ fetchFundamentalData(page)
   │  └─ fetchOnchainData()
   └─ isLoading = true

3. Data Processing Phase
   ├─ API responses received
   ├─ Build fundamentalMap (Map<string, FundamentalToken>)
   ├─ Iterate onchain tokens
   ├─ For each token:
   │  ├─ Lookup fundamental data
   │  ├─ Calculate sentiments (F, O, T)
   │  ├─ Calculate overall sentiment
   │  └─ Create TokenData object
   └─ Return tokens[] array

4. Render Phase
   ├─ TokenTable receives tokens
   ├─ Map tokens to TokenRow components
   ├─ Each TokenRow renders:
   │  ├─ Token info (logo, symbol, protocol)
   │  ├─ Price
   │  └─ 4 × SentimentBadge components
   └─ Component tree reconciliation

5. User Interaction
   ├─ Click TokenRow
   ├─ handleRowClick triggers
   ├─ Update selectedToken state
   ├─ Update modalOpen state
   └─ OnchainDetailModal renders
```

## API Integration Details

### Endpoint Specifications

**Fundamental Data API**

```
Endpoint: GET /fact_q_score
Base URL: https://mvp-testidea-1094890588015.asia-southeast1.run.app
Query Parameters:
  - page: number (pagination, currently always 1)
  - limit: number (default 20)

Response Structure:
{
  data: FundamentalToken[],
  page?: number,
  limit?: number,
  total?: number
}

FundamentalToken:
{
  parentProtocol: string,        // e.g., "parent#uniswap"
  symbol: string,                 // e.g., "UNI"
  logo: string,                   // Image URL
  rank_description: string,       // e.g., "Top 5%", "Top 50% +"
  // Additional fields may exist
}

Cache Strategy:
  - staleTime: 5 minutes
  - Refetch on window focus
  - Manual refetch via button

Error Handling:
  - Retry: 2 attempts
  - Display error alert if failed
```

**Onchain Data API**

```
Endpoint: GET /netflow_intelligence
Base URL: https://mvp-testidea-1094890588015.asia-southeast1.run.app
Query Parameters:
  - limit: number (default 100 to get all tokens)

Response Structure:
{
  data: OnchainToken[]
}

OnchainToken:
{
  parentProtocol: string,         // e.g., "parent#ethereum"
  overall_sentiment?: SentimentType, // Pre-calculated or null
  *_chg_7h: number | null,        // Multiple flow change fields
  // Example fields:
  // - netflow_chg_7h
  // - inflow_chg_7h
  // - outflow_chg_7h
  // - holder_count_chg_7h
  // - whale_flow_chg_7h
  // (Field names may vary based on backend schema)
}

Cache Strategy:
  - staleTime: 5 minutes
  - Single fetch (not paginated)
  - Manual refetch via button

Error Handling:
  - Retry: 2 attempts
  - Display error alert if failed
```

### Data Merging Algorithm

```typescript
Algorithm: Merge Fundamental and Onchain Data

Input:
  - fundamentalData: FundamentalToken[] (from /fact_q_score)
  - onchainData: OnchainToken[] (from /netflow_intelligence)

Process:
  1. Create fundamentalMap: Map<string, FundamentalToken>
     - Key: parentProtocol.toLowerCase()
     - Value: FundamentalToken
     - Purpose: O(1) lookup during iteration

  2. Initialize empty tokens: TokenData[]

  3. For each onchainToken in onchainData:
     a. Skip if no parentProtocol

     b. Deduplicate (use Set to track seen protocols)

     c. Lookup fundamental data:
        fundToken = fundamentalMap.get(protocolKey)

     d. Calculate fundamental sentiment:
        IF fundToken exists:
          fundamental = calculateFundamentalSentiment(fundToken.rank_description)
        ELSE:
          fundamental = 'neutral'

     e. Calculate onchain sentiment:
        IF onchainToken.overall_sentiment exists:
          onchain = onchainToken.overall_sentiment
        ELSE:
          onchain = calculateOnchainSentiment(onchainToken)

     f. Set technical sentiment:
        technical = 'neutral' (hardcoded)

     g. Calculate overall sentiment:
        overall = calculateOverallSentiment(fundamental, onchain, technical)

     h. Create TokenData object:
        {
          parentProtocol: onchainToken.parentProtocol,
          symbol: fundToken?.symbol || extractSymbolFromProtocol(),
          logo: fundToken?.logo || '',
          price: '$100K', // Hardcoded
          fundamental,
          onchain,
          technical,
          overall,
          onchainData: onchainToken
        }

     i. Push to tokens array

  4. Return tokens

Output: TokenData[]
```

## Sentiment Calculation Algorithms

### 1. Fundamental Sentiment Algorithm

```
Function: calculateFundamentalSentiment(rankDescription: string): SentimentType

Input: rankDescription (e.g., "Top 5%", "Top 50% +", "Bottom 10%")

Algorithm:
  1. Normalize input: desc = rankDescription.toLowerCase()

  2. Check for top-tier protocols:
     IF desc contains "top 5%" OR "top 10%":
       RETURN 'bullish'

  3. Check for mid-tier protocols:
     IF desc contains "top 20%" OR "top 30%" OR "top 40%" OR "top 50%":
       IF desc does NOT contain "top 50% +" OR "top 50%+":
         RETURN 'neutral'

  4. Check for bottom-tier protocols:
     IF desc contains "top 50% +" OR "top 50%+" OR "bottom" OR
        "top 60%" OR "top 70%" OR "top 80%" OR "top 90%":
       RETURN 'bearish'

  5. Default case:
     RETURN 'neutral'

Rationale:
  - Top 5-10%: Strong fundamentals → Bullish
  - Top 20-50%: Average fundamentals → Neutral
  - Below 50%: Weak fundamentals → Bearish

Edge Cases:
  - "Top 50%" vs "Top 50% +": Plus suffix indicates lower tier (bearish)
  - Missing or invalid input: Defaults to neutral
```

### 2. Onchain Sentiment Algorithm

```
Function: calculateOnchainSentiment(token: OnchainToken): SentimentType

Input: OnchainToken with *_chg_7h fields

Algorithm:
  1. Extract all fields ending with "_chg_7h":
     chgFields = Object.keys(token).filter(key => key.endsWith('_chg_7h'))

  2. Initialize counters:
     bullishCount = 0
     bearishCount = 0
     neutralCount = 0

  3. For each field in chgFields:
     value = token[field]

     a. Handle NULL/undefined:
        IF value is null OR undefined OR NaN:
          neutralCount++
          CONTINUE

     b. Handle numeric values:
        IF value is number:
          IF value === 0:
            neutralCount++
          ELSE IF value < 0:
            bullishCount++  // Negative = buying pressure
          ELSE IF value > 0:
            bearishCount++  // Positive = selling pressure

  4. Majority Voting (matches backend SQL logic):
     IF bullishCount >= neutralCount AND bullishCount >= bearishCount:
       RETURN 'bullish'
     IF neutralCount > bullishCount AND neutralCount >= bearishCount:
       RETURN 'neutral'
     ELSE:
       RETURN 'bearish'

Rationale:
  - Negative flow change: Money flowing IN → Buying pressure → Bullish
  - Positive flow change: Money flowing OUT → Selling pressure → Bearish
  - Zero or null: No significant change → Neutral
  - Majority vote: Most common sentiment across all indicators wins

Example Calculation:
  Token with 5 indicators:
    - netflow_chg_7h: -1000 → Bullish
    - inflow_chg_7h: -500 → Bullish
    - outflow_chg_7h: 200 → Bearish
    - holder_count_chg_7h: 0 → Neutral
    - whale_flow_chg_7h: null → Neutral

  Counts: Bullish=2, Bearish=1, Neutral=2
  Result: Bullish (tied with neutral, bullish wins per SQL logic)
```

### 3. Overall Sentiment Algorithm

```
Function: calculateOverallSentiment(
  fundamental: SentimentType,
  onchain: SentimentType,
  technical: SentimentType
): SentimentType

Input: Three sentiment values (fundamental, onchain, technical)

Algorithm:
  1. Initialize counter object:
     counts = {
       bullish: 0,
       bearish: 0,
       neutral: 0
     }

  2. Increment counts:
     counts[fundamental]++
     counts[onchain]++
     counts[technical]++

  3. Find maximum count:
     maxCount = Math.max(counts.bullish, counts.bearish, counts.neutral)

  4. Find all sentiments with max count:
     maxSentiments = sentiments where counts[sentiment] === maxCount

  5. Tie-breaking logic:
     IF maxSentiments.length > 1:
       RETURN 'neutral'  // Any tie defaults to neutral

  6. Single winner:
     RETURN maxSentiments[0]

Rationale:
  - Majority vote: The most common sentiment wins
  - Conservative approach: Ties default to neutral (avoid false signals)

Examples:
  1. F=bullish, O=bullish, T=neutral → Overall=bullish (2 votes)
  2. F=bullish, O=bearish, T=neutral → Overall=neutral (3-way tie)
  3. F=neutral, O=neutral, T=neutral → Overall=neutral (unanimous)
  4. F=bearish, O=bearish, T=neutral → Overall=bearish (2 votes)
```

## Caching and Data Refresh Strategy

### TanStack Query Cache Configuration

```typescript
QueryClient Configuration:
{
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,        // 5 minutes
      cacheTime: 1000 * 60 * 10,       // 10 minutes (default)
      retry: 2,                         // 2 retry attempts
      refetchOnWindowFocus: true,       // Refetch on tab focus
      refetchOnReconnect: true,         // Refetch on network reconnect
    }
  }
}
```

### Cache Lifecycle

```
1. Initial Request
   ├─ Check cache for query key
   ├─ If not found or stale (>5 min):
   │  ├─ Set query state to 'loading'
   │  ├─ Execute fetch function
   │  └─ Store result in cache
   └─ Return cached data + loading state

2. Background Refetch (within staleTime)
   ├─ Return cached data immediately
   └─ No background refetch (data considered fresh)

3. Background Refetch (after staleTime)
   ├─ Return stale cached data immediately
   ├─ Trigger background refetch
   └─ Update cache when new data arrives

4. Manual Refetch
   ├─ User clicks refresh button
   ├─ Call refetch() from hook
   ├─ Invalidate cache
   ├─ Force new fetch
   └─ Update UI with fresh data

5. Cache Eviction
   ├─ After cacheTime (10 min) with no active observers
   └─ Remove from memory
```

### Parallel Query Strategy

```
Parallel Fetching Pattern:
  ┌─────────────────────────────────────┐
  │     useCryptoData Hook Execution    │
  └─────────────────┬───────────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
  fundamentalQuery        onchainQuery
        │                       │
        ├─ Query Key:           ├─ Query Key:
        │  ['fundamental', 1]   │  ['onchain']
        │                       │
        ├─ Fetch:               ├─ Fetch:
        │  /fact_q_score        │  /netflow_intelligence
        │                       │
        └───────────┬───────────┘
                    │
            Both queries run in parallel
            No blocking or sequential waits
                    │
        ┌───────────┴───────────┐
        │                       │
    Wait for both           Combine results
    to complete            in hook return
                    │
                    ▼
            Return merged data
```

**Benefits:**
- Reduced total load time (parallel vs sequential)
- Independent error handling per query
- Separate cache management
- Individual retry logic

### Refresh Mechanisms

**1. Automatic Refresh:**
- Window focus: Refetch on tab switch back
- Network reconnect: Refetch after network restored
- Stale time: Background refetch after 5 minutes

**2. Manual Refresh:**
```typescript
// Triggered by user clicking refresh button
const handleRefresh = () => {
  fundamentalQuery.refetch();
  onchainQuery.refetch();
};
```

**3. Pagination Refresh:**
```typescript
// New page fetch
setCurrentPage(newPage);
// This triggers fundamentalQuery refetch with new page number
// Query key changes: ['fundamental', 1] → ['fundamental', 2]
```

## Performance Optimizations

### 1. Code Splitting
- React Router lazy loading (future enhancement)
- Vite automatic chunking in production build

### 2. Memoization
```typescript
// Built-in React optimizations
- Function components are memoized by default (React 18)
- shadcn/ui components use React.memo where appropriate

// Potential future optimizations:
- useMemo for expensive sentiment calculations
- useCallback for event handlers passed to child components
```

### 3. Data Fetching
- Parallel API calls (not sequential)
- Efficient data structures (Map for O(1) lookups)
- Deduplication of protocols in merged data

### 4. Rendering
- Skeleton loading states (perceived performance)
- Conditional rendering (early returns for loading/error)
- Key props for list rendering optimization

### 5. Bundle Size
- Tree-shaking enabled (Vite)
- Dynamic imports for code splitting
- shadcn/ui imports only used components

## Security Considerations

### 1. API Communication
- HTTPS-only endpoints
- No authentication required (public APIs)
- CORS handled by backend services

### 2. Data Validation
- TypeScript type checking at compile time
- Runtime validation for API responses (implicit)
- Zod schema validation available (not currently used for API responses)

### 3. XSS Protection
- React automatic escaping of JSX content
- No dangerouslySetInnerHTML usage
- shadcn/ui components follow security best practices

### 4. Client-Side Storage
- No localStorage or sessionStorage usage
- No sensitive data persistence
- In-memory cache only (TanStack Query)

### 5. Dependencies
- Regular npm audit recommended
- Lovable platform handles base security
- 55 total dependencies (attack surface)

---

**Document Version:** 1.0
**Last Updated:** 2025-12-23
