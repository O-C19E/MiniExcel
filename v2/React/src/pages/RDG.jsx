import React, { useEffect } from "react";
import RandomDatasetPage from "./RandomDatasetGenerator";

export default function RDG() {
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
        height: "100vh", 
        width: "100vw",  
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "linear-gradient(135deg, #74ABE2, #5563DE)",
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
          RDG - Random Dataset Generator
        </h1>

        <RandomDatasetPage />
      </div>
    </div>
  );
}
