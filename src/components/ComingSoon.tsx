'use client';

import { useState, useEffect } from 'react';
import { ChevronRight, TrendingUp, BarChart3, PieChart, LineChart, Bell, Settings } from 'lucide-react';

interface FeatureCard {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  comingSoon: string;
  accent: string;
}

const features: FeatureCard[] = [
  {
    id: 1,
    title: 'Advanced Analytics',
    description: 'Deep insights into market trends with AI-powered predictions and real-time data analysis.',
    icon: <TrendingUp size={32} />,
    comingSoon: 'Q1 2025',
    accent: 'from-emerald-500/20 to-emerald-950/20',
  },
  {
    id: 2,
    title: 'Portfolio Management',
    description: 'Comprehensive portfolio tracking with risk assessment and rebalancing recommendations.',
    icon: <PieChart size={32} />,
    comingSoon: 'Q1 2025',
    accent: 'from-blue-500/20 to-blue-950/20',
  },
  {
    id: 3,
    title: 'Custom Alerts',
    description: 'Set up intelligent alerts for price movements, volume spikes, and market conditions.',
    icon: <Bell size={32} />,
    comingSoon: 'Q2 2025',
    accent: 'from-rose-500/20 to-rose-950/20',
  },
  {
    id: 4,
    title: 'Performance Dashboard',
    description: 'Track your trading performance with detailed metrics and historical analysis.',
    icon: <BarChart3 size={32} />,
    comingSoon: 'Q2 2025',
    accent: 'from-violet-500/20 to-violet-950/20',
  },
  {
    id: 5,
    title: 'Strategy Builder',
    description: 'Create and backtest custom trading strategies with historical data validation.',
    icon: <LineChart size={32} />,
    comingSoon: 'Q2 2025',
    accent: 'from-amber-500/20 to-amber-950/20',
  },
  {
    id: 6,
    title: 'Settings & Preferences',
    description: 'Customize your trading environment, notification preferences, and account settings.',
    icon: <Settings size={32} />,
    comingSoon: 'Q3 2025',
    accent: 'from-slate-500/20 to-slate-950/20',
  },
];

