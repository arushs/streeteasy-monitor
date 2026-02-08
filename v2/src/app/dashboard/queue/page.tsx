"use client";

import { useState } from "react";
import { ContactQueueItem } from "@/components/ContactQueueItem";
import { DailyLimitProgress } from "@/components/DailyLimitProgress";
import type { Listing } from "@/types/listing";

// Mock data for queue items
const mockQueueItems = [
  {
    id: "q1",
    listing: {
      id: "1",
      address: "123 E 4th St",
      unit: "#2B",
      price: 2800,
      bedrooms: 2,
      bathrooms: 1,
      neighborhood: "East Village",
      noFee: true,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      status: "new" as const,
      imageUrl: null,
    } as Listing,
    subject: "Inquiry: 123 E 4th St - 2BR",
    message:
      "Hi, I'm interested in the 2-bedroom apartment at 123 E 4th St listed for $2,800/month. I'm a working professional looking to move ASAP with excellent credit (750+). I'd love to schedule a viewing at your earliest convenience. Best, Arush (555) 123-4567",
  },
  {
    id: "q2",
    listing: {
      id: "2",
      address: "456 W 23rd St",
      unit: "#5F",
      price: 3200,
      bedrooms: 1,
      bathrooms: 1,
      neighborhood: "Chelsea",
      noFee: false,
      createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
      status: "new" as const,
      imageUrl: null,
    } as Listing,
    subject: "Inquiry: 456 W 23rd St - 1BR",
    message:
      "Hi, I'm interested in the 1-bedroom apartment at 456 W 23rd St listed for $3,200/month. I'm a working professional looking to move ASAP with excellent credit (750+). I'd love to schedule a viewing at your earliest convenience. Best, Arush (555) 123-4567",
  },
  {
    id: "q3",
    listing: {
      id: "3",
      address: "789 Broadway",
      unit: "#4A",
      price: 4100,
      bedrooms: 2,
      bathrooms: 1,
      neighborhood: "NoHo",
      noFee: true,
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
      status: "new" as const,
      imageUrl: null,
    } as Listing,
    subject: "Inquiry: 789 Broadway - 2BR",
    message:
      "Hi, I'm interested in the 2-bedroom apartment at 789 Broadway listed for $4,100/month. I'm a working professional looking to move ASAP with excellent credit (750+). I'd love to schedule a viewing at your earliest convenience. Best, Arush (555) 123-4567",
    overBudget: true,
    overBudgetReason: "Exceeds max price ($3,500)",
  },
];

export default function QueuePage() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [queueItems, setQueueItems] = useState(mockQueueItems);
  const [isSending, setIsSending] = useState(false);

  const regularItems = queueItems.filter((item) => !item.overBudget);
  const overBudgetItems = queueItems.filter((item) => item.overBudget);

  const handleSelectChange = (id: string, selected: boolean) => {
    const newSelected = new Set(selectedIds);
    if (selected) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedIds(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === regularItems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(regularItems.map((item) => item.id)));
    }
  };

  const handleEditMessage = (id: string, message: string, subject: string) => {
    setQueueItems((items) =>
      items.map((item) =>
        item.id === id ? { ...item, message, subject } : item
      )
    );
  };

  const handleDismiss = (id: string) => {
    setQueueItems((items) => items.filter((item) => item.id !== id));
  };

  const handleSendSelected = async () => {
    setIsSending(true);
    // Simulate sending
    await new Promise((resolve) => setTimeout(resolve, 1500));
    // Remove sent items from queue
    setQueueItems((items) => items.filter((item) => !selectedIds.has(item.id)));
    setSelectedIds(new Set());
    setIsSending(false);
  };

  const hasItems = queueItems.length > 0;
  const hasSelectedItems = selectedIds.size > 0;

  return (
    <div className="max-w-5xl mx-auto pb-20 lg:pb-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contact Queue</h1>
          <p className="text-gray-600 mt-1">
            Review and approve contacts before they&apos;re sent.
          </p>
        </div>
        {regularItems.length > 0 && (
          <div className="flex items-center gap-3">
            <button
              onClick={handleSelectAll}
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              {selectedIds.size === regularItems.length
                ? "Deselect All"
                : "Select All"}
            </button>
            <button
              onClick={handleSendSelected}
              disabled={!hasSelectedItems || isSending}
              className={`
                inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors
                ${
                  hasSelectedItems && !isSending
                    ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                }
              `}
            >
              {isSending ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Sending...
                </>
              ) : (
                <>
                  Send Selected ({selectedIds.size})
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Daily limit progress */}
      <div className="mb-6">
        <DailyLimitProgress sent={3} limit={10} />
      </div>

      {/* Queue items */}
      {hasItems ? (
        <div className="space-y-6">
          {/* Regular items */}
          {regularItems.length > 0 && (
            <div className="space-y-4">
              {regularItems.map((item) => (
                <ContactQueueItem
                  key={item.id}
                  listing={item.listing}
                  message={item.message}
                  subject={item.subject}
                  isSelected={selectedIds.has(item.id)}
                  onSelectChange={(selected) =>
                    handleSelectChange(item.id, selected)
                  }
                  onEditMessage={(message, subject) =>
                    handleEditMessage(item.id, message, subject)
                  }
                  onDismiss={() => handleDismiss(item.id)}
                />
              ))}
            </div>
          )}

          {/* Over budget items */}
          {overBudgetItems.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Over Budget
              </h2>
              <div className="space-y-4">
                {overBudgetItems.map((item) => (
                  <ContactQueueItem
                    key={item.id}
                    listing={item.listing}
                    message={item.message}
                    subject={item.subject}
                    isSelected={selectedIds.has(item.id)}
                    onSelectChange={(selected) =>
                      handleSelectChange(item.id, selected)
                    }
                    onEditMessage={(message, subject) =>
                      handleEditMessage(item.id, message, subject)
                    }
                    onDismiss={() => handleDismiss(item.id)}
                    overBudget={item.overBudget}
                    overBudgetReason={item.overBudgetReason}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <div className="text-4xl mb-4">✉️</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No contacts pending
          </h3>
          <p className="text-gray-600 mb-6">
            When you have listings to contact, they&apos;ll appear here for review.
          </p>
          <a
            href="/dashboard"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-medium transition-colors"
          >
            View Listings →
          </a>
        </div>
      )}
    </div>
  );
}
