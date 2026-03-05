import { useState, useMemo } from "react";
import SwipeFeed from "./pages/SwipeFeed";
import SavesPage from "./pages/SavesPage";
import ProfilePage from "./pages/ProfilePage";
import BottomNav, { TabType } from "./components/BottomNav";

// TODO: Replace with D1/Workers API calls
const listings: any[] = [];

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

  // Count saved listings for badge
  const savesCount = useMemo(() => {
    return listings.filter((l) => l.status === "interested").length;
  }, []);

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
