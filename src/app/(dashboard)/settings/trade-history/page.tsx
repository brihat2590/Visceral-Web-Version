"use client"

import React, { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import VisceralLoader from "@/components/Loader"
import { ArrowUpRight, ArrowDownLeft, Search, Lock, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function TradeHistoryPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [trades, setTrades] = useState<any[]>([])
  const [isPrivate, setIsPrivate] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    async function getTradeData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [userRow, tradeData] = await Promise.all([
        supabase
          .from("users")
          .select("trade_history_privy")
          .eq("id", user.id)
          .maybeSingle(),
        supabase
          .from("trades")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
      ])

      if (userRow.data) setIsPrivate(userRow.data.trade_history_privy)
      if (tradeData.data) setTrades(tradeData.data)
      setLoading(false)
    }
    getTradeData()
  }, [supabase])

  const filteredTrades = trades.filter(t => 
    t.symbol?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) return (
    <div className="flex min-h-[50vh] w-full items-center justify-center bg-black">
      <VisceralLoader size="lg" />
    </div>
  )

  return (
    <div className="max-w-6xl mx-auto py-12 px-6 bg-black text-white min-h-screen">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex gap-3 justify-center items-center">
            <Link href="/settings"><ArrowLeft/></Link>
            <h1 className="text-4xl font-bold tracking-tight">History</h1>
            </div>
            {isPrivate && (
              <div className="flex items-center gap-1.5 px-2 py-1 bg-white/5 border border-white/10 rounded text-[10px] text-white/40 uppercase tracking-widest font-bold">
                <Lock size={10} /> Private
              </div>
            )}
          </div>
          <p className="text-white/40 font-normal">Review your previous market executions.</p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={16} />
          <input 
            type="text"
            placeholder="Search assets..."
            value={searchTerm}
            className="bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-white transition-all w-full md:w-64 font-normal"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </header>

      {/* Responsive Wrapper */}
      <div className="border border-white/10 rounded-2xl overflow-x-auto bg-white/[0.01]">
        <table className="w-full min-w-[700px] text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 bg-white/[0.02]">
              <th className="px-6 py-5 text-[11px] font-bold uppercase tracking-[0.2em] text-white/30">Date</th>
              <th className="px-6 py-5 text-[11px] font-bold uppercase tracking-[0.2em] text-white/30">Asset</th>
              <th className="px-6 py-5 text-[11px] font-bold uppercase tracking-[0.2em] text-white/30 text-center">Action</th>
              <th className="px-6 py-5 text-[11px] font-bold uppercase tracking-[0.2em] text-white/30 text-center">Quantity</th>
              <th className="px-6 py-5 text-[11px] font-bold uppercase tracking-[0.2em] text-white/30 text-right">Price</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredTrades.length > 0 ? filteredTrades.map((trade) => (
              <tr key={trade.id} className="group hover:bg-white/[0.03] transition-colors">
                <td className="px-6 py-6 text-sm text-white/50 font-normal">
                  {new Date(trade.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </td>
                <td className="px-6 py-6 font-bold text-white tracking-tight">
                  {trade.symbol}
                </td>
                {/* Fixed Action Cell */}
                <td className="px-6 py-6 text-center">
                  <div className="flex justify-center">
                    <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded text-[11px] font-bold ${
                      trade.side === 'BUY' ? 'bg-white text-black' : 'border border-white/20 text-white/80'
                    }`}>
                      {trade.side === 'BUY' ? <ArrowDownLeft size={12} /> : <ArrowUpRight size={12} />}
                      {trade.side}
                    </div>
                  </div>
                </td>
                {/* Fixed Quantity Cell */}
                <td className="px-6 py-6 text-center text-sm text-white/70 font-normal">
                   {trade.quantity} <span className="text-[10px] opacity-40 uppercase ml-1">shares</span>
                </td>
                <td className="px-6 py-6 text-right font-normal text-white">
                  ${Number(trade.price).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={5} className="py-24 text-center text-white/20 text-sm font-normal">
                  No execution history found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}