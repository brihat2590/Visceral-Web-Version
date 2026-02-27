"use client";

import {
  useTutorialFlowHighlight,
  type TutorialHighlightRect,
} from "@/lib/tutorial-flow-highlight-context";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

type TutorialHighlightTargetProps = {
  targetId: string;
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
};

function isSameRect(
  left: TutorialHighlightRect | null | undefined,
  right: TutorialHighlightRect
) {
  if (!left) return false;
  return (
    Math.abs(left.x - right.x) < 2 &&
    Math.abs(left.y - right.y) < 2 &&
    Math.abs(left.width - right.width) < 2 &&
    Math.abs(left.height - right.height) < 2
  );
}

export default function TutorialHighlightTarget({
  targetId,
  children,
  className,
  style,
}: TutorialHighlightTargetProps) {
  const tutorialHighlight = useTutorialFlowHighlight();

  // ── Refs (replace RN View ref + frame tracking) ─────────
  const containerRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number | null>(null);
  const latestRectRef = useRef<TutorialHighlightRect | null>(null);

  // ── Derived booleans (same logic as RN) ─────────────────
  const isActiveTarget = useMemo(() => {
    if (!tutorialHighlight?.isTutorialVisible) return false;
    return tutorialHighlight.activeTargetId === targetId;
  }, [
    targetId,
    tutorialHighlight?.activeTargetId,
    tutorialHighlight?.isTutorialVisible,
  ]);

  const isTutorialVisible = tutorialHighlight?.isTutorialVisible === true;
  const isDimmed =
    isTutorialVisible &&
    !!tutorialHighlight?.activeTargetId &&
    !isActiveTarget;

  // ── Animation state (replaces react-native-reanimated) ──
  // We drive the glow purely with CSS transitions + a pulsing
  // keyframe injected once via a <style> tag.
  const [activeProgress, setActiveProgress] = useState(
    isActiveTarget ? 1 : 0
  );
  const [pulseOn, setPulseOn] = useState(false);

  useEffect(() => {
    // Transition to active/inactive (matches withTiming 240ms)
    setActiveProgress(isActiveTarget ? 1 : 0);

    if (isActiveTarget && isTutorialVisible) {
      setPulseOn(true);
    } else {
      setPulseOn(false);
    }
  }, [isActiveTarget, isTutorialVisible]);

  // ── Measurement (replaces measureInWindow) ──────────────
  const measureTarget = useCallback(() => {
    if (!tutorialHighlight || !containerRef.current) return;

    const el = containerRef.current;
    const rect = el.getBoundingClientRect();

    // getBoundingClientRect gives viewport-relative coordinates —
    // same as measureInWindow in React Native.
    const x = Math.round(rect.left + window.scrollX);
    const y = Math.round(rect.top + window.scrollY);
    const width = Math.round(rect.width);
    const height = Math.round(rect.height);

    if (width <= 0 || height <= 0) {
      if (latestRectRef.current) {
        latestRectRef.current = null;
        tutorialHighlight.registerTarget(targetId, null);
      }
      return;
    }

    const nextRect: TutorialHighlightRect = { x, y, width, height };
    if (isSameRect(latestRectRef.current, nextRect)) return;

    latestRectRef.current = nextRect;
    tutorialHighlight.registerTarget(targetId, nextRect);
  }, [targetId, tutorialHighlight]);

  const scheduleMeasure = useCallback(() => {
    if (!tutorialHighlight) return;
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);

    // Double rAF — same pattern as the RN version
    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = requestAnimationFrame(() => {
        frameRef.current = null;
        measureTarget();
      });
    });
  }, [measureTarget, tutorialHighlight]);

  // Initial measure + cleanup (replaces onLayout + useEffect combo)
  useEffect(() => {
    if (!tutorialHighlight) return;

    // ResizeObserver replaces onLayout
    const ro = new ResizeObserver(() => scheduleMeasure());
    if (containerRef.current) ro.observe(containerRef.current);

    scheduleMeasure();

    return () => {
      ro.disconnect();
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      latestRectRef.current = null;
      tutorialHighlight.registerTarget(targetId, null);
    };
  }, [scheduleMeasure, targetId, tutorialHighlight]);

  // Polling when active (replaces setInterval in RN)
  useEffect(() => {
    if (!tutorialHighlight || !isActiveTarget) return;

    scheduleMeasure();
    const intervalId = setInterval(() => scheduleMeasure(), 220);

    return () => clearInterval(intervalId);
  }, [isActiveTarget, scheduleMeasure, tutorialHighlight]);

  // Re-measure on scroll (web-specific — position changes on scroll)
  useEffect(() => {
    if (!tutorialHighlight) return;
    window.addEventListener("scroll", scheduleMeasure, { passive: true });
    window.addEventListener("resize", scheduleMeasure, { passive: true });
    return () => {
      window.removeEventListener("scroll", scheduleMeasure);
      window.removeEventListener("resize", scheduleMeasure);
    };
  }, [scheduleMeasure, tutorialHighlight]);

  // ── Interaction handler (replaces onTouchStart) ──────────
  const handlePointerDown = useCallback(() => {
    if (!tutorialHighlight?.isTutorialVisible) return;
    if (tutorialHighlight.activeTargetId !== targetId) return;
    tutorialHighlight.onTargetInteracted?.(targetId);
  }, [targetId, tutorialHighlight]);

  // ── Derived inline styles (replaces useAnimatedStyle) ────
  // CSS transitions handle the smooth enter/exit (240ms cubic-out).
  // The pulse is a CSS @keyframes animation toggled via a class.
  const emphasis = activeProgress; // 0 → 1

  const borderAlpha = emphasis * 0.36 + (pulseOn ? 0.14 : 0);
  const bgAlpha = emphasis * 0.055 + (pulseOn ? 0.02 : 0);
  const shadowOpacity = emphasis * 0.2 + (pulseOn ? 0.12 : 0);
  const shadowRadius = emphasis * 14 + (pulseOn ? 7 : 0);
  const borderRadius = 16 + emphasis * 6; // 16 → 22

  const computedStyle: React.CSSProperties = {
    borderRadius,
    borderWidth: emphasis > 0.01 ? 1 : 0,
    borderStyle: "solid" as const,
    borderColor: `rgba(210, 228, 255, ${borderAlpha})`,
    backgroundColor: `rgba(236, 245, 255, ${bgAlpha})`,
    boxShadow:
      emphasis > 0.01
        ? `0 0 ${shadowRadius}px rgba(215, 231, 255, ${shadowOpacity})`
        : "none",
    zIndex: emphasis > 0.01 ? 12 : undefined,
    opacity: isDimmed ? 0.34 : 1,
    pointerEvents: isDimmed ? "none" : "auto",
    // Smooth transitions — mirrors withTiming(240ms) + withTiming(180ms)
    transition:
      "border-color 240ms cubic-bezier(0,0,0.39,1), " +
      "background-color 240ms cubic-bezier(0,0,0.39,1), " +
      "box-shadow 240ms cubic-bezier(0,0,0.39,1), " +
      "opacity 180ms ease-out, " +
      "border-radius 240ms cubic-bezier(0,0,0.39,1)",
    ...style,
  };

  return (
    <>
      {/* ── Keyframe injection (once per page) ── */}
      <style>{`
        @keyframes tutorial-pulse {
          0%, 100% {
            box-shadow: 0 0 14px rgba(215, 231, 255, 0.20);
            border-color: rgba(210, 228, 255, 0.36);
          }
          50% {
            box-shadow: 0 0 28px rgba(215, 231, 255, 0.44);
            border-color: rgba(210, 228, 255, 0.64);
          }
        }
        .tutorial-pulse-active {
          animation: tutorial-pulse 940ms ease-in-out infinite;
        }
      `}</style>

      <div
        ref={containerRef}
        className={[
          className,
          pulseOn ? "tutorial-pulse-active" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        style={computedStyle}
        onPointerDown={handlePointerDown}
      >
        {children}
      </div>
    </>
  );
}