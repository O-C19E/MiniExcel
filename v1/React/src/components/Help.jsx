import React, { useEffect } from "react";
import RandomDatasetPage from "./RandomDatasetGenerator";

export default function Help() {
  // Disable scroll while this page is mounted
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = "hidden"; // disable scroll

    return () => {
      document.body.style.overflow = originalStyle; // restore on unmount
    };
  }, []);

  return (
    <div
      style={{
        height: "100vh", // full viewport height
        width: "100vw",  // full viewport width
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#f5f5f5",
      }}
    >
      {/* Card */}
      <div
        style={{
          width: "450px",
          padding: "30px",
          background: "white",
          borderRadius: "12px",
          boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
        }}
      >
        <h1 style={{ textAlign: "center", marginBottom: "20px" }}>
          Help - Random Dataset Generator
        </h1>

        <RandomDatasetPage />
      </div>
    </div>
  );
}
