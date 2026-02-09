import { motion } from "framer-motion";

export type TabType = "profile" | "home" | "saves";

interface BottomNavProps {
  activeTab: TabType;
  onChange: (tab: TabType) => void;
  savesCount?: number;
}

const tabs: { id: TabType; label: string; icon: JSX.Element }[] = [
  {
    id: "profile",
    label: "Profile",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    id: "home",
    label: "Discover",
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
      </svg>
    ),
  },
  {
    id: "saves",
    label: "Saves",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
  },
];

export function BottomNav({ activeTab, onChange, savesCount }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[100] bg-white/95 backdrop-blur-xl border-t border-gray-200/50 safe-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-6">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const isHome = tab.id === "home";
          
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`
                relative flex flex-col items-center justify-center
                ${isHome ? "w-16 -mt-4" : "w-14"}
                transition-all duration-200
              `}
            >
              {/* Home button has special styling */}
              {isHome ? (
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className={`
                    relative flex items-center justify-center w-14 h-14 rounded-full
                    ${isActive 
                      ? "bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-lg shadow-rose-300/50"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                    }
                    transition-all duration-200
                  `}
                >
                  {tab.icon}
                </motion.div>
              ) : (
                <>
                  <motion.div
                    whileTap={{ scale: 0.9 }}
                    className={`
                      relative flex items-center justify-center w-10 h-10 rounded-full
                      ${isActive ? "text-rose-500" : "text-gray-400 hover:text-gray-600"}
                      transition-colors duration-200
                    `}
                  >
                    {tab.icon}
                    
                    {/* Badge for saves count */}
                    {tab.id === "saves" && savesCount && savesCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-rose-500 rounded-full">
                        {savesCount > 99 ? "99+" : savesCount}
                      </span>
                    )}
                  </motion.div>
                  
                  {/* Label */}
                  <span className={`
                    text-[10px] font-medium mt-0.5
                    ${isActive ? "text-rose-500" : "text-gray-400"}
                    transition-colors duration-200
                  `}>
                    {tab.label}
                  </span>
                </>
              )}
              
              {/* Active indicator dot for home */}
              {isHome && isActive && (
                <motion.span
                  layoutId="homeIndicator"
                  className="absolute -bottom-1 w-1 h-1 bg-rose-500 rounded-full"
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export default BottomNav;
