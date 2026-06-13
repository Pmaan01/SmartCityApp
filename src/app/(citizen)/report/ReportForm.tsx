"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

const LocationPicker = dynamic(() => import("@/components/map/LocationPicker"), { ssr: false });

const CATEGORIES = [
  { value: "POTHOLE", label: "Pothole", icon: "🕳️" },
  { value: "STREETLIGHT", label: "Streetlight", icon: "💡" },
  { value: "GRAFFITI", label: "Graffiti", icon: "🎨" },
  { value: "GARBAGE", label: "Garbage", icon: "🗑️" },
  { value: "FLOODING", label: "Flooding", icon: "🌊" },
  { value: "TRAFFIC_SIGNAL", label: "Traffic Signal", icon: "🚦" },
  { value: "SIDEWALK", label: "Sidewalk", icon: "🚶" },
  { value: "PARK", label: "Park", icon: "🌳" },
  { value: "NOISE", label: "Noise", icon: "📢" },
  { value: "OTHER", label: "Other", icon: "❓" },
];

export default function ReportForm() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    lat: 0,
    lng: 0,
    address: "",
    photoUrl: "",
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleLocation = useCallback((lat: number, lng: number, address: string) => {
    setForm((f) => ({ ...f, lat, lng, address }));
  }, []);

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const uploadPhoto = async (): Promise<string> => {
    if (!photoFile) return "";
    const fd = new FormData();
    fd.append("file", photoFile);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    return data.url ?? "";
  };

  const handleSubmit = async () => {
    if (!form.title || !form.description || !form.lat) {
      setError("Please complete all steps before submitting.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const photoUrl = await uploadPhoto();
      const res = await fetch("/api/issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, photoUrl, category: form.category || undefined }),
      });
      if (!res.ok) throw new Error("Failed to submit");
      router.push("/dashboard?submitted=1");
    } catch {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Report a City Issue</h1>
      <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">
        AI will automatically categorize and prioritize your report.
      </p>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
              step === s ? "bg-indigo-600 text-white" :
              step > s ? "bg-green-500 text-white" :
              "bg-gray-200 dark:bg-gray-700 text-gray-500"
            }`}>
              {step > s ? "✓" : s}
            </div>
            <span className={`text-sm font-medium ${step === s ? "text-indigo-600" : "text-gray-400"}`}>
              {s === 1 ? "Details" : s === 2 ? "Location" : "Photo"}
            </span>
            {s < 3 && <div className="w-12 h-px bg-gray-200 dark:bg-gray-700 mx-1" />}
          </div>
        ))}
      </div>

      {/* Step 1 — Details */}
      {step === 1 && (
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Issue title</label>
            <input
              className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g. Large pothole on Main St near the library"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Description</label>
            <textarea
              rows={4}
              className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              placeholder="Describe the issue in detail — when did you notice it, how severe is it, any safety risk?"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
            <p className="text-xs text-gray-400 mt-1">AI will auto-detect the category from your description.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category (optional — AI will detect)</label>
            <div className="grid grid-cols-5 gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, category: f.category === c.value ? "" : c.value }))}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl border text-xs transition-all ${
                    form.category === c.value
                      ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950 text-indigo-600"
                      : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300"
                  }`}
                >
                  <span className="text-xl">{c.icon}</span>
                  <span>{c.label}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            disabled={!form.title || !form.description}
            onClick={() => setStep(2)}
            className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            Next: Pin location →
          </button>
        </div>
      )}

      {/* Step 2 — Location */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="w-full h-80 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
            <LocationPicker onSelect={handleLocation} />
          </div>

          {form.address && (
            <div className="bg-indigo-50 dark:bg-indigo-950 border border-indigo-200 dark:border-indigo-800 rounded-xl px-4 py-3 text-sm text-indigo-700 dark:text-indigo-300">
              📍 {form.address}
            </div>
          )}

          <div className="flex gap-3">
            <button type="button" onClick={() => setStep(1)} className="flex-1 py-3 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
              ← Back
            </button>
            <button
              type="button"
              disabled={!form.lat}
              onClick={() => setStep(3)}
              className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              Next: Add photo →
            </button>
          </div>
        </div>
      )}

      {/* Step 3 — Photo */}
      {step === 3 && (
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Photo (optional but recommended)</label>
            <label className="flex flex-col items-center justify-center w-full h-52 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl cursor-pointer hover:border-indigo-400 transition overflow-hidden relative">
              {photoPreview ? (
                <img src={photoPreview} alt="preview" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center">
                  <div className="text-4xl mb-2">📷</div>
                  <p className="text-sm text-gray-500">Click to upload a photo</p>
                  <p className="text-xs text-gray-400 mt-1">JPG, PNG or WEBP · max 10MB</p>
                </div>
              )}
              <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
            </label>
            {photoPreview && (
              <button type="button" onClick={() => { setPhotoFile(null); setPhotoPreview(""); }} className="text-xs text-red-500 mt-1 hover:underline">
                Remove photo
              </button>
            )}
          </div>

          {/* Summary card */}
          <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-2 text-sm">
            <p className="font-medium text-gray-900 dark:text-white">{form.title}</p>
            <p className="text-gray-500 dark:text-gray-400 line-clamp-2">{form.description}</p>
            {form.address && <p className="text-gray-400 text-xs">📍 {form.address}</p>}
            <p className="text-xs text-indigo-500">Gemini will auto-categorize on submission</p>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="flex gap-3">
            <button type="button" onClick={() => setStep(2)} className="flex-1 py-3 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
              ← Back
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={handleSubmit}
              className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-60 transition"
            >
              {submitting ? "Submitting…" : "Submit Report"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
