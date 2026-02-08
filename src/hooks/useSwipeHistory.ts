import { useState, useCallback } from "react";
import type { Listing, SwipeAction, SwipeDirection } from "../types/listing";
import { undoHaptic } from "../utils/haptics";

const MAX_HISTORY = 10;

export function useSwipeHistory() {
  const [history, setHistory] = useState<SwipeAction[]>([]);

  const addToHistory = useCallback((listing: Listing, direction: SwipeDirection) => {
    setHistory((prev) => {
      const action: SwipeAction = {
        listing,
        direction,
        timestamp: Date.now(),
      };
      // Keep only the last MAX_HISTORY actions
      return [action, ...prev].slice(0, MAX_HISTORY);
    });
  }, []);

  const undo = useCallback((): SwipeAction | null => {
    if (history.length === 0) return null;
    
    const [lastAction, ...rest] = history;
    setHistory(rest);
    undoHaptic();
    return lastAction;
  }, [history]);

  const canUndo = history.length > 0;
  const lastAction = history[0] || null;

  return {
    history,
    addToHistory,
    undo,
    canUndo,
    lastAction,
  };
}
