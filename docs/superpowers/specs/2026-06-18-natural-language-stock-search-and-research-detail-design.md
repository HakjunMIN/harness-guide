# Natural Language Stock Search and Research Detail Design

## Purpose

Expand the professional stock signal app so an Investment Professional can find relevant Korean and US equities with natural language and inspect a richer, report-grade signal detail page.

The feature turns broad prompts such as "Samsung Electronics", "AAPL", "US semiconductor AI beneficiaries", "dividend-stable Korean large caps", or "portfolio holdings with rising risk" into auditable search results and a professional research workspace. It remains decision support only: the app may show compact Action Labels, but it must explain evidence, risks, assumptions, data freshness, AI influence, and professional-review context before any Research Note or Client Report output.

## Scope

### In Scope

- Natural language search across company name, ticker, InstrumentId aliases, market, sector, theme, signal state, risk profile, and portfolio relevance.
- Search result cards that explain why each instrument matched the query.
- A professional signal detail page that replaces the current placeholder with multiple report-style analytical sections.
- Visualization surfaces for price action, technical indicators, signal contribution, risk, backtest performance, and portfolio exposure.
- Report-grade content blocks that can feed editable Research Notes and approved Client Reports.
- Explicit data quality states for ambiguous, stale, missing, contradictory, or weak-evidence results.

### Out of Scope

- Automated order execution.
- Direct client delivery without professional review and approval.
- A free-form strategy rule builder.
- Real-time tick or order-book trading.
- General chat that answers investment questions without linking results to auditable instruments, evidence, and signal records.

## Recommended Approach

Use a unified Search-to-Research flow.

The search experience should not stop at ticker lookup. It should parse the user's natural language into search intent, retrieve candidate instruments, rank them with signal and portfolio context, and send the user into a detail page that explains the Trade Timing Plan and evidence stack. This fits the existing product model because search becomes an entry point into InstrumentId, Trade Timing Plan, Strategy Profile, Strategy Backtest, Portfolio, Research Note, Client Report, and Audit Log workflows.

Two alternatives were rejected:

1. Ticker-only search is fast to build but too shallow for prompts like "AI infrastructure BUY candidates" or "my holdings with stop-level risk".
2. A chat-first research assistant is flexible but can weaken auditability if it produces narrative answers detached from persisted signals, quality metadata, and evidence.

## User Experience

### Natural Language Search

The dashboard gains a prominent search bar with professional prompt examples:

- "Samsung Electronics"
- "AAPL"
- "US AI infrastructure BUY candidates"
- "Korean battery names with reversal momentum"
- "Dividend-stable Korean large caps"
- "My portfolio holdings near stop levels"

After submission, the interface shows an interpreted query summary before the results:

- Parsed market, exchange, symbol, company, sector, or theme.
- Strategy Profile and signal filters inferred from the prompt.
- Portfolio scope when the query references holdings, watchlists, exposure, or risk.
- Ambiguity warnings when the query can map to multiple instruments or meanings.

Results are ranked cards. Each card shows:

- Instrument display name and canonical InstrumentId.
- Match reason, such as exact ticker match, company alias match, theme match, signal filter match, or portfolio-risk match.
- Action Label, confidence, finality, entry zone, stop level, target zone, and time horizon.
- Portfolio action when relevant.
- AI contribution and any AI Weight Haircut.
- Data quality flags and last refreshed time.
- A link into the full signal detail page.

### Professional Signal Detail Page

The signal detail page becomes a research terminal for one instrument.

Required sections:

1. Executive Signal Brief: compact Action Label, confidence, finality, time horizon, data quality, and one-paragraph rationale.
2. Trade Timing Plan: entry zone, stop level, target zone, risk/reward, invalidation conditions, and monitoring checklist.
3. Evidence Stack: rules/factors, technical indicators, price/volume behavior, quant factors, events, disclosures, earnings, and news evidence.
4. Technical and Quant Dashboard: trend, momentum, volatility, volume surge, support/resistance, RSI, MACD, moving averages, and factor scores.
5. AI Context and Citations: catalyst score, uncertainty score, evidence quality, freshness, contradiction flags, source citations, and explanation snippets.
6. Portfolio Impact: position status, exposure, concentration, unrealized P/L where available, and portfolio-aware action.
7. Strategy Backtest: win rate, expected value, maximum drawdown, average holding period, regime sensitivity, and sample-size warnings.
8. Risk and Data Quality: missing data, stale data, high volatility, weak AI evidence, contradictory sources, and review-required conditions.
9. Audit Trail: data versions, Strategy Profile version, AI weighting, signal output, user overrides, Research Note approvals, and report exports.
10. Research and Report Actions: generate or update an editable Research Note and optionally draft a Client Report after professional review.

Compact dashboard labels may say BUY, HOLD, or SELL. Detail, note, and report surfaces must include professional-review context and evidence so the product does not appear to make autonomous investment decisions.

## Visualization Design

The detail page includes visual analytics components with stable data contracts:

