"use client"

import React, { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import VisceralLoader from "@/components/Loader" // Use the loader we created earlier

export default function SettingsPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [message, setMessage] = useState({ type: "", text: "" })

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
      password: formData.password || undefined, // Only update if typed
      data: { username: formData.username }
    })

    if (error) {
      setMessage({ type: "error", text: error.message })
    } else {
      setMessage({ type: "success", text: "Profile updated successfully." })
      setFormData(prev => ({ ...prev, password: "" })) // Clear password field
    }
    setUpdating(false)
  }

  if (loading) return (
    <div className="flex h-full items-center justify-center">
      <VisceralLoader size="lg" />
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto py-12 px-6">
      <header className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Settings</h1>
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

        <button
          type="submit"
          disabled={updating}
          className="w-full bg-white text-black font-bold py-4 rounded-lg hover:bg-white/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {updating ? <VisceralLoader size="sm" /> : "Save Changes"}
        </button>
      </form>
    </div>
  )
}