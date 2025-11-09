"use client";
import { useState } from "react";

export default function RefundPage() {
  const [email, setEmail] = useState("");
  const [order, setOrder] = useState("");
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !order || !file) {
      setMessage("Please fill all fields and attach a screenshot.");
      return;
    }

    // Upload file to Supabase Storage or your endpoint - here we simulate by sending to a placeholder endpoint
    setMessage("Submitting refund request...");

    const form = new FormData();
    form.append("email", email);
    form.append("order", order);
    form.append("evidence", file);

    try {
      // Replace with your refund endpoint (Supabase Function or serverless)
      await fetch("/api/refund-submit", { method: "POST", body: form });
      setMessage("Refund request submitted. SilkyRoad will review and respond.");
    } catch (err) {
      setMessage("Failed to submit refund request.");
    }
  };

  return (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      <h2>Request a Refund</h2>
      <p>Submit your refund request within 3 days with proof.</p>
      <form onSubmit={handleSubmit} style={{ marginTop: "20px" }}>
        <input
          type="email"
          placeholder="Your Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ padding: "10px", width: "80%", marginBottom: "10px" }}
        />
        <br />
        <input
          type="text"
          placeholder="Order ID"
          value={order}
          onChange={(e) => setOrder(e.target.value)}
          style={{ padding: "10px", width: "80%", marginBottom: "10px" }}
        />
        <br />
        <input
          type="file"
          onChange={(e) => setFile(e.target.files[0])}
          style={{ marginBottom: "10px" }}
        />
        <br />
        <button
          type="submit"
          style={{
            backgroundColor: "#d33",
            color: "#fff",
            padding: "10px 20px",
            borderRadius: "5px",
            border: "none",
          }}
        >
          Submit Refund Request
        </button>
      </form>
      <p style={{ color: "green", marginTop: "10px" }}>{message}</p>
    </div>
  );
}