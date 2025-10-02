import React, { useState, useEffect } from "react";
import Nav from "./Nav.jsx";
import Excel from "./Excel.jsx";

export default function App() {
  const [cells, setCells] = useState({});

  // Load saved cells from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("miniExcelCells_v2");
    if (saved) setCells(JSON.parse(saved));
  }, []);

  // Save cells to localStorage whenever they change (debounced-ish)
  useEffect(() => {
    const t = setTimeout(() => {
      localStorage.setItem("miniExcelCells_v2", JSON.stringify(cells));
    }, 200);
    return () => clearTimeout(t);
  }, [cells]);

  // Update a single cell
  const updateCell = (key, value) => {
    setCells((prev) => {
      const copy = { ...prev };
      if (!value || value === "") delete copy[key];
      else copy[key] = value;
      return copy;
    });
  };

  // Clear all cells
  const clearCells = () => {
    localStorage.removeItem("miniExcelCells_v2");
    setCells({});
  };

  return (
    <>
      <Nav cells={cells} clearCells={clearCells} />
      <Excel cells={cells} updateCell={updateCell} />
    </>
  );
}
