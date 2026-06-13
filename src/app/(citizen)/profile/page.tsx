"use client";

import { useEffect, useState, useTransition } from "react";

interface Profile {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  phone: string | null;
  notificationEmail: boolean;
  notificationSms: boolean;
  createdAt: string;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifSms, setNotifSms] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((data: Profile) => {
        setProfile(data);
        setName(data.name ?? "");
        setPhone(data.phone ?? "");
        setNotifEmail(data.notificationEmail);
        setNotifSms(data.notificationSms);
      });
  }, []);

  const save = () => {
    setSaved(false);
    setError("");
    startTransition(async () => {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, notificationEmail: notifEmail, notificationSms: notifSms }),
      });
      if (!res.ok) { setError("Failed to save. Please try again."); return; }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    });
  };

  if (!profile) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-7 h-7 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const initials = profile.name?.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) ?? "?";

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">

      {/* Hero card */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden mb-5">
        {/* Gradient banner */}
        <div className="h-24 bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-600 relative" />

        {/* Avatar + identity */}
        <div className="px-6 pb-6">
          <div className="flex items-end justify-between -mt-10 mb-4">
            <div className="relative">
              {profile.image ? (
                <img
                  src={profile.image}
                  alt=""
                  className="w-20 h-20 rounded-2xl ring-4 ring-white dark:ring-gray-900 shadow-lg object-cover"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl ring-4 ring-white dark:ring-gray-900 shadow-lg bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-2xl font-bold">
                  {initials}
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-2 border-white dark:border-gray-900" />
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-semibold border border-indigo-100 dark:border-indigo-900">
              Citizen
            </span>
          </div>

          <h2 className="text-lg font-bold text-gray-900 dark:text-white">{profile.name ?? "—"}</h2>
          <p className="text-sm text-gray-400">{profile.email}</p>
          <p className="text-xs text-gray-400 mt-1">
            Member since {new Date(profile.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </p>
        </div>
      </div>

      {/* Personal info */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 mb-5">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Personal info</h3>
        </div>

        <div className="space-y-4">
          <Field label="Display name">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-gray-700 transition"
            />
          </Field>

          <Field label="Email address" hint="Managed by Google — not editable here">
            <input
              type="email"
              value={profile.email ?? ""}
              disabled
              className="w-full text-sm border border-gray-100 dark:border-gray-800 rounded-xl px-3.5 py-2.5 bg-gray-100 dark:bg-gray-800/50 text-gray-400 cursor-not-allowed"
            />
          </Field>

          <Field label="Phone number" hint="Include country code · e.g. +1 555 000 0000">
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 555 000 0000"
                className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-xl pl-9 pr-3.5 py-2.5 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-gray-700 transition"
              />
            </div>
          </Field>
        </div>
      </div>

      {/* Notification preferences */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 mb-5">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Notifications</h3>
        </div>
        <p className="text-xs text-gray-400 mb-5 ml-9">Choose how you hear about status updates on your reports.</p>

        <div className="space-y-3">
          <Toggle
            label="Email notifications"
            description={`Sent to ${profile.email}`}
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            }
            enabled={notifEmail}
            onChange={setNotifEmail}
          />

          <div className="border-t border-gray-50 dark:border-gray-800" />

          <Toggle
            label="SMS notifications"
            description={phone.trim() ? `Texts sent to ${phone}` : "Add a phone number above to enable"}
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            }
            enabled={notifSms}
            onChange={setNotifSms}
            disabled={!phone.trim()}
          />
        </div>
      </div>

      {/* Save row */}
      <div className="flex items-center justify-between gap-4">
        <div className="text-sm">
          {error && (
            <p className="text-red-500 flex items-center gap-1.5">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </p>
          )}
          {saved && (
            <p className="text-green-600 dark:text-green-400 flex items-center gap-1.5">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Changes saved
            </p>
          )}
        </div>
        <button
          onClick={save}
          disabled={isPending}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          {isPending ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Saving…
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M5 13l4 4L19 7" />
              </svg>
              Save changes
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
        {hint && <span className="text-xs text-gray-400">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function Toggle({
  label,
  description,
  icon,
  enabled,
  onChange,
  disabled = false,
}: {
  label: string;
  description: string;
  icon: React.ReactNode;
  enabled: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between gap-4 py-1 ${disabled ? "opacity-50" : ""}`}>
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 dark:text-gray-400 flex-shrink-0">
          {icon}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{label}</p>
          <p className="text-xs text-gray-400 mt-0.5">{description}</p>
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        disabled={disabled}
        onClick={() => !disabled && onChange(!enabled)}
        className={`relative flex-shrink-0 w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 ${
          enabled ? "bg-indigo-600" : "bg-gray-200 dark:bg-gray-700"
        } ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
      >
        <span
          className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${
            enabled ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}
