"use client";

import { useState } from "react";

export default function MediaUploader() {
  const [status, setStatus] = useState("");

  const handleUpload = async (file: File) => {
    setStatus("Uploading...");
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      setStatus("Upload failed");
      return;
    }

    const data = await response.json();
    setStatus(data.url ? "Uploaded" : "Upload complete");
  };

  return (
    <div className="space-y-4 rounded-md border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-500">
      <input
        accept="image/*"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            void handleUpload(file);
          }
        }}
        type="file"
      />
      <p>{status || "Upload images to cloud storage"}</p>
    </div>
  );
}