export default function ComingSoonPage() {
  const [visibleCards, setVisibleCards] = useState<number[]>([]);

  useEffect(() => {
    // Stagger the animation of cards
    features.forEach((_, index) => {
      setTimeout(() => {
        setVisibleCards((prev) => [...prev, index]);
      }, index * 150);
    });
  }, []);

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Background gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-black via-neutral-900 to-black pointer-events-none" />

      {/* Grid pattern overlay */}
      <div className="fixed inset-0 opacity-5 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(0deg, transparent 24%, rgba(255, 255, 255, 0.05) 25%, rgba(255, 255, 255, 0.05) 26%, transparent 27%, transparent 74%, rgba(255, 255, 255, 0.05) 75%, rgba(255, 255, 255, 0.05) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(255, 255, 255, 0.05) 25%, rgba(255, 255, 255, 0.05) 26%, transparent 27%, transparent 74%, rgba(255, 255, 255, 0.05) 75%, rgba(255, 255, 255, 0.05) 76%, transparent 77%, transparent)',
        backgroundSize: '50px 50px',
      }} />

      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-neutral-800/50 backdrop-blur-sm sticky top-0 z-20">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center font-bold">
                  V
                </div>
                <span className="text-xl font-bold tracking-tight">Visceral</span>
              </div>
              <nav className="hidden md:flex items-center gap-8 text-sm">
                <a href="/" className="text-neutral-400 hover:text-neutral-100 transition-colors">
                  Dashboard
                </a>
                <a href="#features" className="text-neutral-100 font-medium">
                  Upcoming Features
                </a>
              </nav>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-6 py-20 md:py-32 text-center">
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="inline-block">
              <div className="text-xs font-bold tracking-[2px] text-emerald-400 uppercase bg-emerald-950/30 border border-emerald-500/20 rounded-full px-4 py-2">
                Coming Soon
              </div>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold leading-tight text-balance">
              The Future of
              <span className="block bg-gradient-to-r from-emerald-400 via-white to-emerald-400 bg-clip-text text-transparent">
                Trading Intelligence
              </span>
            </h1>

            <p className="text-lg md:text-xl text-neutral-400 max-w-2xl mx-auto leading-relaxed">
              We're building the next generation of trading tools. Explore the upcoming features designed to revolutionize your trading experience.
            </p>

            <div className="flex items-center justify-center gap-4 pt-4">
              <a
                href="/"
                className="px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-black font-semibold rounded-lg transition-all transform hover:scale-105 duration-200 flex items-center gap-2"
              >
                Back to Dashboard
                <ChevronRight size={18} />
              </a>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section id="features" className="max-w-7xl mx-auto px-6 py-20">
          <div className="space-y-4 mb-12">
            <h2 className="text-3xl md:text-4xl font-bold">What's Next</h2>
            <p className="text-neutral-400 text-lg">Discover the new capabilities being developed for Visceral</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={feature.id}
                className={`transform transition-all duration-500 ${
                  visibleCards.includes(index)
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 translate-y-8'
                }`}
              >
                <div className={`group card-base rounded-xl p-8 border border-neutral-800 hover:border-neutral-700 h-full flex flex-col gap-4 cursor-pointer hover:shadow-lg hover:shadow-neutral-950/50 transition-all duration-300 bg-gradient-to-br ${feature.accent}`}>
                  {/* Icon */}
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-neutral-700 to-neutral-800 flex items-center justify-center text-neutral-300 group-hover:text-emerald-400 transition-colors duration-300">
                    {feature.icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 space-y-3">
                    <h3 className="text-xl font-bold text-neutral-100">{feature.title}</h3>
                    <p className="text-neutral-400 text-sm leading-relaxed">{feature.description}</p>
                  </div>

                  {/* Footer */}
                  <div className="pt-4 border-t border-neutral-800/50 flex items-center justify-between">
                    <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wide">
                      {feature.comingSoon}
                    </span>
                    <ChevronRight size={16} className="text-neutral-600 group-hover:text-emerald-400 transition-colors duration-300 group-hover:translate-x-1 transform" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Timeline Section */}
        <section className="max-w-7xl mx-auto px-6 py-20 border-t border-neutral-800/50">
          <div className="space-y-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Development Roadmap</h2>
              <p className="text-neutral-400 text-lg">Our commitment to building the future of trading</p>
            </div>

            <div className="space-y-8">
              {['Q1 2025', 'Q2 2025', 'Q3 2025'].map((quarter, idx) => (
                <div key={quarter} className="flex gap-6 animate-in fade-in slide-in-from-left-4 duration-700" style={{ animationDelay: `${300 + idx * 150}ms` }}>
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center">
                      <div className="w-3 h-3 rounded-full bg-emerald-400" />
                    </div>
                    {idx < 2 && <div className="w-1 h-16 bg-gradient-to-b from-emerald-500/50 to-emerald-500/0 mt-2" />}
                  </div>
                  <div className="pb-8 flex-1">
                    <h3 className="text-lg font-bold mb-2">{quarter}</h3>
                    <ul className="space-y-2 text-sm text-neutral-400">
                      {features
                        .filter((f) => f.comingSoon === quarter)
                        .map((f) => (
                          <li key={f.id} className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/50" />
                            {f.title}
                          </li>
                        ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer CTA */}
        <section className="max-w-7xl mx-auto px-6 py-20 border-t border-neutral-800/50">
          <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-950/20 border border-emerald-500/20 rounded-2xl p-12 text-center space-y-6">
            <h2 className="text-3xl font-bold">Stay Updated</h2>
            <p className="text-neutral-300 max-w-xl mx-auto">
              Be the first to know when new features launch. Check back regularly for updates on our development progress.
            </p>
            <a
              href="/"
              className="inline-block px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-black font-semibold rounded-lg transition-all transform hover:scale-105 duration-200"
            >
              Return to Trading
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
