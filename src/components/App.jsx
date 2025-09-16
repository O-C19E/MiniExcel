import React, { useState, useEffect } from "react";
import Nav from "./Nav.jsx";
import Excel from "./Excel.jsx";

export default function App() {
  const [cells, setCells] = useState({}); // flat map like { A1: "10", B2: "=A1+5" }

  // Load saved cells on mount
  useEffect(() => {
    const saved = localStorage.getItem("miniExcelCells_v2");
    if (saved) setCells(JSON.parse(saved));
  }, []);

  // Save cells whenever they change (debounced-ish: basic)
  useEffect(() => {
    const t = setTimeout(() => {
      localStorage.setItem("miniExcelCells_v2", JSON.stringify(cells));
    }, 200);
    return () => clearTimeout(t);
  }, [cells]);

  return (
    <>
      <Nav cells={cells} />
      <Excel cells={cells} setCells={setCells} />
    </>
  );
}