"use client";

import { useState, useEffect, useCallback } from "react";
import type { Listing } from "@/types/listing";

interface ContactModalProps {
  listing: Listing;
  isOpen: boolean;
  onClose: () => void;
  onSend: (message: string, subject: string) => void;
  templates?: { id: string; name: string; subject: string; body: string }[];
  defaultTemplate?: { subject: string; body: string };
  userInfo?: {
    name: string;
    phone: string;
    moveInDate: string;
    leaseTerm: number;
  };
}

export function ContactModal({
  listing,
  isOpen,
  onClose,
  onSend,
  templates = [],
  defaultTemplate,
  userInfo = {
    name: "Arush Shankar",
    phone: "(555) 123-4567",
    moveInDate: "ASAP",
    leaseTerm: 12,
  },
}: ContactModalProps) {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("default");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [personalNote, setPersonalNote] = useState("");
  const [showNote, setShowNote] = useState(false);
  const [isPreview, setIsPreview] = useState(true);
  const [isSending, setIsSending] = useState(false);

  // Generate default message
  const generateMessage = useCallback(
    (template?: { subject: string; body: string }) => {
      const baseSubject =
        template?.subject ||
        `Inquiry: ${listing.address}${listing.unit ? ` ${listing.unit}` : ""} - ${listing.bedrooms}BR`;

      const baseBody =
        template?.body ||
        `Hi,

I'm interested in the ${listing.bedrooms}-bedroom apartment at ${listing.address}${listing.unit ? ` ${listing.unit}` : ""} listed for $${listing.price.toLocaleString()}/month.

About me:
• ${userInfo.name}, working professional
• Looking to move ${userInfo.moveInDate}
• Interested in a ${userInfo.leaseTerm}-month lease
• Credit score: Excellent (750+)

I'd love to schedule a viewing at your earliest convenience.

Best,
${userInfo.name}
${userInfo.phone}`;

      return { subject: baseSubject, body: baseBody };
    },
    [listing, userInfo]
  );

  // Initialize with default template
  useEffect(() => {
    if (isOpen) {
      const { subject: s, body: b } = generateMessage(defaultTemplate);
      setSubject(s);
      setMessage(b);
      setPersonalNote("");
      setShowNote(false);
      setIsPreview(true);
    }
  }, [isOpen, listing.id, defaultTemplate, generateMessage]);

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplateId(templateId);
    if (templateId === "default") {
      const { subject: s, body: b } = generateMessage(defaultTemplate);
      setSubject(s);
      setMessage(b);
    } else {
      const template = templates.find((t) => t.id === templateId);
      if (template) {
        const { subject: s, body: b } = generateMessage({
          subject: template.subject,
          body: template.body,
        });
        setSubject(s);
        setMessage(b);
      }
    }
  };

  const handleSend = async () => {
    setIsSending(true);
    const finalMessage = showNote && personalNote
      ? `${message}\n\nP.S. ${personalNote}`
      : message;
    
    try {
      await onSend(finalMessage, subject);
      onClose();
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">
              📧 Contact Listing
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Listing info */}
          <div className="p-4 bg-gray-50 border-b border-gray-100">
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

          {/* Content */}
          <div className="p-4 overflow-y-auto max-h-[50vh]">
            {/* Template selector */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Using template
              </label>
              <select
                value={selectedTemplateId}
                onChange={(e) => handleTemplateChange(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="default">Standard Inquiry</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Preview / Edit toggle */}
            <div className="flex items-center gap-2 mb-4">
              <button
                onClick={() => setIsPreview(true)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isPreview
                    ? "bg-indigo-100 text-indigo-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                Preview
              </button>
              <button
                onClick={() => setIsPreview(false)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  !isPreview
                    ? "bg-indigo-100 text-indigo-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                Edit
              </button>
            </div>

            {/* Message preview/edit */}
            {isPreview ? (
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="text-xs text-gray-500 mb-2">
                  Subject: <span className="text-gray-700">{subject}</span>
                </div>
                <div className="text-sm text-gray-700 whitespace-pre-wrap">
                  {message}
                  {showNote && personalNote && (
                    <div className="mt-2 text-indigo-600">
                      P.S. {personalNote}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Message
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={8}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                  />
                </div>
              </div>
            )}

            {/* Personal note toggle */}
            <div className="mt-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showNote}
                  onChange={(e) => setShowNote(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700">Add personal note</span>
              </label>
              {showNote && (
                <textarea
                  value={personalNote}
                  onChange={(e) => setPersonalNote(e.target.value)}
                  placeholder="e.g., I work from home and need a quiet space..."
                  rows={2}
                  className="w-full mt-2 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                />
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-100 bg-gray-50">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              Cancel
            </button>
            <button
              onClick={handleSend}
              disabled={isSending}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-5 py-2 rounded-lg font-medium text-sm transition-colors"
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
                  ✉️ Send Contact
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
