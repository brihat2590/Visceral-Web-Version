"use client"
import React, { useState, useEffect } from 'react';
import { Check } from 'lucide-react'; 
import { useRouter } from 'next/navigation';
import VisceralLoader from '@/components/Loader';

const ConfirmationModal = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [isRouting, setIsRouting] = useState(false); // ✅ added
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 10);
    return () => clearTimeout(t);
  }, []);

  // ✅ Show loader during routing
  if (isRouting) {
    return (
      <div className="fixed inset-0 z-[999] bg-black flex items-center justify-center">
        <VisceralLoader />
      </div>
    );
  }

  if (!isOpen) return null;

  return (
    <>
      <style>{`
        @keyframes backdropFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        @keyframes cardSlideUp {
          from {
            opacity: 0;
            transform: translateY(32px) scale(0.97);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes iconPop {
          0%   { opacity: 0; transform: scale(0.4) rotate(-15deg); }
          60%  { transform: scale(1.15) rotate(4deg); }
          80%  { transform: scale(0.95) rotate(-2deg); }
          100% { opacity: 1; transform: scale(1) rotate(0deg); }
        }

        @keyframes checkDraw {
          from { stroke-dashoffset: 40; opacity: 0; }
          to   { stroke-dashoffset: 0;  opacity: 1; }
        }

        @keyframes textFadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @keyframes ringPulse {
          0%   { box-shadow: 0 0 0 0 rgba(255,255,255,0.35); }
          70%  { box-shadow: 0 0 0 14px rgba(255,255,255,0); }
          100% { box-shadow: 0 0 0 0 rgba(255,255,255,0); }
        }

        @keyframes buttonReveal {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .backdrop {
          animation: backdropFadeIn 0.4s ease forwards;
        }

        .modal-card {
          animation: cardSlideUp 0.55s cubic-bezier(0.22, 1, 0.36, 1) 0.05s both;
        }

        .icon-ring {
          animation: iconPop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s both,
                     ringPulse 1.2s ease 0.9s;
        }

        .check-icon {
          stroke-dasharray: 40;
          stroke-dashoffset: 40;
          animation: checkDraw 0.45s ease 0.75s forwards;
        }

        .heading {
          animation: textFadeUp 0.4s ease 0.65s both;
        }

        .subtext {
          animation: textFadeUp 0.4s ease 0.78s both;
        }

        .done-btn {
          animation: buttonReveal 0.4s ease 0.88s both;
        }

        .done-btn:hover {
          background: #e4e4e4;
          transform: translateY(-1px);
          box-shadow: 0 6px 24px rgba(255,255,255,0.12);
        }

        .done-btn:active {
          transform: translateY(0px);
        }

        .done-btn {
          transition: background 0.18s ease, transform 0.15s ease, box-shadow 0.18s ease;
        }

        .modal-card::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background: repeating-linear-gradient(
            0deg,
            transparent,
            transparent 3px,
            rgba(255,255,255,0.012) 3px,
            rgba(255,255,255,0.012) 4px
          );
          pointer-events: none;
        }

        .modal-card::after {
          content: '';
          position: absolute;
          top: 0; left: 20%; right: 20%;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent);
          border-radius: 50%;
          animation: textFadeUp 0.6s ease 0.4s both;
        }
      `}</style>

      <div
        className="backdrop fixed inset-0 z-50 flex items-center justify-center"
        style={{ background: 'rgba(0,0,0,0.96)', backdropFilter: 'blur(4px)' }}
      >
        <div className="flex flex-col items-center w-full max-w-md px-6">

          <div
            className="modal-card relative w-full rounded-2xl p-10 flex flex-col items-center mb-8 overflow-hidden"
            style={{
              background: '#000000',
              boxShadow: '0 32px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)',
            }}
          >
            <div
              className="icon-ring w-20 h-20 rounded-full flex items-center justify-center mb-8"
              style={{
                border: '1.5px solid rgba(255,255,255,0.85)',
                background: 'radial-gradient(circle at 40% 35%, rgba(255,255,255,0.06), transparent 70%)',
              }}
            >
              <Check
                className="check-icon text-white w-9 h-9"
                strokeWidth={2.5}
              />
            </div>

            <h1 className="heading text-white text-2xl font-semibold mb-3 tracking-tight">
              Buy confirmed
            </h1>

            <p className="subtext text-center text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.38)' }}>
              Your position has been added.<br />
              Reflection saved to Almanack
            </p>

            <div style={{
              position: 'absolute', bottom: 12, right: 16,
              width: 40, height: 40,
              borderRight: '1px solid rgba(255,255,255,0.06)',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '0 0 4px 0',
            }} />
            <div style={{
              position: 'absolute', top: 12, left: 16,
              width: 40, height: 40,
              borderLeft: '1px solid rgba(255,255,255,0.06)',
              borderTop: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '4px 0 0 0',
            }} />
          </div>

          <button
            onClick={() => {
              setIsRouting(true); // ✅ show loader
              router.push("/first-entry");
            }}
            className="done-btn w-full max-w-[200px] bg-white text-black py-4 rounded-xl font-bold"
            style={{ letterSpacing: '0.01em' }}
          >
            Done
          </button>

        </div>
      </div>
    </>
  );
};

export default ConfirmationModal;