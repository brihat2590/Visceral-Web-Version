import { createContext, useContext, type ReactNode } from "react";

export type TutorialHighlightRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type TutorialFlowHighlightContextValue = {
  activeTargetId: string | null;
  isTutorialVisible: boolean;
  registerTarget: (targetId: string, rect: TutorialHighlightRect | null) => void;
  onTargetInteracted?: (targetId: string) => void;
};

const TutorialFlowHighlightContext =
  createContext<TutorialFlowHighlightContextValue | null>(null);

export function TutorialFlowHighlightProvider({
  value,
  children,
}: {
  value: TutorialFlowHighlightContextValue;
  children: ReactNode;
}) {
  return (
    <TutorialFlowHighlightContext.Provider value={value}>
      {children}
    </TutorialFlowHighlightContext.Provider>
  );
}

export function useTutorialFlowHighlight() {
  return useContext(TutorialFlowHighlightContext);
}