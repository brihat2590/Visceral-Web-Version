'use client';

import React, { useState } from 'react';

export default function ContactPage() {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    subject: '',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      setFormData({ email: '', subject: '', message: '' });
    }, 1500);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-8 py-16 relative overflow-hidden">
      {/* Subtle grid background */}
      <div
        className="absolute inset-0 z-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(to right, #fff 1px, transparent 1px),
            linear-gradient(to bottom, #fff 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px',
        }}
      />

      <div className="relative z-10 w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-stretch">
        
        {/* Left Side - Form */}
        <div className="flex flex-col justify-center">
          <header className="mb-12">
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-4">
              Get In Touch
            </h1>
            <p className="text-neutral-400 text-base leading-relaxed">
              Whether you have inquiries regarding institutional partnerships,
              technical support, or the Visceral platform, we are here to assist
              you. Please fill out the form below and our team will respond
              promptly.
            </p>
          </header>

          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-widest text-neutral-400 block mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full bg-transparent border-b border-neutral-700 py-3 text-sm focus:outline-none focus:border-neutral-300 transition-colors placeholder:text-neutral-600"
                  placeholder="your.email@company.com"
                />
              </div>

              {/* Subject */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-widest text-neutral-400 block mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className="w-full bg-transparent border-b border-neutral-700 py-3 text-sm focus:outline-none focus:border-neutral-300 transition-colors placeholder:text-neutral-600"
                  placeholder="Inquiry regarding partnership"
                />
              </div>

              {/* Message */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-widest text-neutral-400 block mb-2">
                  Message
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  className="w-full bg-transparent border border-neutral-700 p-4 text-sm focus:outline-none focus:border-neutral-300 transition-colors placeholder:text-neutral-600 resize-none leading-relaxed min-h-40"
                  placeholder="Please provide details regarding your inquiry..."
                />
              </div>

              {/* Submit */}
              <div className="flex justify-start pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-3 bg-white hover:bg-neutral-100 disabled:bg-neutral-800 text-black disabled:text-neutral-500 font-semibold text-sm uppercase tracking-wider transition-colors duration-200"
                >
                  {loading ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </form>
          ) : (
            <div className="py-12 animate-in fade-in duration-500">
              <h2 className="text-3xl font-bold mb-4">Thank You</h2>
              <p className="text-neutral-400 text-base leading-relaxed mb-8">
                Your inquiry has been received. Our team will review your message
                and respond within 24 business hours. We appreciate your
                interest in Visceral.
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="text-neutral-400 hover:text-white text-sm font-semibold uppercase tracking-wider transition-colors"
              >
                Send Another Message
              </button>
            </div>
          )}
        </div>

        {/* Right Side - Image */}
        <div className="hidden lg:flex items-center justify-center">
          <div className="w-full max-w-lg aspect-square">
            <img
              src="https://images.pexels.com/photos/1122409/pexels-photo-1122409.jpeg"
              alt="Abstract geometric visualization"
              className="w-full h-full object-cover rounded-2xl"
            />
          </div>
        </div>
      </div>
    </div>
  );
}