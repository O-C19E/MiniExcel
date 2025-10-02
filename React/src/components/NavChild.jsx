import React, { useState, useRef, useEffect } from "react";
import "../css/navChild.css";

export default function NavChild({ onOperation }) {
  const [open, setOpen] = useState(false);
  const timeoutRef = useRef(null);

  // Handle hover with a small delay to prevent flicker
  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => setOpen(false), 200); // short delay
  };

  return (
    <div id="nav-child" className="relative" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <button className="nav-button">
        BA 🔻
      </button>
      {open && (
        <div className="dropdown-menu shadow-md">
          <div className="dropdown-item" onClick={() => onOperation("sum")}>
            Sum
          </div>
          <div className="dropdown-item" onClick={() => onOperation("average")}>
            Average
          </div>
        </div>
      )}
    </div>
  );
}
