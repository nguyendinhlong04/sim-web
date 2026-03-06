"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type SiteConfigForm = {
  companyName: string;
  companyDesc: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  logoUrl: string;
  gcsProjectId: string;
  gcsBucketName: string;
  gcsClientEmail: string;
  gcsPrivateKey: string;
};

const empty: SiteConfigForm = {
  companyName: "",
  companyDesc: "",
  companyAddress: "",
  companyPhone: "",
  companyEmail: "",
  logoUrl: "",
  gcsProjectId: "",
  gcsBucketName: "",
  gcsClientEmail: "",
  gcsPrivateKey: "",
};

export default function AdminSettingsPage() {
  const router = useRouter();
  const [form, setForm] = useState<SiteConfigForm>(empty);
  const [status, setStatus] = useState<"idle" | "loading" | "saving" | "saved" | "error">("loading");
  const [uploadStatus, setUploadStatus] = useState("");

  // Load current config on mount
  useEffect(() => {
    fetch("/api/admin/settings")
      .then((res) => {
        if (res.status === 401) {
          router.push("/admin/login");
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (!data) return;
        setForm({
          companyName: data.companyName ?? "",
          companyDesc: data.companyDesc ?? "",
          companyAddress: data.companyAddress ?? "",
          companyPhone: data.companyPhone ?? "",
          companyEmail: data.companyEmail ?? "",
          logoUrl: data.logoUrl ?? "",
          gcsProjectId: data.gcsProjectId ?? "",
          gcsBucketName: data.gcsBucketName ?? "",
          gcsClientEmail: data.gcsClientEmail ?? "",
          gcsPrivateKey: data.gcsPrivateKey ?? "",
        });
        setStatus("idle");
      })
      .catch((err) => {
        setStatus("error");
      });
  }, []);

  const handleChange = (field: keyof SiteConfigForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("saving");

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.status === 401) {
        router.push("/admin/login");
        return;
      }
      if (!res.ok) throw new Error("Save failed");

      const data = await res.json();
      setForm((prev) => ({
        ...prev,
        gcsPrivateKey: data.gcsPrivateKey ?? "",
      }));
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 2000);
    } catch {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  };

  const handleLogoUpload = async (file: File) => {
    setUploadStatus("Uploading...");
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        setUploadStatus("Upload failed");
        return;
      }

      const data = await res.json();
      if (data.url) {
        handleChange("logoUrl", data.url);
        setUploadStatus("Uploaded successfully");
      } else {
        setUploadStatus("Upload failed");
      }
    } catch {
      setUploadStatus("Upload failed");
    }

    setTimeout(() => setUploadStatus(""), 3000);
  };

  if (status === "loading") {
    return (
      <section className="space-y-4">
        <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500">Loading configuration...</p>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
        {status === "saved" && (
          <span className="rounded-md bg-green-50 px-3 py-1 text-sm font-medium text-green-700">
            Saved successfully
          </span>
        )}
        {status === "error" && (
          <span className="rounded-md bg-red-50 px-3 py-1 text-sm font-medium text-red-700">
            An error occurred
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Company Information */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Company Information
          </h2>
          <div className="grid gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Company Name
              </label>
              <input
                type="text"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={form.companyName}
                onChange={(e) => handleChange("companyName", e.target.value)}
                placeholder="Enter company name"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                className="min-h-[80px] w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={form.companyDesc}
                onChange={(e) => handleChange("companyDesc", e.target.value)}
                placeholder="Brief company description"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Address
              </label>
              <textarea
                className="min-h-[60px] w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={form.companyAddress}
                onChange={(e) => handleChange("companyAddress", e.target.value)}
                placeholder="Company address"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Phone
                </label>
                <input
                  type="text"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={form.companyPhone}
                  onChange={(e) => handleChange("companyPhone", e.target.value)}
                  placeholder="+84 xxx xxx xxx"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={form.companyEmail}
                  onChange={(e) => handleChange("companyEmail", e.target.value)}
                  placeholder="contact@company.com"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Logo */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Logo</h2>
          <div className="space-y-4">
            {form.logoUrl && (
              <div className="flex items-start gap-4">
                <div className="overflow-hidden rounded-md border border-gray-200 bg-gray-50 p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={form.logoUrl}
                    alt="Company logo"
                    className="h-16 w-auto object-contain"
                  />
                </div>
                <button
                  type="button"
                  className="rounded-md border border-red-200 px-3 py-1 text-sm text-red-600 hover:bg-red-50"
                  onClick={() => handleChange("logoUrl", "")}
                >
                  Remove
                </button>
              </div>
            )}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Upload Logo
              </label>
              <input
                type="file"
                accept="image/*"
                className="text-sm text-gray-500 file:mr-4 file:rounded-md file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-blue-600 hover:file:bg-blue-100"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleLogoUpload(file);
                }}
              />
              {uploadStatus && (
                <p className="mt-1 text-sm text-gray-500">{uploadStatus}</p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Or enter logo URL directly
              </label>
              <input
                type="text"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={form.logoUrl}
                onChange={(e) => handleChange("logoUrl", e.target.value)}
                placeholder="https://storage.googleapis.com/..."
              />
            </div>
          </div>
        </div>

        {/* Section 3: Storage Configuration */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Storage Configuration (Google Cloud Storage)
          </h2>
          <div className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Project ID
                </label>
                <input
                  type="text"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={form.gcsProjectId}
                  onChange={(e) => handleChange("gcsProjectId", e.target.value)}
                  placeholder="my-gcp-project"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Bucket Name
                </label>
                <input
                  type="text"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={form.gcsBucketName}
                  onChange={(e) => handleChange("gcsBucketName", e.target.value)}
                  placeholder="my-bucket"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Service Account Email
              </label>
              <input
                type="text"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={form.gcsClientEmail}
                onChange={(e) => handleChange("gcsClientEmail", e.target.value)}
                placeholder="sa@project.iam.gserviceaccount.com"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Service Account Key (JSON)
              </label>
              <textarea
                className="min-h-[120px] w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={form.gcsPrivateKey}
                onChange={(e) => handleChange("gcsPrivateKey", e.target.value)}
                placeholder={
                  form.gcsPrivateKey === "****"
                    ? "Key is set. Paste new JSON to replace."
                    : '{"type": "service_account", "project_id": "...", ...}'
                }
                onFocus={(e) => {
                  if (e.target.value === "****") {
                    handleChange("gcsPrivateKey", "");
                  }
                }}
              />
              {form.gcsPrivateKey === "****" && (
                <p className="mt-1 text-xs text-gray-400">
                  A key is already configured. Leave as-is to keep current key,
                  or clear and paste a new JSON key to replace it.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={status === "saving"}
            className="rounded-md bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {status === "saving" ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </form>
    </section>
  );
}
