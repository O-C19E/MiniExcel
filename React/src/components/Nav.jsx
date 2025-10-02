import React from "react";
import "../css/nav.css";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export default function Nav({ cells, setCells }) {
  // --- Import Excel/CSV ---
  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const workbook = XLSX.read(event.target.result, { type: "binary" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      const importedCells = {};
      json.forEach((row, r) => {
        row.forEach((cell, c) => {
          if (cell !== null && cell !== undefined && cell !== "") {
            const colLabel = String.fromCharCode(65 + c); // A, B, C...
            importedCells[`${colLabel}${r + 1}`] = String(cell);
          }
        });
      });

      // Update state and localStorage
      setCells(importedCells);
      localStorage.setItem("miniExcelCells_v2", JSON.stringify(importedCells));
      alert("Import successful!");
    };

    reader.readAsBinaryString(file); // reliable for XLSX and CSV
  };

  // --- Export current cells to Excel ---
  const handleExport = () => {
    const keys = Object.keys(cells);
    if (keys.length === 0) return;

    let maxRow = 0,
      maxColIndex = 0;

    keys.forEach((k) => {
      const col = k.match(/^[A-Z]+/)[0];
      const row = parseInt(k.replace(/^[A-Z]+/, ""), 10);
      maxRow = Math.max(maxRow, row);
      const colIndex = col
        .split("")
        .reduce((acc, char) => acc * 26 + (char.charCodeAt(0) - 64), 0);
      maxColIndex = Math.max(maxColIndex, colIndex - 1);
    });

    const columns = Array.from({ length: maxColIndex + 1 }, (_, i) => {
      let n = i;
      let label = "";
      while (n >= 0) {
        label = String.fromCharCode((n % 26) + 65) + label;
        n = Math.floor(n / 26) - 1;
      }
      return label;
    });

    const rows = [];
    for (let r = 1; r <= maxRow; r++) {
      const row = columns.map((c) => {
        const val = cells[`${c}${r}`];
        return val && !isNaN(val) ? Number(val) : val || "";
      });
      rows.push(row);
    }

    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");

    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([wbout], { type: "application/octet-stream" }), "MiniExcel.xlsx");
  };

  // --- Delete all cells ---
  const handleDeleteAll = () => {
    if (window.confirm("Are you sure you want to delete all cells?")) {
      localStorage.removeItem("miniExcelCells_v2");
      setCells({});
    }
  };

  return (
    <div id="navbar">
      <div className="file-container">
        <button>File</button>
        <div className="file-dropdown">
          {/* Import */}
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

          {/* Export */}
          <div className="dropdown-item" onClick={handleExport}>
            Export
          </div>

          {/* Delete All */}
          <div className="dropdown-item" onClick={handleDeleteAll}>
            Delete All
          </div>
        </div>
      </div>

      <button>About</button>
      <button>Help</button>
    </div>
  );
}
