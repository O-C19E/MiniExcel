import React, { useState, useEffect } from "react";
import Nav from "./Nav.jsx";
import Excel from "./Excel.jsx";
import About from "./About.jsx";
import Help from "./Help.jsx"
import { createBrowserRouter, RouterProvider } from "react-router";

export default function App() {
  const [cells, setCells] = useState({});
  const [loaded, setLoaded] = useState(false); // Track initial load
  const router = createBrowserRouter([
      {
        path: "/",
        element: <><Nav/><About/></>
      },
      {
        path: "/help",
        element: <><Nav/><Help/></>
      }
    ])
  // Load saved cells from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("miniExcelCells_v2");
    if (saved) setCells(JSON.parse(saved));
    setLoaded(true); // mark that initial load is done
  }, []);

  // Save cells to localStorage whenever they change
  useEffect(() => {
    if (!loaded) return; // skip during initial load
    if (Object.keys(cells).length > 0) {
      const t = setTimeout(() => {
        localStorage.setItem("miniExcelCells_v2", JSON.stringify(cells));
      }, 200);
      return () => clearTimeout(t);
    } else {
      localStorage.removeItem("miniExcelCells_v2");
    }
  }, [cells, loaded]);

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
    setCells({}); // will also remove from localStorage via useEffect
  };

  return (
    <>
      <RouterProvider router={router} />
      <Excel cells={cells} updateCell={updateCell} />
    </>
  );
}


{/* <Nav cells={cells} setCells={setCells} clearCells={clearCells} /> */}