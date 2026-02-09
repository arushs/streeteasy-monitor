import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import SwipeFeed from "./pages/SwipeFeed";
import SavesPage from "./pages/SavesPage";
import ProfilePage from "./pages/ProfilePage";
import BottomNav, { TabType } from "./components/BottomNav";

export default function App() {
  // Get listings to count saves
  const listings = useQuery(api.admin.getAllListings);
  
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
    if (!listings) return 0;
    return listings.filter((l) => l.status === "interested").length;
  }, [listings]);

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
      {/* Active Page */}
      {renderPage()}
      
      {/* Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        onChange={handleTabChange}
        savesCount={savesCount}
      />
    </div>
  );
}
/* deployed Mon Feb  9 17:12:00 EST 2026 */
