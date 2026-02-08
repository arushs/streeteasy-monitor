"use client";

import { useState } from "react";
import { formatDistanceToNow } from "@/lib/utils";

type ResponseStatus = "pending" | "responded" | "no_reply";

interface ContactedListing {
  id: string;
  address: string;
  unit?: string;
  price: number;
  bedrooms: number;
  neighborhood: string;
  contactedAt: Date;
  responseStatus: ResponseStatus;
  responseAt?: Date;
  brokerName?: string;
}

// Mock contact history
const mockContacts: ContactedListing[] = [
  {
    id: "c1",
    address: "123 E 4th St",
    unit: "#2B",
    price: 2800,
    bedrooms: 2,
    neighborhood: "East Village",
    contactedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
    responseStatus: "responded",
    responseAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    brokerName: "Jane Smith",
  },
  {
    id: "c2",
    address: "456 W 23rd St",
    unit: "#5F",
    price: 3200,
    bedrooms: 1,
    neighborhood: "Chelsea",
    contactedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    responseStatus: "pending",
    brokerName: "Michael Chen",
  },
  {
    id: "c3",
    address: "789 Bedford Ave",
    unit: "#3R",
    price: 2650,
    bedrooms: 1,
    neighborhood: "Williamsburg",
    contactedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    responseStatus: "pending",
  },
  {
    id: "c4",
    address: "321 Mott St",
    unit: "#6A",
    price: 2400,
    bedrooms: 0,
    neighborhood: "NoLita",
    contactedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    responseStatus: "no_reply",
  },
  {
    id: "c5",
    address: "555 Grand St",
    unit: "#2C",
    price: 3800,
    bedrooms: 2,
    neighborhood: "Lower East Side",
    contactedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    responseStatus: "responded",
    responseAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    brokerName: "Sarah Johnson",
  },
];

const STATUS_CONFIG = {
  pending: {
    label: "Awaiting",
    icon: "⏳",
    color: "text-amber-600 bg-amber-50",
  },
  responded: {
    label: "Responded",
    icon: "✅",
    color: "text-green-600 bg-green-50",
  },
  no_reply: {
    label: "No Reply",
    icon: "❌",
    color: "text-gray-500 bg-gray-100",
  },
};

export default function SentPage() {
  const [contacts] = useState<ContactedListing[]>(mockContacts);
  const [filter, setFilter] = useState<ResponseStatus | "all">("all");

  const filteredContacts =
    filter === "all"
      ? contacts
      : contacts.filter((c) => c.responseStatus === filter);

  const stats = {
    total: contacts.length,
    responded: contacts.filter((c) => c.responseStatus === "responded").length,
    pending: contacts.filter((c) => c.responseStatus === "pending").length,
  };

  const responseRate =
    stats.total > 0 ? Math.round((stats.responded / stats.total) * 100) : 0;

  return (
    <div className="max-w-5xl mx-auto pb-20 lg:pb-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contact History</h1>
          <p className="text-gray-600 mt-1">
            Track your sent contacts and responses.
          </p>
        </div>
        <button className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
          Export CSV
        </button>
      </div>

      {/* Stats bar */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 mb-6 border border-indigo-100">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">
            <strong className="text-gray-900">{stats.total}</strong> contacts
            sent
          </span>
          <span className="text-gray-600">
            Response rate:{" "}
            <strong
              className={responseRate >= 20 ? "text-green-600" : "text-gray-900"}
            >
              {responseRate}%
            </strong>{" "}
            ({stats.responded}/{stats.total})
          </span>
          <span className="text-gray-600">
            <strong className="text-amber-600">{stats.pending}</strong> awaiting
          </span>
        </div>
      </div>

      {contacts.length > 0 ? (
        <>
          {/* Filter tabs */}
          <div className="flex items-center gap-2 mb-6">
            {(["all", "responded", "pending", "no_reply"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === f
                    ? "bg-indigo-100 text-indigo-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {f === "all"
                  ? "All"
                  : f === "responded"
                    ? "Responded"
                    : f === "pending"
                      ? "Awaiting"
                      : "No Reply"}
                {f !== "all" && (
                  <span className="ml-1 text-xs opacity-70">
                    ({contacts.filter((c) => c.responseStatus === f).length})
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Contact list */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {/* Header row */}
            <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-500 uppercase tracking-wider">
              <div className="col-span-5">Listing</div>
              <div className="col-span-2">Contacted</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-3">Actions</div>
            </div>

            {/* Contact rows */}
            {filteredContacts.map((contact, index) => {
              const status = STATUS_CONFIG[contact.responseStatus];
              return (
                <div
                  key={contact.id}
                  className={`grid grid-cols-12 gap-4 px-4 py-4 items-center ${
                    index !== filteredContacts.length - 1
                      ? "border-b border-gray-100"
                      : ""
                  } hover:bg-gray-50 transition-colors`}
                >
                  {/* Listing info */}
                  <div className="col-span-5">
                    <div className="font-medium text-gray-900">
                      {contact.address}
                      {contact.unit && (
                        <span className="text-gray-500">, {contact.unit}</span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      ${contact.price.toLocaleString()} • {contact.bedrooms} bed
                      {contact.bedrooms !== 1 ? "s" : ""} •{" "}
                      {contact.neighborhood}
                    </div>
                    {contact.brokerName && (
                      <div className="text-xs text-gray-400 mt-0.5">
                        {contact.brokerName}
                      </div>
                    )}
                  </div>

                  {/* Contacted date */}
                  <div className="col-span-2 text-sm text-gray-600">
                    {formatDistanceToNow(contact.contactedAt)}
                  </div>

                  {/* Status badge */}
                  <div className="col-span-2">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${status.color}`}
                    >
                      <span>{status.icon}</span>
                      <span>{status.label}</span>
                    </span>
                    {contact.responseAt && (
                      <div className="text-xs text-gray-400 mt-1">
                        {formatDistanceToNow(contact.responseAt)}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="col-span-3 flex items-center gap-2">
                    {contact.responseStatus === "responded" && (
                      <button className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                        View Thread
                      </button>
                    )}
                    {contact.responseStatus === "pending" && (
                      <button className="text-sm text-gray-600 hover:text-gray-700 font-medium">
                        Resend
                      </button>
                    )}
                    {contact.responseStatus === "no_reply" && (
                      <button className="text-sm text-gray-500 hover:text-gray-600 font-medium">
                        Mark Closed
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* No results in filter */}
          {filteredContacts.length === 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <p className="text-gray-500">
                No contacts match this filter.
              </p>
            </div>
          )}
        </>
      ) : (
        /* Empty State */
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <div className="text-4xl mb-4">📨</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No contacts sent yet
          </h3>
          <p className="text-gray-600 mb-6">
            Contact a listing from your feed to start tracking responses.
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