- Price and volume chart with entry zone, stop level, target zone, and signal-change markers.
- Technical indicator panels for moving averages, RSI, MACD, volatility, and volume surge.
- Signal contribution waterfall showing rules/factors, AI context, AI Weight Haircut, and final confidence.
- Risk radar or bar chart covering volatility, concentration, liquidity, event risk, data quality, and AI uncertainty.
- Strategy Backtest visuals for equity curve, drawdown, win/loss distribution, and regime sensitivity.
- Portfolio exposure chart for sector, market, and position-weight impact when a Portfolio is selected.

The MVP may render deterministic sample or persisted calculation data first. The visualization boundary should allow later replacement with live provider data and richer chart libraries without changing the search or detail page domain contracts.

## Architecture

Add a Search-to-Research module layer to the existing Next.js product workflow.

### NaturalLanguageSearch

Responsibilities:

- Parse natural language into a `SearchIntent`.
- Resolve company aliases, provider symbols, and raw tickers into canonical InstrumentId candidates.
- Detect filters for market, sector, theme, signal state, risk, Strategy Profile, watchlist, and Portfolio.
- Return ambiguity states rather than silently choosing one meaning when confidence is low.

### SearchResultAssembler

Responsibilities:

- Combine instrument candidates with latest Signal Decisions, Portfolio interpretation, Backtest summaries, and data quality metadata.
- Rank results by match strength, confidence, portfolio relevance, and risk-adjusted opportunity.
- Produce result cards with explicit match reasons and quality flags.

### ResearchDetailAssembler

Responsibilities:

- Build one report-grade view model for the signal detail page.
- Gather Trade Timing Plan, evidence, technical/quant metrics, AI context, Strategy Backtest, Portfolio impact, Audit Log references, Research Note state, and Client Report eligibility.
- Keep display concerns separate from analysis-heavy implementation. It should not calculate signals itself.

### Visualization Components

Responsibilities:

- Render chart-ready data from the detail view model.
- Accept typed inputs so charts can be tested without depending on browser-only APIs.
- Surface missing or insufficient data as visible states.

## Data Flow

1. User submits a natural language query.
2. NaturalLanguageSearch parses the query into `SearchIntent`.
3. Instrument resolution returns candidate InstrumentIds and match reasons.
4. SearchResultAssembler joins candidates with Signal Decisions, Portfolio interpretation, Backtest summaries, and quality metadata.
5. The dashboard renders ranked result cards and visible query interpretation.
6. User opens a candidate detail page.
7. ResearchDetailAssembler builds a complete detail model.
8. The detail page renders analytical sections and visualization components.
9. User may generate or update a Research Note.
10. A Client Report can be drafted only from approved Research Notes and portfolio context.

## Error Handling and Trust

The feature must make uncertainty visible:

- If a query is ambiguous, show the interpreted meanings and candidate instruments instead of forcing one result.
- If no instrument matches, explain which parts of the query were understood and suggest narrower prompts.
- If market data is stale, delayed, missing, or provisional, show the quality state on result and detail pages.
- If AI evidence is weak, stale, contradictory, or insufficient, show the AI Weight Haircut and citations.
- If backtest sample size is insufficient, show the limitation before displaying any performance interpretation.
- If portfolio data is unavailable, render the detail page without portfolio-specific claims and label the Portfolio Impact section as unavailable.

The system should degrade to review-required states when quality thresholds are not met. It must not hide missing evidence behind confident language.

## Testing and Validation

### Search Tests

- Exact company, ticker, and InstrumentId queries resolve to the expected canonical InstrumentIds.
- Thematic and condition-based prompts produce explicit `SearchIntent` filters.
- Portfolio-related prompts only use Portfolio context when a Portfolio is selected or available.
- Ambiguous queries return multiple candidates and visible ambiguity metadata.
- No-match queries return understood terms and suggested refinements.

### Detail Page Tests

- The detail page renders all required report sections for a complete signal.
- Missing AI context, backtest, portfolio, or market data renders visible unavailable or quality states.
- BUY, HOLD, and SELL Action Labels on compact surfaces are paired with evidence and professional-review context in detail sections.
- Research Note and Client Report actions respect approval and eligibility rules.

### Visualization Tests

- Chart view models include entry zone, stop level, target zone, indicator values, signal contributions, risk metrics, and backtest metrics.
- Missing chart data produces an explicit empty or unavailable state.
- Visual components do not perform signal calculations; they render typed view models.

### Product Success Criteria

An Investment Professional can:

1. Enter a natural language query for a company, ticker, theme, strategy condition, or portfolio concern.
2. See how the app interpreted the query.
3. Compare ranked candidates with match reasons, signal context, and quality flags.
4. Open a detailed research page with professional-grade reports and visual analytics.
5. Understand the Trade Timing Plan, evidence, AI influence, Portfolio impact, Strategy Backtest support, and Audit Log context.
6. Generate or update a Research Note and optionally draft a Client Report after professional review.

