import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import SwipeFeed from "./pages/SwipeFeed";
import SavesPage from "./pages/SavesPage";
import ProfilePage from "./pages/ProfilePage";
import BottomNav, { TabType } from "./components/BottomNav";
import type { Listing } from "./types/listing";

export default function App() {
  // Tab state - persist in localStorage
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    const saved = localStorage.getItem("se-active-tab");
    return (saved === "profile" || saved === "home" || saved === "saves") ? saved : "home";
  });

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    localStorage.setItem("se-active-tab", tab);
  };

  // Real-time listing count for badge (only saved/interested)
  const savedListings = useQuery(api.listings.list, { status: "interested" }) as Listing[] | undefined;
  const savesCount = useMemo(() => savedListings?.length ?? 0, [savedListings]);

  // Render active page
  const renderPage = () => {
    switch (activeTab) {
      case "profile":
        return <ProfilePage />;
      case "saves":
        return <SavesPage />;
      case "home":
      default:
        return <SwipeFeed />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {renderPage()}
      <BottomNav
        activeTab={activeTab}
        onChange={handleTabChange}
        savesCount={savesCount}
      />
    </div>
  );
}
