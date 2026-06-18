# Professional Stock Signal App Design

## Purpose

Build a web dashboard SaaS for investment professionals who analyze Korean and US equities and need swing-trading buy, hold, and sell timing support over a days-to-weeks horizon.

The product is a professional decision-support system, not an automatic investment adviser or auto-trading system. It must show signals, confidence, entry/stop/target levels, rankings, portfolio impact, and client-ready report drafts with clear evidence and editable professional approval.

## Target Users

- Investment professionals who monitor Korean and US equities.
- Analysts or advisors who need fast daily screening, portfolio review, and client-facing explanation drafts.
- Users who can interpret signals and remain responsible for final investment decisions.

## Product Scope

### In Scope for MVP

- Korean and US stock universe support.
- Swing-trading horizon: days to weeks.
- Web dashboard and alert-centered SaaS workflow.
- Buy / hold / sell signals.
- Confidence score and signal rationale.
- Entry price, stop-loss price, and target price.
- Stock ranking by opportunity and risk.
- Watchlists and professional portfolios.
- Portfolio-aware interpretation of signals.
- Client report draft generation.
- Technical indicators, price/volume patterns, quant factors, news, disclosures, earnings events, and AI context scoring.
- Backtest validation for signal rules and factor combinations.

### Out of Scope for MVP

- Automated order execution.
- Direct customer investment solicitation without professional review.
- Real-time tick or order-book trading.
- Fully autonomous AI portfolio management.

## Recommended Approach

Use a hybrid architecture:

1. A rules/factor signal engine forms the auditable core.
2. AI context scoring participates directly in signal calculation.
3. AI explanations and research summaries make the signal easier to review.
4. Backtesting validates signal behavior before professionals rely on it.

This balances professional-grade explainability with the productivity benefit of AI. The default score weighting is `rules/factors 60% + AI context 40%`. Professionals can configure strategy profiles with AI weights from 20% to 60%. Higher AI weights require stronger source quality: multiple cited sources, freshness checks, contradiction flags, and linked source evidence.

## Architecture

The system uses a pipeline:

`data ingestion -> normalization -> feature generation -> signal calculation -> portfolio interpretation -> research explanation -> dashboard and alerts -> report generation`

### Modules

#### MarketData

Collects Korean and US equity data from interchangeable provider adapters. It stores raw data and normalized data separately.

Required data categories:

- OHLCV daily data.
- Delayed or near-real-time intraday price and volume data.
- Corporate actions.
- Earnings events.
- News.
- Disclosures and filings.
- Basic financial and factor data.

Every data point must carry freshness and quality metadata, including whether it is delayed intraday data or confirmed end-of-day data.

#### FeaturePipeline

Transforms normalized data into features used by the signal engine.

Core feature groups:

- Moving averages.
- RSI.
- MACD.
- Volatility.
- Volume surge.
- Trend strength.
- Gap behavior.
- Support and resistance.
- Momentum.
- Reversal patterns.
- Quant factor scores.
- Event and catalyst indicators.

#### SignalEngine

Calculates buy / hold / sell signals and trading levels.

Outputs:

- Signal state: buy, hold, sell, or review required.
- Confidence score.
- Entry level.
- Stop-loss level.
- Target level.
- Risk flags.
- Signal rationale.
- Rule/factor contribution.
- AI contribution.
- Data quality flags.

The engine must persist the rules, inputs, intermediate scores, and final output for auditability.

#### AIContextScorer

Analyzes unstructured market context and contributes to final signal scoring.

Inputs:

- News articles.
- Disclosures and filings.
- Earnings summaries.
- Analyst-style event descriptions.
- Market narratives.

Outputs:

- Positive or negative catalyst score.
- Uncertainty score.
- Evidence quality score.
- Freshness score.
- Contradiction flags.
- Source citations.
- Explanation snippets.

AI context may affect final signal calculation, but it must never be opaque. Every AI-influenced signal must show AI impact, source evidence, and confidence.

#### BacktestValidator

Applies signal rules and strategy profiles to historical data.

Metrics:

- Win rate.
- Expected value.
- Maximum drawdown.
- Average holding period.
- Market-specific performance.
- Sector-specific performance.
- Regime sensitivity.

The MVP should validate against at least three to five years of historical data where available and use split-period validation to reduce overfitting.

#### PortfolioAdvisor

Interprets signals in the context of professional portfolios and watchlists.

Responsibilities:

