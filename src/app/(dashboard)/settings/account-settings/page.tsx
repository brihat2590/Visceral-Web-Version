"use client"

import React, { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import VisceralLoader from "@/components/Loader"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Trash2, AlertTriangle, X } from "lucide-react"

export default function SettingsPage() {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const [message, setMessage] = useState({ type: "", text: "" })

  function handleConfirm() {
    router.push('/delete-account')
    toast.success("Account deletion initiated")
  }

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  })

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setFormData((prev) => ({
          ...prev,
          email: user.email || "",
          username: user.user_metadata?.username || "",
        }))
      }
      setLoading(false)
    }
    getUser()
  }, [supabase])

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdating(true)
    setMessage({ type: "", text: "" })

    const { error } = await supabase.auth.updateUser({
      email: formData.email,
      password: formData.password || undefined,
      data: { username: formData.username }
    })

    if (error) {
      setMessage({ type: "error", text: error.message })
    } else {
      setMessage({ type: "success", text: "Profile updated successfully." })
      setFormData(prev => ({ ...prev, password: "" }))
    }
    setUpdating(false)
  }

  if (loading) return (
    <div className="flex h-full items-center justify-center">
      <VisceralLoader size="lg" />
    </div>
  )

  return (
    <div className="max-w-5xl mx-auto py-12 px-6">
      <header className="mb-10">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Settings</h1>
        </div>
        <p className="text-white/40 font-normal">Manage your account details and security.</p>
      </header>

      <form onSubmit={handleUpdateProfile} className="space-y-8">
        {/* Profile Section */}
        <section className="space-y-4">
          <h2 className="text-sm uppercase tracking-widest text-white/20 font-bold">Profile</h2>

          <div className="space-y-2">
            <label className="text-xs text-white/60 ml-1">Username</label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white transition-colors"
              placeholder="Your username"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs text-white/60 ml-1">Email Address</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white transition-colors"
              placeholder="email@example.com"
            />
          </div>
        </section>

        {/* Security Section */}
        <section className="space-y-4">
          <h2 className="text-sm uppercase tracking-widest text-white/20 font-bold">Security</h2>
          <div className="space-y-2">
            <label className="text-xs text-white/60 ml-1">New Password</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white transition-colors"
              placeholder="Leave blank to keep current"
            />
          </div>
        </section>

        {/* Feedback Message */}
        {message.text && (
          <div className={`p-4 rounded-lg text-sm ${message.type === 'error' ? 'bg-red-500/10 text-red-400' : 'bg-white/10 text-white'}`}>
            {message.text}
          </div>
        )}

        {/* Save Changes Button */}
        <button
          type="submit"
          disabled={updating}
          className="w-full bg-white text-black font-bold py-4 rounded-lg hover:bg-white/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {updating ? <VisceralLoader size="sm" /> : "Save Changes"}
        </button>

        {/* ── Delete Account Trigger Button ── */}
        <button
          type="button"
          onClick={() => setConfirm(true)}
          className="w-full font-bold py-4 rounded-lg transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 text-zinc-400 hover:text-red-400 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-red-900/50 active:scale-[0.98]"
        >
          <Trash2 size={16} />
          Delete my Account
        </button>
      </form>

      {/* ── Confirmation Modal ── */}
      {confirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-title"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setConfirm(false)}
          />

          {/* Modal Card */}
          <div className="relative z-10 w-full max-w-sm bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl p-6 flex flex-col gap-5 animate-in fade-in zoom-in-95 duration-200">

            {/* Close Button */}
            <button
              type="button"
              onClick={() => setConfirm(false)}
              className="absolute top-4 right-4 text-zinc-600 hover:text-zinc-300 transition-colors"
              aria-label="Close"
            >
              <X size={16} />
            </button>

            {/* Icon + Heading */}
            <div className="flex flex-col items-center text-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-950/50 border border-red-900/50">
                <AlertTriangle size={22} className="text-red-500" />
              </div>
              <div>
                <h2
                  id="confirm-title"
                  className="text-white font-bold text-lg tracking-tight"
                >
                  Delete Account?
                </h2>
                <p className="text-zinc-500 text-sm mt-1 leading-relaxed">
                  This action is{" "}
                  <span className="text-red-400 font-semibold">permanent</span>{" "}
                  and cannot be undone. All your data will be erased forever.
                </p>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-zinc-800 w-full" />

            {/* Action Buttons */}
            <div className="flex flex-col gap-2">
              {/* Confirm — Yes, Delete */}
              <button
                type="button"
                onClick={handleConfirm}
                className="w-full py-3 rounded-lg font-bold text-sm transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2 bg-red-950/60 hover:bg-red-900/70 text-red-400 hover:text-red-300 border border-red-900/50 hover:border-red-700/60"
              >
                <Trash2 size={14} />
                Yes, permanently delete
              </button>

              {/* Cancel */}
              <button
                type="button"
                onClick={() => setConfirm(false)}
                className="w-full py-3 rounded-lg font-bold text-sm transition-all duration-200 active:scale-[0.98] text-zinc-400 hover:text-zinc-200 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800"
              >
                Cancel, keep my account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}