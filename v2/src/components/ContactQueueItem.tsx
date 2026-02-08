"use client";

import { useState } from "react";
import type { Listing } from "@/types/listing";

interface ContactQueueItemProps {
  listing: Listing;
  message: string;
  subject: string;
  isSelected: boolean;
  onSelectChange: (selected: boolean) => void;
  onEditMessage: (message: string, subject: string) => void;
  onDismiss: () => void;
  overBudget?: boolean;
  overBudgetReason?: string;
}

export function ContactQueueItem({
  listing,
  message,
  subject,
  isSelected,
  onSelectChange,
  onEditMessage,
  onDismiss,
  overBudget = false,
  overBudgetReason,
}: ContactQueueItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedMessage, setEditedMessage] = useState(message);
  const [editedSubject, setEditedSubject] = useState(subject);

  const handleSaveEdit = () => {
    onEditMessage(editedMessage, editedSubject);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditedMessage(message);
    setEditedSubject(subject);
    setIsEditing(false);
  };

  return (
    <div
      className={`
        bg-white rounded-xl border p-4 transition-all
        ${overBudget ? "border-amber-200 bg-amber-50/50" : "border-gray-200"}
        ${isSelected && !overBudget ? "ring-2 ring-indigo-200 border-indigo-300" : ""}
      `}
    >
      <div className="flex items-start gap-4">
        {/* Checkbox */}
        {!overBudget && (
          <div className="pt-1">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => onSelectChange(e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
          </div>
        )}

        {/* Over budget warning icon */}
        {overBudget && (
          <div className="pt-1">
            <span className="text-xl">⚠️</span>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Listing info header */}
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <h3 className="font-semibold text-gray-900">
                {listing.address}
                {listing.unit && <span className="text-gray-500">, {listing.unit}</span>}
              </h3>
              <p className="text-sm text-gray-600">
                ${listing.price.toLocaleString()}/mo • {listing.bedrooms} bed
                {listing.bedrooms !== 1 ? "s" : ""} • {listing.neighborhood}
                {listing.noFee && (
                  <span className="text-green-600 font-medium"> • No Fee</span>
                )}
              </p>
            </div>
            {listing.imageUrl && (
              <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={listing.imageUrl}
                  alt={listing.address}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>

          {/* Over budget message */}
          {overBudget && (
            <div className="bg-amber-100 text-amber-800 text-sm px-3 py-2 rounded-lg mb-3">
              {overBudgetReason || "This listing exceeds your maximum price filter"}
            </div>
          )}

          {/* Message preview */}
          {!isEditing && (
            <div className="bg-gray-50 rounded-lg p-3 mb-3">
              <div className="text-xs text-gray-500 mb-1">Subject: {subject}</div>
              <p className="text-sm text-gray-700 line-clamp-2">{message}</p>
            </div>
          )}

          {/* Message editor */}
          {isEditing && (
            <div className="space-y-3 mb-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  value={editedSubject}
                  onChange={(e) => setEditedSubject(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Message
                </label>
                <textarea
                  value={editedMessage}
                  onChange={(e) => setEditedMessage(e.target.value)}
                  rows={4}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2">
            {!isEditing && !overBudget && (
              <button
                onClick={() => setIsEditing(true)}
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Edit Message
              </button>
            )}
            {isEditing && (
              <>
                <button
                  onClick={handleSaveEdit}
                  className="text-sm bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg font-medium"
                >
                  Save
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="text-sm text-gray-600 hover:text-gray-700 font-medium"
                >
                  Cancel
                </button>
              </>
            )}
            {overBudget && (
              <>
                <button
                  onClick={() => onSelectChange(true)}
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  Send Anyway
                </button>
                <button
                  onClick={onDismiss}
                  className="text-sm text-gray-500 hover:text-gray-600 font-medium"
                >
                  Dismiss
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
