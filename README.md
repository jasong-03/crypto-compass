# Crypto Compass

> A real-time cryptocurrency sentiment analysis dashboard providing actionable trading intelligence through multi-layered data synthesis.

![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)
![React](https://img.shields.io/badge/React-18.3-blue)
![Vite](https://img.shields.io/badge/Vite-5.4-purple)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-teal)

---

## Overview

**Crypto Compass** (also known as Crypto Sentinel) is a modern web application that aggregates cryptocurrency market data from multiple sources to provide comprehensive sentiment analysis. By combining fundamental protocol rankings, onchain transaction flows, and technical indicators, the dashboard delivers clear bullish/bearish/neutral signals to help traders make informed decisions.

### Key Features

- **Multi-Layer Sentiment Analysis**: Fundamental, onchain, and technical sentiment indicators for each token
- **Real-Time Data**: Live integration with backend APIs, auto-refreshing every 5 minutes
- **Interactive Dashboard**: Click any token to view detailed onchain metrics
- **Clean UI**: Built with shadcn/ui and TailwindCSS for a modern, responsive experience
- **Type-Safe**: Full TypeScript coverage for reliability and developer experience

---

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd crypto-compass

# Install dependencies
npm install
```

### Development

```bash
# Start development server with hot reload
npm run dev

# Application will be available at http://localhost:5173
```

### Build for Production

```bash
# Create optimized production build
npm run build

# Preview production build locally
npm run preview
```

### Other Commands

```bash
# Run ESLint
npm run lint

# Build in development mode
npm run build:dev
```

---

## Tech Stack

### Core Framework
- **React 18.3** - UI library with concurrent features
- **TypeScript 5.8** - Type-safe development
- **Vite 5.4** - Fast build tool and dev server

### UI & Styling
- **TailwindCSS 3.4** - Utility-first CSS framework
- **shadcn/ui** - 52 accessible, customizable components
- **Radix UI** - Unstyled, accessible UI primitives
- **Lucide React** - Icon library

### State Management
- **TanStack React Query 5.8** - Server state management and caching
- **React Hooks** - Local UI state

### Routing
- **React Router 6.30** - Client-side routing

### Form & Validation
- **React Hook Form 7.61** - Form state management
- **Zod 3.25** - Schema validation

### Data Visualization
- **Recharts 2.15** - Chart components

### Utilities
- **date-fns** - Date manipulation
- **class-variance-authority** - Component variant management
- **tailwind-merge** - Intelligent class name merging

---

## Project Structure

```
crypto-compass/
├── src/
│   ├── components/          # React components
│   │   ├── ui/             # shadcn/ui components (52 components)
│   │   ├── DashboardHeader.tsx
│   │   ├── TokenTable.tsx
│   │   ├── TokenRow.tsx
│   │   ├── SentimentBadge.tsx
│   │   ├── SentimentLegend.tsx
│   │   ├── OnchainDetailModal.tsx
│   │   └── NavLink.tsx
│   ├── hooks/              # Custom React hooks
│   │   ├── useCryptoData.ts      # Main data fetching hook
│   │   ├── useOnchainData.ts     # Detail modal data hook
│   │   ├── use-toast.ts
│   │   └── use-mobile.tsx
│   ├── lib/                # Utilities and business logic
│   │   ├── sentiment.ts          # Sentiment calculation algorithms
│   │   └── utils.ts              # Helper functions
│   ├── pages/              # Route components
│   │   ├── Index.tsx             # Main dashboard page
│   │   └── NotFound.tsx          # 404 page
│   ├── types/              # TypeScript type definitions
│   │   └── crypto.ts             # Core type interfaces
│   ├── data/               # Mock data for development
│   │   └── mockData.ts
│   ├── App.tsx             # Root component
│   ├── main.tsx            # Application entry point
│   └── index.css           # Global styles
├── docs/                   # Project documentation
│   ├── project-overview-pdr.md   # Product requirements
│   ├── codebase-summary.md       # Architecture overview
│   ├── code-standards.md         # Development guidelines
│   └── system-architecture.md    # Technical deep-dive
├── public/                 # Static assets
├── package.json            # Dependencies and scripts
├── tsconfig.json           # TypeScript configuration
├── vite.config.ts          # Vite configuration
├── tailwind.config.ts      # Tailwind configuration
└── components.json         # shadcn/ui configuration
```

---

## How It Works

### Data Flow

1. **API Integration**: The app fetches data from two backend APIs:
   - **Fundamental API** (`/fact_q_score`): Protocol rankings and metadata
   - **Onchain API** (`/netflow_intelligence`): 7-hour net flow changes

2. **Data Merging**: The `useCryptoData` hook:
   - Fetches both APIs in parallel using TanStack React Query
   - Merges data by protocol (onchain as primary source)
   - Enriches onchain tokens with fundamental data

3. **Sentiment Calculation**: For each token, calculates:
   - **Fundamental**: Based on protocol ranking percentile
   - **Onchain**: Majority voting across flow change indicators
   - **Technical**: Currently hardcoded as 'neutral'
   - **Overall**: Majority voting across all three layers

4. **Rendering**: Displays tokens in a sortable table with:
   - Token info (logo, symbol, protocol name)
   - Price (currently hardcoded to $100K)
   - Four sentiment badges (color-coded: green=bullish, red=bearish, gray=neutral)

### Sentiment Logic

**Fundamental Sentiment**
```
Top 5-10% ranking     → Bullish (strong fundamentals)
Top 20-50% ranking    → Neutral (average fundamentals)
Below 50% ranking     → Bearish (weak fundamentals)
```

**Onchain Sentiment**
```
Analyzes 7-hour flow changes across multiple metrics:
  - Negative flow (money flowing in)   → Bullish (buying pressure)
  - Positive flow (money flowing out)  → Bearish (selling pressure)
  - Zero or null flow                  → Neutral (no change)

Uses majority voting across all indicators to determine overall onchain sentiment.
```

**Overall Sentiment**
```
Majority vote across fundamental, onchain, and technical sentiments.
Ties default to neutral (conservative approach).
```

---

## API Endpoints

### Fundamental Data
```
GET https://mvp-testidea-1094890588015.asia-southeast1.run.app/fact_q_score?page=1&limit=20
```

**Response:**
```json
{
  "data": [
    {
      "parentProtocol": "parent#ethereum",
      "symbol": "ETH",
      "logo": "https://...",
      "rank_description": "Top 5%"
    }
  ],
  "page": 1,
  "limit": 20,
  "total": 100
}
```

### Onchain Data
```
GET https://mvp-testidea-1094890588015.asia-southeast1.run.app/netflow_intelligence?limit=100
```

**Response:**
```json
{
  "data": [
    {
      "parentProtocol": "parent#ethereum",
      "overall_sentiment": "bullish",
      "netflow_chg_7h": -1500,
      "inflow_chg_7h": -800,
      "outflow_chg_7h": 200
    }
  ]
}
```

---

## Configuration

### Environment Variables

Currently, no environment variables are required. API endpoints are hardcoded in `src/hooks/useCryptoData.ts`.

For production deployments, consider externalizing:
```bash
VITE_FUNDAMENTAL_API_URL=https://...
VITE_ONCHAIN_API_URL=https://...
```

### Cache Settings

Data is cached for **5 minutes** by default. Modify in `src/hooks/useCryptoData.ts`:

```typescript
staleTime: 1000 * 60 * 5, // 5 minutes
```

---

## Development Guidelines

### Code Standards

- **TypeScript**: Strict mode enabled, explicit return types required
- **Components**: Function components only, hooks at top level
- **Styling**: Tailwind utility classes, shadcn/ui for primitives
- **Imports**: Use `@/` path alias for src directory
- **Formatting**: 2-space indentation, semicolons required

See `docs/code-standards.md` for detailed conventions.

### Adding a New Component

```bash
# Add shadcn/ui component
npx shadcn-ui@latest add [component-name]

# Creates file in src/components/ui/
```

```typescript
// Create custom component in src/components/
import { Button } from '@/components/ui/button';

interface MyComponentProps {
  title: string;
}

export function MyComponent({ title }: MyComponentProps) {
  return <Button>{title}</Button>;
}
```

### Adding a New Type

```typescript
// src/types/my-types.ts
export interface MyData {
  id: string;
  name: string;
}

export type MyStatus = 'active' | 'inactive';
```

---

## Documentation

Comprehensive documentation is available in the `/docs` directory:

- **[Project Overview & PDR](docs/project-overview-pdr.md)** - Product requirements, features, roadmap
- **[Codebase Summary](docs/codebase-summary.md)** - Architecture diagrams, data flow, module responsibilities
- **[Code Standards](docs/code-standards.md)** - Naming conventions, TypeScript patterns, component structure
- **[System Architecture](docs/system-architecture.md)** - Technical architecture, API integration, algorithms

---

## Current Limitations

- **Price Data**: Hardcoded to "$100K" (no real price feed integration)
- **Technical Sentiment**: Hardcoded to 'neutral' (no TA indicators yet)
- **Pagination**: Shows all 48 tokens at once (backend pagination not implemented)
- **Historical Data**: No time-series or historical sentiment tracking
- **Alerts**: No notification system for sentiment changes

See `docs/project-overview-pdr.md` for the full roadmap.

---

## Roadmap

### Phase 2: Data Enhancement
- Integrate real-time price feeds
- Add technical analysis indicators (RSI, MACD, MA)
- Historical sentiment tracking with charts
- Custom timeframe selection

### Phase 3: User Features
- User authentication and profiles
- Customizable watchlists
- Email/push alerts for sentiment changes
- Portfolio integration

### Phase 4: Advanced Analytics
- Correlation analysis between sentiment layers
- Predictive modeling
- Backtesting sentiment vs. price performance
- Multi-token comparison views

---

## Troubleshooting

### API Connection Issues

If you see "Failed to fetch" errors:

1. Check network connectivity
2. Verify API endpoints are accessible:
   ```bash
   curl https://mvp-testidea-1094890588015.asia-southeast1.run.app/fact_q_score
   ```
3. Check browser console for CORS errors
4. Enable mock data temporarily:
   ```typescript
   // src/hooks/useCryptoData.ts
   const USE_MOCK_DATA = true;
   ```

### Build Errors

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf node_modules/.vite
npm run dev
```

### TypeScript Errors

```bash
# Regenerate TypeScript declarations
npm run build

# Check tsconfig.json for path alias issues
```

---

## Contributing

### Development Workflow

1. Create a feature branch: `git checkout -b feature/my-feature`
2. Make changes following code standards
3. Test locally: `npm run dev`
4. Build to verify: `npm run build`
5. Commit with descriptive message
6. Open pull request

### Commit Message Format

```
feat: Add historical sentiment charts
fix: Correct onchain sentiment calculation
docs: Update API integration guide
refactor: Extract sentiment logic to separate module
```

---

## License

MIT License - See LICENSE file for details

---

## Credits

- **Generated By**: [Lovable AI](https://lovable.ai) platform
- **UI Components**: [shadcn/ui](https://ui.shadcn.com)
- **Icons**: [Lucide](https://lucide.dev)
- **Styling**: [TailwindCSS](https://tailwindcss.com)

---

## Support

For questions or issues:
1. Check the [documentation](docs/)
2. Review existing GitHub issues
3. Create a new issue with detailed description

---

**Last Updated**: 2025-12-23
**Version**: 0.0.0
