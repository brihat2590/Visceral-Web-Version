export type TutorialFlowNavigationTarget = {
    pathname: string;
    params?: Record<string, string>;
  };
  
  export type TutorialFlowStep = {
    id: string;
    title: string;
    content: string;
    targetRoutes: string[];
    targetId?: string;
    navigateTo?: TutorialFlowNavigationTarget;
    navigateLabel?: string;
    requireOnTarget?: boolean;
    advanceOnTargetTap?: boolean;
    completeWhenPathStartsWith?: string[];
    requireSwipeToRoute?: boolean;
  };
  
  export const TUTORIAL_FLOW_STEPS: TutorialFlowStep[] = [
    {
      id: "home-balance",
      title: "Step 1: Paper Balance",
      content:
        "This highlighted card is your paper balance panel. Every new account starts with 100,000 virtual currency. Track total return and single-day return from here.",
      targetRoutes: ["/(dashboard)/first-entry"],
      targetId: "home.paper_balance",
      navigateTo: { pathname: "/(dashboard)/first-entry" },
      navigateLabel: "Go to Home",
      requireOnTarget: true,
    },
    {
      id: "home-almanack",
      title: "Step 2: Almanack",
      content:
        "This card is intentionally showing sample tutorial data. Almanack gives post-trade behavior analysis so you can improve decision quality over time.",
      targetRoutes: ["/(dashboard)/first-entry"],
      targetId: "home.almanack",
      navigateTo: { pathname: "/(dashboard)/first-entry" },
      navigateLabel: "Back to Home",
      requireOnTarget: true,
    },
    {
      id: "home-holdings",
      title: "Step 3: Holdings",
      content:
        "This section now shows sample tutorial holdings so you can understand layout, quantity, pricing, and performance at a glance.",
      targetRoutes: ["/(dashboard)/first-entry"],
      targetId: "home.holdings",
      requireOnTarget: true,
    },
    {
      id: "markets-timeline",
      title: "Step 4: Markets Timeline",
      content:
        "Swipe left once to open Markets. Then tap the highlighted time icon to view each exchange session in your local timezone.",
      targetRoutes: ["/(dashboard)/market-screen"],
      targetId: "markets.timeline_button",
      navigateTo: { pathname: "/(dashboard)/market-screen" },
      navigateLabel: "Go to Markets",
      requireOnTarget: true,
      requireSwipeToRoute: true,
    },
    {
      id: "markets-active-pills",
      title: "Step 5: Active Market Pills",
      content:
        "These highlighted pills show current market session state so you can quickly see where activity is live.",
      targetRoutes: ["/(dashboard)/market-screen"],
      targetId: "markets.active_market_pills",
      navigateTo: { pathname: "/(dashboard)/market-screen" },
      navigateLabel: "Back to Markets",
      requireOnTarget: true,
    },
    {
      id: "markets-search",
      title: "Step 6: Open Search",
      content:
        "Use the highlighted search bar to jump straight to a ticker.",
      targetRoutes: ["/(dashboard)/market-screen"],
      targetId: "markets.search_bar",
      navigateTo: { pathname: "/(dashboard)/market-screen" },
      navigateLabel: "Back to Markets",
      requireOnTarget: true,
    },
    {
      id: "search-msft",
      title: "Step 7: Search MSFT",
      content:
        "Type MSFT in the highlighted search box, then open the NASDAQ US listing. Move only when you are ready.",
      targetRoutes: ["/(dashboard)/search"],
      targetId: "search.input",
      navigateTo: { pathname: "/(dashboard)/search" },
      navigateLabel: "Open Search",
      requireOnTarget: true,
      advanceOnTargetTap: false,
      completeWhenPathStartsWith: ["/stock-details"],
    },
    {
      id: "stock-watchlist",
      title: "Step 8: Stock Watchlist",
      content:
        "On stock details, this highlighted top-right control adds or removes the stock from watchlist.",
      targetRoutes: ["/(dashboard)/stock-details"],
      targetId: "stock.watchlist_button",
      navigateTo: {
        pathname: "/stock-details/[ticker]",
        params: {
          ticker: "MSFT",
          market: "US",
        },
      },
      navigateLabel: "Open MSFT Page",
      requireOnTarget: true,
    },
    {
      id: "stock-trading-tools",
      title: "Step 9: Stock Trading Tools",
      content:
        "This highlighted area covers range switches, buy/sell actions, and fundamentals so you can evaluate before placing trades.",
      targetRoutes: ["/(dashboard)/stock-details"],
      targetId: "stock.trade_controls",
      navigateTo: {
        pathname: "/stock-details/[ticker]",
        params: {
          ticker: "MSFT",
          market: "US",
        },
      },
      navigateLabel: "Back to MSFT",
      requireOnTarget: true,
    },
    {
      id: "social-overview",
      title: "Step 10: Social Tabs",
      content:
        "Swipe left once to open Social. Lab contains By US (Visceral AI daily market inference) and By You (people's opinions). Hub contains Discover and Friends.",
      targetRoutes: ["/(dashboard)/social"],
      targetId: "social.root_tabs",
      navigateTo: { pathname: "/(dashboard)/social" },
      navigateLabel: "Open Social",
      requireOnTarget: true,
      requireSwipeToRoute: true,
    },
    {
      id: "social-friends",
      title: "Step 11: Add Friends",
      content:
        "This highlighted card is your Friends workflow. Search users, send requests, and manage your network. Discover shows your friends' activity feed.",
      targetRoutes: ["/(dashboard)/social"],
      targetId: "social.add_friend_card",
      navigateTo: {
        pathname: "/(dashboard)/social",
        params: {
          tab: "friends",
        },
      },
      navigateLabel: "Open Add Friends",
      requireOnTarget: true,
    },
    {
      id: "profile",
      title: "Step 12: Profile Quick Access",
      content:
        "Finish on Profile. Top metrics show Streak and Trader Days, and you can change your profile picture from the avatar action. Quick Access includes Play Tutorial and Financial Guide.",
      targetRoutes: ["/(dashboard)/settings"],
      targetId: "profile.quick_access",
      navigateTo: { pathname: "/(dashboard)/settings" },
      navigateLabel: "Open Profile",
      requireOnTarget: true,
    },
  ];