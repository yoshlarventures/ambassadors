"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface LearningControls {
  iframeUrl: string | null;
  isLoading: boolean;
  isFullscreen: boolean;
  onRefresh: () => void;
  onToggleFullscreen: () => void;
  onUnlink: () => void;
  onOpenNewTab: () => void;
}

interface LearningControlsContextType {
  controls: LearningControls | null;
  setControls: (controls: LearningControls | null) => void;
}

const LearningControlsContext = createContext<LearningControlsContextType | undefined>(undefined);

export function LearningControlsProvider({ children }: { children: ReactNode }) {
  const [controls, setControls] = useState<LearningControls | null>(null);

  return (
    <LearningControlsContext.Provider value={{ controls, setControls }}>
      {children}
    </LearningControlsContext.Provider>
  );
}

export function useLearningControls() {
  const context = useContext(LearningControlsContext);
  if (context === undefined) {
    throw new Error("useLearningControls must be used within a LearningControlsProvider");
  }
  return context;
}