- Track holdings, entry prices, unrealized P/L, and position weights.
- Detect concentration and exposure risks.
- Reclassify raw stock signals into portfolio actions when needed.
- Show conflicts such as "buy signal but already overweight" or "sell signal conflicts with client mandate."

Portfolio-aware output examples:

- New buy candidate.
- Add-on candidate.
- Hold and monitor.
- Trim candidate.
- Exit candidate.
- Review required.

#### ResearchAssistant

Produces professional-readable explanations from structured signals and cited source material.

It may summarize why the signal changed, what evidence supports it, what evidence conflicts with it, and what data is missing. It does not replace the SignalEngine.

#### ClientReportGenerator

Creates editable client report drafts.

Report contents:

- Portfolio summary.
- Signal changes.
- Current holdings review.
- New candidates.
- Trim or exit candidates.
- Risk factors.
- News, disclosure, and earnings highlights.
- Professional commentary draft.

Reports require professional review and approval before export or sharing.

#### ProfessionalWorkspace

Web dashboard for experts.

Primary views:

- Market overview.
- Ranked opportunities.
- Signal detail cards.
- Watchlists.
- Portfolio review.
- Backtest results.
- Alerts.
- Client report drafts.
- Audit log.

## Data Flow

During market hours, delayed or near-real-time data updates provisional signals. After market close, confirmed OHLCV and event data recompute official end-of-day signals.

The canonical flow is:

1. Store raw source data.
2. Normalize source data into common market schemas.
3. Generate technical, price/volume, factor, and event features.
4. Calculate rules/factor scores.
5. Calculate AI context scores with evidence metadata.
6. Combine scores using the selected strategy profile.
7. Generate signal, confidence, and trading levels.
8. Validate the signal against backtest metadata.
9. Adjust interpretation for portfolios and watchlists.
10. Display dashboard cards and send alerts.
11. Generate editable client report drafts.

All stages must be versioned enough to explain why a signal changed.

## Error Handling and Trust

The product must not silently hide weak data.

Visible quality states:

- Delayed intraday data.
- Confirmed end-of-day data.
- Missing price data.
- Missing event data.
- Weak AI source evidence.
- Conflicting news or disclosures.
- Insufficient backtest sample size.
- High portfolio concentration.
- High volatility.

If data quality falls below the configured threshold, the signal should degrade to `review required` instead of forcing a buy or sell recommendation.

## Compliance and Responsibility Boundaries

The app is for investment professionals. It supports analysis and review; it does not make autonomous investment decisions.

Required safeguards:

- No automatic trading in MVP.
- No direct customer recommendation delivery without professional approval.
- Every signal shows evidence, assumptions, freshness, and risk flags.
- Every client report is editable and must be approved before export.
- AI contribution is visible and auditable.

## Testing and Validation

### Data Pipeline Tests

- Verify source adapters produce normalized Korean and US equity data.
- Verify freshness, delay, and confirmation metadata.
- Verify missing data surfaces as quality flags.

### Signal Engine Tests

- Given fixed historical inputs, the same strategy profile must produce deterministic rules/factor scores.
- AI context scores must be bounded and evidence-aware.
- Poor AI evidence quality must reduce AI contribution.
- Low-quality data must produce `review required` when thresholds are not met.

### Backtest Tests

- Run strategy profiles over at least three to five years of historical data where available.
- Measure win rate, expected value, maximum drawdown, holding period, and market-specific performance.
- Use split-period validation to reduce overfitting.

### Portfolio Tests

- Verify raw stock signals are reinterpreted against holdings and exposures.
- Verify concentration risk changes displayed action labels.
- Verify client report drafts include portfolio-specific context.

### Product Success Criteria

An investment professional can complete a daily review workflow in one session:

1. See ranked Korean and US stock opportunities.
2. Identify signal changes.
3. Review evidence and AI influence.
4. Understand portfolio impact.
5. Inspect backtest support.
6. Generate and edit a client report draft.

## Open Decisions Resolved

- Target user: investment professionals.
- Market scope: Korean and US equities.
- Horizon: swing trading over days to weeks.
- Product form: web dashboard and alert-centered SaaS.
- Signal basis: technical indicators, price/volume patterns, quant factors, news/disclosures/earnings, and AI context scoring.
- AI role: direct scoring participant with visible impact and evidence requirements.
- Portfolio and client reports: included in MVP.
- Auto-trading: excluded from MVP.
