"use client";

import { useEffect, useState, useTransition } from "react";
import Image from "next/image";

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
        body: JSON.stringify({
          name,
          phone,
          notificationEmail: notifEmail,
          notificationSms: notifSms,
        }),
      });
      if (!res.ok) {
        setError("Failed to save. Please try again.");
        return;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    });
  };

  if (!profile) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">Profile & Settings</h1>

      {/* Avatar + identity (read-only from Google) */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 mb-5">
        <div className="flex items-center gap-4 mb-5">
          {profile.image ? (
            <Image
              src={profile.image}
              alt=""
              width={56}
              height={56}
              className="rounded-full ring-2 ring-indigo-100 dark:ring-indigo-900"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-xl font-bold">
              {profile.name?.[0]?.toUpperCase() ?? "?"}
            </div>
          )}
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">{profile.name}</p>
            <p className="text-sm text-gray-400">{profile.email}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Member since {new Date(profile.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Display name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Phone number
              <span className="ml-1.5 text-xs text-gray-400 font-normal">(for SMS alerts)</span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 555 000 0000"
              className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-xs text-gray-400 mt-1">Include country code, e.g. +1 for US</p>
          </div>
        </div>
      </div>

      {/* Notification preferences */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 mb-5">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Notifications</h2>
        <p className="text-xs text-gray-400 mb-5">Choose how you hear about updates to your reports.</p>

        <div className="space-y-4">
          <Toggle
            label="Email notifications"
            description={`Updates sent to ${profile.email}`}
            icon="✉️"
            enabled={notifEmail}
            onChange={setNotifEmail}
          />
          <Toggle
            label="SMS notifications"
            description={phone ? `Texts sent to ${phone}` : "Add a phone number above to enable"}
            icon="📱"
            enabled={notifSms}
            onChange={setNotifSms}
            disabled={!phone.trim()}
          />
        </div>
      </div>

      {/* Save */}
      <div className="flex items-center justify-between">
        {error && <p className="text-sm text-red-500">{error}</p>}
        {saved && (
          <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Saved
          </p>
        )}
        {!error && !saved && <span />}
        <button
          onClick={save}
          disabled={isPending}
          className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? "Saving…" : "Save changes"}
        </button>
      </div>
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
  icon: string;
  enabled: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className={`flex items-center justify-between gap-4 ${disabled ? "opacity-50" : "cursor-pointer"}`}>
      <div className="flex items-start gap-3">
        <span className="text-lg mt-0.5">{icon}</span>
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
        className={`relative flex-shrink-0 w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
          enabled ? "bg-indigo-600" : "bg-gray-200 dark:bg-gray-700"
        }`}
      >
        <span
          className={`inline-block w-4 h-4 bg-white rounded-full shadow transform transition-transform duration-200 absolute top-1 ${
            enabled ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </label>
  );
}
