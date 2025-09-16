import React from "react";
import "../css/nav.css";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export default function Nav({ cells }) {

  const handleExport = () => {
    const keys = Object.keys(cells);
    if (keys.length === 0) return;
    let maxRow = 0, maxColIndex = 0;
    keys.forEach(k => {
      const col = k[0];
      const row = parseInt(k.slice(1), 10);
      maxRow = Math.max(maxRow, row);
      maxColIndex = Math.max(maxColIndex, col.charCodeAt(0) - 65);
    });

    const columns = Array.from({ length: maxColIndex + 1 }, (_, i) => String.fromCharCode(65 + i));
    const rows = [];
    for (let r = 1; r <= maxRow; r++) {
      const row = columns.map(c => {
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

  return (
    <div id="navbar">
      <div className="file-container">
        <button>File</button>
        <div className="file-dropdown">
          <div className="dropdown-item" onClick={handleExport}>Export</div>
        </div>
      </div>
      <button>About</button>
      <button>Help</button>
    </div>
  );
}
