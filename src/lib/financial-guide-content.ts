export type FinancialGuidePage = {
    id: string;
    title: string;
    content: string;
  };
  
  export const FINANCIAL_GUIDE_PAGES: FinancialGuidePage[] = [
    {
      id: "welcome",
      title: "Page 1: Welcome to Visceral - What This App Is",
      content:
        "This guide loads on your first login (or tap Guide in the menu anytime). Every section is short, scroll-friendly, and written in full sentences for easy reading on mobile.\n\nVisceral is not a real-money trading platform, gambling app, or simple stock tracker. It is a risk-free immersive financial literacy simulation: a safe yet realistic environment where you experience market pressure and learn to make better decisions.\n\nIn Visceral, you trade on our proprietary fictional stock exchange. Every buy or sell you execute creates actual volume, shifts liquidity, and moves prices, making the market feel alive and responsive (unlike traditional paper trading where your actions have no impact).\n\nThe Free Tier gives you complete access to the exchange, competitive leagues, the Almanack behavioral tracker, reflection tools, and community features. The Pro League Tournaments require a subscription and reward the top 50 performers with real cash prizes in skill-based competitions.\n\nOur core promise is straightforward: Trade the universe we built. Master the one you live in. You will start with curiosity, encounter slight discomfort from real pressure, develop respect for your own patterns, and ultimately build genuine growth in judgment and discipline.",
    },
    {
      id: "investment-types",
      title: "Page 2: Core Investment Types - What They Actually Mean",
      content:
        "Stocks represent ownership in a company. When you buy a stock, you own a small piece of that business and can profit from rising share prices or dividends paid out from profits. However, if the company performs poorly or fails, the stock value can drop significantly or even go to zero.\n\nBonds are essentially loans you give to a company or government. In return, you receive regular interest payments and get your principal back when the bond matures. Bonds are generally safer than stocks but usually deliver lower returns over time.\n\nETFs (Exchange-Traded Funds) are baskets of stocks, bonds, or other assets that trade on an exchange just like individual stocks. They offer instant diversification at low cost and are excellent for beginners who want broad market exposure without picking single companies.\n\nMutual funds work similarly to ETFs by pooling money from many investors to buy a diversified portfolio, but they are often actively managed by professionals and come with higher fees.\n\nMany new users confuse all investments as being equally risky - stocks offer high potential reward but high volatility, while bonds provide stability and income.",
    },
    {
      id: "market-mood",
      title: "Page 3: Market Directions and Key Concepts - Understanding the Mood",
      content:
        "A bull market occurs when prices are steadily rising and optimism dominates, encouraging more buying and higher valuations.\n\nA bear market begins when prices fall by 20% or more from recent highs, creating widespread fear and selling pressure that can drive prices even lower.\n\nVolatility measures how dramatically prices swing up and down. High volatility creates big opportunities but also big risks, while low volatility feels calmer but can hide building problems.\n\nA correction is a temporary drop of 10% or more, which happens regularly even in healthy markets. A crash is a sudden, sharp decline, often triggered by panic or external shocks.\n\nNew traders frequently panic during normal corrections or chase euphoria at market peaks - recognizing these phases helps you stay disciplined.",
    },
    {
      id: "valuation-metrics",
      title: "Page 4: Valuation Metrics - How They Work, Formulas, and Why They Matter",
      content:
        "The P/E ratio (Price-to-Earnings) is calculated as:\nP/E = Current Stock Price / Earnings Per Share (EPS)\n\nInvestors use it to understand how much they are paying for each dollar of earnings the company generates. A lower P/E can indicate the stock is undervalued or growing slowly, while a higher P/E often reflects strong growth expectations, though it can also mean the stock is overpriced if growth fails to materialize.\n\nThe PEG ratio builds on the P/E by adjusting for growth:\nPEG = P/E Ratio / Expected Annual Earnings Growth Rate (%)\n\nThis adjustment helps compare companies with different growth speeds fairly. A PEG below 1 suggests the stock may be undervalued relative to its growth potential, while a PEG above 1.5 often signals it is expensive.\n\nThe P/B ratio (Price-to-Book) compares the market price to the company's book value:\nP/B = Current Stock Price / Book Value Per Share\nBook value per share = (Total Assets - Total Liabilities) / Shares Outstanding\n\nIt shows whether the market values the company above or below its net assets on paper. When the P/B is below 1, the stock trades at a discount to its book value, which can be a bargain, but sometimes it reflects underlying problems. Above 3 usually means the market expects significant future growth beyond current assets.\n\nEV/EBITDA measures the enterprise value divided by operating earnings:\nEV/EBITDA = Enterprise Value / EBITDA\nEnterprise Value = Market Cap + Debt - Cash\nEBITDA = Earnings Before Interest, Taxes, Depreciation, and Amortization\n\nIt values the entire business rather than just equity and ignores differences in capital structure, making it useful for cross-company comparisons. A lower EV/EBITDA typically indicates a cheaper valuation, with common ranges falling between 6 and 18 times depending on the industry.",
    },
    {
      id: "more-metrics",
      title: "Page 5: More Metrics - Income, Size, Risk, and Formulas",
      content:
        "Dividend yield shows the income return from dividends:\nDividend Yield = (Annual Dividend Per Share / Current Stock Price) * 100%\n\nIt tells you the percentage income you would earn from dividends alone. A higher yield provides strong income (common in utilities or mature companies), but an unusually high yield can be a warning sign that the company is struggling and may cut the dividend.\n\nMarket capitalization sizes the company:\nMarket Cap = Current Share Price * Total Shares Outstanding\n\nIt helps classify companies by size: small-cap stocks (under $2 billion) tend to be riskier and more volatile, while large-cap stocks (over $10 billion) are usually more stable and established.\n\nBeta measures relative volatility:\nBeta = Covariance(Stock Returns, Market Returns) / Variance(Market Returns)\nS&P 500 beta = 1 by definition\n\nA beta above 1 means the stock is more volatile than the market and will amplify both ups and downs, while a beta below 1 indicates lower volatility and more stability.\n\nBeginners often fixate on one metric alone. Always look at several together and compare them to industry averages or historical levels for real insight.",
    },
    {
      id: "market-relationships",
      title: "Page 6: Key Market Relationships - When One Thing Moves, Another Often Follows",
      content:
        "When the 10-Year Treasury yield rises sharply, growth stocks and especially technology stocks tend to fall. Higher yields increase the discount rate applied to future earnings, making long-duration growth companies less attractive, and they make safer bonds more competitive compared to risky equities.\n\nWhen interest rates rise, existing bond prices fall because new bonds issued at higher rates become more appealing, reducing demand for older bonds with lower fixed payments. The relationship is inverse, and the effect is stronger for bonds with longer duration (a measure of sensitivity to rate changes).\n\nModerate inflation generally supports stocks because companies can raise prices and grow earnings, but very high inflation hurts bonds (fixed payments lose purchasing power) and can pressure growth stocks if rates rise to combat it.\n\nFederal Reserve rate cuts usually boost stock prices by making borrowing cheaper, increasing corporate profits, and raising valuations across the board.\n\nAn inverted yield curve (short-term yields higher than long-term) has historically been a reliable warning sign of an upcoming recession because it reflects expectations of economic slowdown and future rate cuts.\n\nA stronger U.S. dollar often pushes commodity prices lower because commodities are priced in dollars. A stronger dollar makes them more expensive for foreign buyers, reducing global demand.",
    },
    {
      id: "behavioral-traps",
      title: "Page 7: Behavioral Traps - The Real Reasons Most People Struggle",
      content:
        "Loss aversion causes people to feel the pain of losses about twice as strongly as the pleasure of gains, leading them to hold losing positions too long hoping for recovery and sell winners too early to lock in profits.\n\nOverconfidence makes traders believe they are better than average, causing excessive trading, ignoring diversification, and taking outsized risks.\n\nFOMO (fear of missing out) drives people to chase hot trends and buy at peak prices, often right before reversals.\n\nRecency bias leads investors to overweight the most recent events and assume short-term trends will continue indefinitely.\n\nIn Visceral, the Almanack tool highlights these patterns in your own trades so you can recognize and correct them before they become habits.",
    },
    {
      id: "quick-facts-2026",
      title: "Page 8: Quick Facts and Context for 2026",
      content:
        "The long-term average annualized return for the S&P 500 after inflation is roughly 7-10%.\n\nThe Federal Reserve targets inflation around 2%, though recent years have seen it fluctuate between 2.5% and 3.5%.\n\n10-Year Treasury yields in 2025-2026 have typically ranged from 3.75% to 4.5% during the normalization phase after rate cuts.\n\nHistorically, stocks outperform bonds over periods of 10 years or longer, but bonds provide crucial protection during market crashes.\n\nStudies consistently show that most retail traders underperform broad market indexes over the long term (around 80-90%) largely because of emotional decisions and poor timing.",
    },
    {
      id: "final-tips",
      title: "Page 9: Final Tips Before You Start Trading",
      content:
        "Begin with a free league to experience real pressure without any financial risk.\n\nAfter every trade, open Almanack to identify your emotional patterns and ask yourself honestly what drove the decision.\n\nRemember that markets do not care about your feelings. They reward consistent process and discipline over time.\n\nLosses in the simulation are valuable lessons, not failures.\n\nYour ultimate goal is to build repeatable decision-making habits and deeper self-awareness.\n\nYou are now ready. Jump into your first league. Revisit this guide anytime from the menu to Financial Guide.\n\nWelcome to Visceral. Let's build better judgment together.",
    },
  ];