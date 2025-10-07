import React, { useState, useEffect } from "react";
import "../css/navChild.css";

export default function NavChild({ onOperation, onExecuteCondition, cells }) {
  const [openBA, setOpenBA] = useState(false);
  const [openCondition, setOpenCondition] = useState(false);
  const [conditionCode, setConditionCode] = useState("");
  const [hasIf, setHasIf] = useState(false);
  const [selectingResult, setSelectingResult] = useState(false);

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

  const handleIfClick = () => {
    setConditionCode((prev) => prev + (prev ? " IF()" : "IF()"));
    setHasIf(true);
    setOpenCondition(false);
  };

  const handleElseIfClick = () => {
    if (!hasIf) return;
    setConditionCode((prev) => prev + " ELSEIF()");
    setOpenCondition(false);
  };

  const handleElseClick = () => {
    if (!hasIf) return;
    setConditionCode((prev) => prev + " ELSE()");
    setOpenCondition(false);
  };

  const handlePrintClick = () => {
    setConditionCode((prev) => prev + " PRINT()");
    setOpenCondition(false);
  };

  const handleExecute = () => {
    console.log("Executing command from NavChild:", conditionCode);
    onExecuteCondition(conditionCode, cells);
  };

  return (
    <div className="nav-child">
      {/* BA Button */}
      <div className="relative">
        <button className="nav-button" onClick={() => setOpenBA((prev) => !prev)}>
          BA 🔻
        </button>
        {openBA && (
          <div className="dropdown-menu shadow-md">
            <div className="dropdown-item" onClick={() => { onOperation("sum"); setOpenBA(false); }}>
              Sum
            </div>
            <div className="dropdown-item" onClick={() => { onOperation("average"); setOpenBA(false); }}>
              Average
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
            <div className="dropdown-item" onClick={handleIfClick}>IF</div>
            <div
              className="dropdown-item"
              onClick={handleElseIfClick}
              style={{ pointerEvents: hasIf ? "auto" : "none", opacity: hasIf ? 1 : 0.5 }}
            >
              ELSEIF
            </div>
            <div
              className="dropdown-item"
              onClick={handleElseClick}
              style={{ pointerEvents: hasIf ? "auto" : "none", opacity: hasIf ? 1 : 0.5 }}
            >
              ELSE
            </div>
            <div className="dropdown-item" onClick={handlePrintClick}>PRINT</div>
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
        className="condition-display"
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
          minWidth: "180px",
        }}
      />
    </div>
  );
}
