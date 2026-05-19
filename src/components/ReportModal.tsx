"use client";
import { useState } from "react";

const REASONS = [
  "Harassment or threatening behavior",
  "Stalking or following me",
  "Impersonation or fake profile",
  "Spam or commercial abuse",
  "Inappropriate content",
  "Underage user",
  "Other",
];

interface Props {
  reportedId: string;
  reportedName?: string;
  onClose: () => void;
}

export function ReportModal({ reportedId, reportedName, onClose }: Props) {
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function submit() {
    if (!reason) return;
    setSubmitting(true);
    await fetch("/api/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reportedId, reason, details }),
    });
    setSubmitting(false);
    setDone(true);
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-red-600 px-6 py-4 flex items-center justify-between">
          <h2 className="font-bold text-white">Report User</h2>
          <button onClick={onClose} className="text-red-200 hover:text-white text-xl leading-none">×</button>
        </div>

        {done ? (
          <div className="p-8 text-center">
            <p className="text-4xl mb-3">✅</p>
            <p className="font-bold text-gray-900 mb-2">Report submitted</p>
            <p className="text-sm text-gray-500 mb-6">
              Thank you. We take all reports seriously and will review this account.
              If you are in immediate danger, please call 911.
            </p>
            <button onClick={onClose}
              className="bg-gray-100 text-gray-700 px-6 py-2 rounded-xl font-semibold hover:bg-gray-200 transition">
              Close
            </button>
          </div>
        ) : (
          <div className="p-6 space-y-4">
            <p className="text-sm text-gray-600">
              Reporting <strong>{reportedName || "this user"}</strong>. Select the reason below.
            </p>

            <div className="space-y-2">
              {REASONS.map((r) => (
                <label key={r} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition text-sm ${
                  reason === r ? "border-red-400 bg-red-50 text-red-900" : "border-gray-200 hover:border-gray-300 text-gray-700"
                }`}>
                  <input type="radio" name="reason" value={r} checked={reason === r}
                    onChange={() => setReason(r)} className="accent-red-600" />
                  {r}
                </label>
              ))}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Additional details <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea rows={3} value={details} onChange={(e) => setDetails(e.target.value)}
                placeholder="Describe what happened…"
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none" />
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
              If you are in immediate danger or being stalked, please contact law enforcement (911) immediately.
              Do not wait for SpotId to respond.
            </div>

            <div className="flex gap-2">
              <button onClick={submit} disabled={!reason || submitting}
                className="flex-1 bg-red-600 text-white py-2.5 rounded-xl font-semibold hover:bg-red-700 disabled:opacity-40 transition text-sm">
                {submitting ? "Submitting…" : "Submit Report"}
              </button>
              <button onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 transition text-sm font-semibold">
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
