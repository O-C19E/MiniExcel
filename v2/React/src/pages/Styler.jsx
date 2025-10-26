import React, { useState } from "react";

export default function Styler({ onStyleChange}) {
  const [fontFamily, setFontFamily] = useState("Calibri");
  const [fontSize, setFontSize] = useState(14);
  const [textAlign, setTextAlign] = useState("left");

  const fonts = ["Arial", "Calibri", "Times New Roman", "Verdana", "Courier New"];
  const sizes = [10, 12, 14, 16, 18, 20, 24];

  // Update parent when any style changes
  const updateStyle = (key, value) => {
    if (key === "fontFamily") setFontFamily(value);
    if (key === "fontSize") setFontSize(value);
    if (key === "textAlign") setTextAlign(value);

    const newStyle = {
      fontFamily: key === "fontFamily" ? value : fontFamily,
      fontSize: key === "fontSize" ? value : fontSize,
      textAlign: key === "textAlign" ? value : textAlign,
    };

    onStyleChange(newStyle);
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "8px 12px",
        backgroundColor: "#f7f7f7",
        borderBottom: "1px solid #ddd",
        borderRadius: "8px",
      }}
    >
      <select
        value={fontFamily}
        onChange={(e) => updateStyle("fontFamily", e.target.value)}
        style={{ padding: "4px", borderRadius: "6px" }}
        className="ignore-focus-loss"
      >
        {fonts.map((f) => (
          <option key={f} value={f}>
            {f}
          </option>
        ))}
      </select>

      <select
        value={fontSize}
        onChange={(e) => updateStyle("fontSize", Number(e.target.value))}
        style={{ padding: "4px", borderRadius: "6px" }}
        className="ignore-focus-loss"
      >
        {sizes.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>

      <div style={{ display: "flex", gap: "4px" }}>
        {["left", "center", "right"].map((align) => (
          <button
            key={align}
            className="ignore-focus-loss"
            onClick={() => updateStyle("textAlign", align)}
            style={{
              padding: "6px 10px",
              border: textAlign === align ? "2px solid #007bff" : "1px solid #ccc",
              backgroundColor: textAlign === align ? "#e9f2ff" : "#fff",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            {align.charAt(0).toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  );
}
