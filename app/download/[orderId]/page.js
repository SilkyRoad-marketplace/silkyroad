"use client";
import { useEffect, useState } from "react";
import { useSearchParams, useParams } from "next/navigation";

export default function DownloadPage() {
  const searchParams = useSearchParams();
  const params = useParams();
  const [message, setMessage] = useState("Checking your download link...");
  const [fileUrl, setFileUrl] = useState(null);

  const orderId = params.orderId;
  const expires = searchParams.get("expires");

  useEffect(() => {
    if (!orderId || !expires) {
      setMessage("Invalid download link.");
      return;
    }

    const expireTime = parseInt(expires, 10);
    const now = Date.now();

    if (now > expireTime) {
      setMessage("Sorry, this download link has expired (3-day limit).");
      return;
    }

    // In production, fetch a signed URL from server/Supabase Storage.
    const downloadFileUrl = `/sample.txt`;
    setFileUrl(downloadFileUrl);
    setMessage(null);
  }, [orderId, expires]);

  if (message) {
    return (
      <div style={{ padding: \"2rem\", textAlign: \"center\" }}>
        <h2>{message}</h2>
      </div>
    );
  }

  return (
    <div style={{ padding: \"2rem\", textAlign: \"center\" }}>
      <h2>Your file is ready to download!</h2>
      <a
        href={fileUrl}
        download
        style={{
          display: \"inline-block\",
          marginTop: \"20px\",
          padding: \"10px 20px\",
          backgroundColor: \"#0070f3\",
          color: \"#fff\",
          borderRadius: \"5px\",
          textDecoration: \"none\",
        }}
      >
        Download Now
      </a>
      <p style={{ marginTop: \"10px\", color: \"#555\" }}>
        This link will expire in 3 days from your purchase.
      </p>
    </div>
  );
}