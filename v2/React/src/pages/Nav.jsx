import "../css/nav.css";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

export default function Nav({ cells, setCells, clearCells }) {
  const navigate = useNavigate();
  const [loggedInUser, setLoggedInUser] = useState("");

  // --- Check localStorage on mount ---
  useEffect(() => {
    const user = localStorage.getItem("loggedInUser") || "";
    setLoggedInUser(user);
  }, []);

  // --- Logout ---
  const handleLogout = () => {
    localStorage.removeItem("loggedInUser");
    setLoggedInUser("");
    navigate("/login");
  };

  // --- Import Excel/CSV ---
  const handleImport = (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    const data = new Uint8Array(event.target.result);
    const workbook = XLSX.read(data, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    const importedCells = {};
    json.forEach((row, r) => {
      row.forEach((cell, c) => {
        if (cell !== null && cell !== undefined && cell !== "") {
          const colLabel = String.fromCharCode(65 + c);
          importedCells[`${colLabel}${r + 1}`] = {
            value: String(cell),
            style: { fontFamily: "Calibri", fontSize: 14, textAlign: "left" }
          };
        }
      });
    });

    setCells(importedCells);
    localStorage.setItem("miniExcelCells_v2", JSON.stringify(importedCells));
    alert("✅ Import successful!");
  };

  reader.readAsArrayBuffer(file);
};


  // --- Export to Excel ---
  const handleExport = () => {
  const keys = Object.keys(cells);
  if (!keys.length) return;

  let maxRow = 0, maxColIndex = 0;
  keys.forEach(k => {
    const col = k.match(/^[A-Z]+/)[0];
    const row = parseInt(k.replace(/^[A-Z]+/, ""), 10);
    maxRow = Math.max(maxRow, row);
    const colIndex = col.split("").reduce((acc, char) => acc * 26 + (char.charCodeAt(0) - 64), 0);
    maxColIndex = Math.max(maxColIndex, colIndex - 1);
  });

  const columns = Array.from({ length: maxColIndex + 1 }, (_, i) => {
    let n = i, label = "";
    while (n >= 0) {
      label = String.fromCharCode((n % 26) + 65) + label;
      n = Math.floor(n / 26) - 1;
    }
    return label;
  });

  const rows = [];
  for (let r = 1; r <= maxRow; r++) {
    const row = columns.map(c => {
      const rawVal = cells[`${c}${r}`];
      const v = (rawVal && typeof rawVal === "object" && "value" in rawVal) ? rawVal.value : rawVal;
      if (v === undefined || v === null || v === "") return "";
      const n = Number(v);
      return !isNaN(n) ? n : String(v);
    });
    rows.push(row);
  }

  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");

  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  saveAs(new Blob([wbout], { type: "application/octet-stream" }), "MiniExcel.xlsx");
};


  // --- Delete All ---
  const handleDeleteAll = () => {
    if (window.confirm("Are you sure you want to delete all cells?")) {
      clearCells();
    }
  };

  return (
    <div id="navbar">
      <div style={{display: "flex", flexDirection: "row"}}>
        <Link to="/" className="button">Home</Link>
        <div className="file-container">
          <button className="button">File</button>
          <div className="file-dropdown">
            <input
              type="file"
              accept=".csv, .xlsx"
              onChange={handleImport}
              style={{ display: "none" }}
              id="import-file"
            />
            <label htmlFor="import-file">
              <div className="dropdown-item cursor-pointer">Import</div>
            </label>
            <div className="dropdown-item" onClick={handleExport}>Export</div>
            <div className="dropdown-item" onClick={handleDeleteAll}>Delete All</div>
          </div>
        </div>

        <Link to="/help" className="button">RDG</Link>
        </div>
        <div>

      {loggedInUser ? (
        <>
          <Link to="/dashboard" className="button">Dashboard</Link>
          <button className="button" onClick={handleLogout} style={{ marginLeft: "10px" }}>
            Logout
          </button>
          <span style={{ margin: "10px", padding: "8px", fontSize: "17px",color: "#f99e0bff", fontFamily: "Calibiri" ,border: "1px solid white", borderRadius: "12px"}}>
            <code>Welcome {loggedInUser}</code>
          </span>
        </>
      ) : (
        <>
          <Link to="/login" className="button">Login</Link>
          <Link to="/register" className="button">Register</Link>
        </>
      )}
      </div>
      
    </div>
  );
}
