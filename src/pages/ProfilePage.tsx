import { useState } from "react";
import { motion } from "framer-motion";

interface PreferenceSection {
  id: string;
  icon: string;
  title: string;
  value: string;
}

export function ProfilePage() {
  const [preferences] = useState<PreferenceSection[]>([
    { id: "budget", icon: "💰", title: "Budget", value: "Up to $4,000/mo" },
    { id: "bedrooms", icon: "🛏️", title: "Bedrooms", value: "1-2 BR" },
    { id: "areas", icon: "📍", title: "Areas", value: "Brooklyn, Manhattan" },
    { id: "commute", icon: "🚇", title: "Max Commute", value: "30 min to SoHo" },
  ]);

  return (
    <div className="min-h-screen bg-gray-50 pt-16 pb-24">
      {/* Header */}
      <header className="fixed left-0 right-0 top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-gray-200/50">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">👤</span>
            <h1 className="text-lg font-bold text-gray-900">Profile</h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="px-4 pt-6 space-y-6">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-rose-400 to-pink-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-rose-200/50">
              A
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Apartment Hunter</h2>
              <p className="text-sm text-gray-500">Looking in NYC</p>
            </div>
          </div>
          
          <div className="flex gap-6 pt-4 border-t border-gray-100">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">47</p>
              <p className="text-xs text-gray-500">Swiped</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-rose-500">12</p>
              <p className="text-xs text-gray-500">Saved</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-500">3</p>
              <p className="text-xs text-gray-500">Contacted</p>
            </div>
          </div>
        </motion.div>

        {/* Preferences */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
        >
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Search Preferences</h3>
          </div>
          
          <div className="divide-y divide-gray-100">
            {preferences.map((pref) => (
              <button
                key={pref.id}
                className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{pref.icon}</span>
                  <span className="font-medium text-gray-700">{pref.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">{pref.value}</span>
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Settings Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
        >
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Settings</h3>
          </div>
          
          <div className="divide-y divide-gray-100">
            <button className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <span className="text-xl">🔔</span>
                <span className="font-medium text-gray-700">Notifications</span>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            
            <button className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <span className="text-xl">📊</span>
                <span className="font-medium text-gray-700">Kanban View</span>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            
            <button className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <span className="text-xl">❓</span>
                <span className="font-medium text-gray-700">Help & Support</span>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </motion.div>

        {/* Coming Soon Notice */}
        <div className="text-center py-4">
          <p className="text-xs text-gray-400">
            More features coming soon! 🚀
          </p>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
