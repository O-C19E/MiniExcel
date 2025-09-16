import React, { useState } from "react";
import "../css/navChild.css";

export default function NavChild({ onOperation }) {
  const [open, setOpen] = useState(false);

  return (
    <div id="nav-child">
      <div className="relative">
        <button onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
          BA 🔻
        </button>
        {open && (
          <div className="absolute bg-white border border-black shadow-md">
            <div className="px-2 py-1 cursor-pointer hover:bg-gray-200" onClick={() => onOperation("sum")}>
              Sum
            </div>
            <div className="px-2 py-1 cursor-pointer hover:bg-gray-200" onClick={() => onOperation("average")}>
              Average
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
