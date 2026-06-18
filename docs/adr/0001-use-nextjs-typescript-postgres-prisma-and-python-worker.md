# Use Next.js, TypeScript, PostgreSQL, Prisma, and a Python worker

The app will use Next.js and TypeScript for the web dashboard and API surface, PostgreSQL with Prisma for durable product data, and a Python worker for market analysis, AI context scoring, and backtesting. This splits the product at a clear seam: the web app owns professional workflows and persistence, while Python owns analysis-heavy implementation where the financial data ecosystem is stronger.

