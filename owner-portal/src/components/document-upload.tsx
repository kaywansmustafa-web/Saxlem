"use client";
import { useState } from "react";
export function DocumentUpload() {
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  return (
    <form
      className="card upload-card"
      onSubmit={async (event) => {
        event.preventDefault();
        setBusy(true);
        setMessage("");
        try {
          const response = await fetch("/api/documents/upload", {
            method: "POST",
            body: new FormData(event.currentTarget),
          });
          const result = (await response.json()) as {
            ok?: boolean;
            error?: { message?: string };
          };
          if (!response.ok || !result.ok)
            throw new Error(result.error?.message ?? "Upload failed.");
          setMessage("Document uploaded.");
          window.location.reload();
        } catch (error) {
          setMessage(error instanceof Error ? error.message : "Upload failed.");
          setBusy(false);
        }
      }}
    >
      <h2>Upload platform document</h2>
      <label className="field">
        Category
        <select name="category">
          <option value="platform">Platform</option>
          <option value="legal">Legal</option>
          <option value="report">Report</option>
        </select>
      </label>
      <label className="field">
        File
        <input
          name="file"
          type="file"
          required
          accept="application/pdf,image/jpeg,image/png,text/plain"
        />
      </label>
      <p>
        <small>
          PDF, JPEG, PNG or text, up to 25 MB. For now files stay on this
          server; cloud storage with virus scanning must be connected before
          launch.
        </small>
      </p>
      {message && <p role="status">{message}</p>}
      <button className="button button-primary" disabled={busy}>
        {busy ? "Uploading…" : "Upload document"}
      </button>
    </form>
  );
}
