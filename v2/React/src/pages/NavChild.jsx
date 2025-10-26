import React, { useState, useEffect } from "react";
import "../css/navChild.css";

export default function NavChild({ onOperation, onExecuteCondition, cells, onSort}) {
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [openBA, setOpenBA] = useState(false);
  const [openCondition, setOpenCondition] = useState(false);
  const [conditionCode, setConditionCode] = useState("");
  const [hasIf, setHasIf] = useState(false);

  // Load saved condition code from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("conditionCode");
    if (saved) {
      setConditionCode(saved);
      if (saved.includes("IF")) setHasIf(true);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("conditionCode", conditionCode);
  }, [conditionCode]);

  const handleExecute = () => {
    console.log("Executing command from NavChild:", conditionCode);
    onExecuteCondition(conditionCode, cells);
  };

  return (
    <>
    <div className="nav-child">
      {/* BA Button */}
      <div className="relative">
        <button className="nav-button ignore-focus-loss" onClick={() => setOpenBA((prev) => !prev)}>
          BA 🔻
        </button>
        {openBA && (
          <div className="dropdown-menu shadow-md">
            <div className="dropdown-item ignore-focus-loss" onClick={() => { onOperation("sum"); setOpenBA(false); }}>
              SUM
            </div>
            <div className="dropdown-item ignore-focus-loss" onClick={() => { onOperation("average"); setOpenBA(false); }}>
              AVERAGE
            </div>
            <div className="dropdown-item ignore-focus-loss" onClick={() => { onOperation("min"); setOpenBA(false); }}>
              MIN
            </div>
            <div className="dropdown-item ignore-focus-loss" onClick={() => { onOperation("max"); setOpenBA(false); }}>
              MAX
            </div>
            <div className="dropdown-item ignore-focus-loss" onClick={() => { onOperation("count"); setOpenBA(false); }}>
              COUNT
            </div>
            <div className="dropdown-item ignore-focus-loss" onClick={() => { onOperation("round"); setOpenBA(false); }}>
              ROUND
            </div>
            <div className="dropdown-item ignore-focus-loss" onClick={() => { onOperation("abs"); setOpenBA(false); }}>
              ABS
            </div>
            <div className="dropdown-item ignore-focus-loss" onClick={() => { onOperation("product"); setOpenBA(false); }}>
              PRODUCT
            </div>
          </div>
        )}

      </div>
        <div className="sort-menu-container" style={{ position: "relative", display: "inline-block" }}>
        <button
          className="sort-button ignore-focus-loss"
          onClick={() => setShowSortMenu((prev) => !prev)}
          style={{
            padding: "6px 12px",
            backgroundColor: "#ffffffff", // Tailwind green-500
            color: "black",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Sort 🔻
        </button>

        {showSortMenu && (
          <div
            className="dropdown "
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              background: "white",
              boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
              borderRadius: "8px",
              marginTop: "4px",
              zIndex: 100,
              width: "120px",
            }}
          >
            <div
              onClick={() => {
                onSort("asc");
                setShowSortMenu(false);
              }}
              className="ignore-focus-loss"
              style={{
                padding: "8px",
                cursor: "pointer",
                borderBottom: "1px solid #e5e7eb",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#f3f4f6")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "white")}
            >
              Ascending
            </div>

            <div
              onClick={() => {
                onSort("desc");
                setShowSortMenu(false);
              }}
              style={{
                padding: "8px",
                cursor: "pointer",
              }}
              className="ignore-focus-loss"
              onMouseEnter={(e) => (e.currentTarget.style.background = "#f3f4f6")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "white")}
            >
              Descending
            </div>
          </div>
        )}
      </div>
    
        
      {/* Condition Button */}
      <div className="relative">
        <button className="nav-button" onClick={() => setOpenCondition((prev) => !prev)}>
          Condition 🔻
        </button>
        {openCondition && (
          <div className="dropdown-menu shadow-md">
            <div
              className="dropdown-item"
              onClick={handleExecute}
              style={{ marginTop: "5px", fontWeight: "bold" }}
            >
              Execute
            </div>
          </div>
        )}
      </div>

      {/* Editable input */}
      <input
        type="text"
        className="condition-display-panel"
        value={conditionCode}
        onChange={(e) => setConditionCode(e.target.value)}
        placeholder="Condition code"
        style={{
          marginLeft: "10px",
          padding: "6px 12px",
          borderRadius: "8px",
          border: "1px solid #ccc",
          background: "#fdfdfd",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          fontFamily: "monospace",
          minWidth: "1080px",
        }}
      />
    </div>
    </>
  );
}
