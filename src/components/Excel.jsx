import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import NavChild from "./NavChild.jsx";
import "../css/excel.css";

const DEFAULT_VISIBLE_ROWS = 25;
const DEFAULT_VISIBLE_COLS = 10;
const INITIAL_ROWS = 200;
const INITIAL_COLS = 60;
const BUFFER = 5;

const COLUMN_HEADERS = (numCols) => {
  const headers = [];
  for (let i = 0; i < numCols; i++) {
    let n = i;
    let label = '';
    while (n >= 0) {
      label = String.fromCharCode((n % 26) + 65) + label;
      n = Math.floor(n / 26) - 1;
    }
    headers.push(label);
  }
  return headers;
};


const Cell = React.memo(function Cell({
  cellKey,
  value,
  isEditing,
  onStartEdit,
  onSave,
  highlight,
  onNavigate,
}) {
  const inputRef = useRef(null);

  useEffect(() => {
    if (isEditing) inputRef.current?.focus();
  }, [isEditing]);

  return (
    <div
      className={`cell ${highlight ? "cell-highlight" : ""}`}
      onClick={() => onStartEdit(cellKey)}
      tabIndex={0}
      onKeyDown={(e) => onNavigate(e, cellKey)}
      role="gridcell"
      aria-label={cellKey}
    >
      {isEditing ? (
        <input
          ref={inputRef}
          defaultValue={value || ""}
          onBlur={(e) => onSave(cellKey, e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onSave(cellKey, e.target.value);
            if (e.key === "Tab") {
              e.preventDefault();
              onSave(cellKey, e.target.value, "tab");
            }
          }}
          className="cell-input"
        />
      ) : (
        <div className="cell-value">{value || ""}</div>
      )}
    </div>
  );
});

export default function Excel({ cells, setCells }) {
  const containerRef = useRef(null);
  const [editing, setEditing] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);
  const [selectedCol, setSelectedCol] = useState(null);
  const [numRows, setNumRows] = useState(INITIAL_ROWS);
  const [numCols, setNumCols] = useState(INITIAL_COLS);
  const [viewport, setViewport] = useState({
    startRow: 1,
    startCol: 1,
    visibleRows: DEFAULT_VISIBLE_ROWS,
    visibleCols: DEFAULT_VISIBLE_COLS,
  });

  const headers = useMemo(() => COLUMN_HEADERS(numCols), [numCols]);
  const getRaw = useCallback((key) => cells[key], [cells]);
  const computeValue = useCallback(
    (key) => {
      const raw = getRaw(key);
      if (raw && typeof raw === "string" && raw.startsWith("=")) {
        try {
          return evaluateFormula(raw.slice(1), (k) => getRaw(k));
        } catch (e) {
          return "#ERR";
        }
      }
      return raw;
    },
    [getRaw]
  );

  const onScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const rowHeight = 30;
    const colWidth = 100;
    const scrollTop = el.scrollTop;
    const scrollLeft = el.scrollLeft;
    const startRow = Math.floor(scrollTop / rowHeight) + 1;
    const startCol = Math.floor(scrollLeft / colWidth) + 1;

    setViewport((prev) => ({
      ...prev,
      startRow: Math.max(1, startRow - BUFFER),
      startCol: Math.max(1, startCol - BUFFER),
    }));

    const visibleColsCount = Math.ceil(el.clientWidth / colWidth) + BUFFER;
    const visibleRowsCount = Math.ceil(el.clientHeight / rowHeight) + BUFFER;

    setViewport((prev) => ({
      ...prev,
      visibleCols: visibleColsCount,
      visibleRows: visibleRowsCount,
    }));

    if (startRow + visibleRowsCount + BUFFER > numRows)
      setNumRows((r) => Math.max(r * 1.5, startRow + visibleRowsCount + BUFFER));
    if (startCol + visibleColsCount + BUFFER > numCols)
      setNumCols((c) => Math.max(c * 1.5, startCol + visibleColsCount + BUFFER));
  }, [numCols, numRows]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => el.removeEventListener("scroll", onScroll);
  }, [onScroll]);

  const cleanupEmptyTrailing = useCallback(() => {
    const keys = Object.keys(cells);
    let maxRow = 0;
    let maxColIndex = 0;
    keys.forEach((k) => {
      const col = k.match(/^[A-Z]+/)[0];
      const row = parseInt(k.replace(/^[A-Z]+/, ""), 10);
      maxRow = Math.max(maxRow, row);
      maxColIndex = Math.max(maxColIndex, col.charCodeAt(0) - 65);
    });
    const targetRows = Math.max(maxRow + 20, DEFAULT_VISIBLE_ROWS);
    const targetCols = Math.max(maxColIndex + 1 + 5, DEFAULT_VISIBLE_COLS);
    setNumRows((prev) => Math.max(DEFAULT_VISIBLE_ROWS, Math.min(prev, targetRows)));
    setNumCols((prev) => Math.max(DEFAULT_VISIBLE_COLS, Math.min(prev, targetCols)));
  }, [cells]);

  useEffect(() => {
    const t = setTimeout(() => cleanupEmptyTrailing(), 500);
    return () => clearTimeout(t);
  }, [cleanupEmptyTrailing]);

  const startRow = viewport.startRow;
  const startCol = viewport.startCol;
  const endRow = Math.min(numRows, startRow + viewport.visibleRows + BUFFER);
  const endCol = Math.min(numCols, startCol + viewport.visibleCols + BUFFER);

  const onStartEdit = useCallback((cellKey) => setEditing(cellKey), []);
  const onSave = useCallback(
    (cellKey, value, nav) => {
      setCells((prev) => {
        const copy = { ...prev };
        if (value === "" || value === undefined) delete copy[cellKey];
        else copy[cellKey] = value;
        return copy;
      });
      setEditing(null);
      if (nav === "tab") {
        const row = parseInt(cellKey.slice(1), 10);
        const col = cellKey[0].charCodeAt(0);
        const nextKey = `${String.fromCharCode(col + 1)}${row}`;
        setTimeout(() => setEditing(nextKey), 0);
      }
    },
    [setCells]
  );

  const onNavigate = useCallback(
    (e, cellKey) => {
      if (editing) return;
      const colChar = cellKey[0];
      const row = parseInt(cellKey.slice(1), 10);
      let colCode = colChar.charCodeAt(0);
      if (e.key === "ArrowDown") setEditing(`${String.fromCharCode(colCode)}${row + 1}`);
      else if (e.key === "ArrowUp")
        setEditing(`${String.fromCharCode(colCode)}${Math.max(1, row - 1)}`);
      else if (e.key === "ArrowLeft")
        setEditing(`${String.fromCharCode(Math.max(65, colCode - 1))}${row}`);
      else if (e.key === "ArrowRight") setEditing(`${String.fromCharCode(colCode + 1)}${row}`);
      else if (e.key === "Enter") setEditing(`${String.fromCharCode(colCode)}${row + 1}`);
      else if (e.key === "Escape") {
        setSelectedCol(null);
        setSelectedRow(null);
      }
    },
    [editing]
  );

  const handleHeaderDoubleClick = (type, identifier) => {
    if (type === "row") {
      setSelectedRow(identifier);
      setSelectedCol(null);
    } else {
      setSelectedCol(identifier);
      setSelectedRow(null);
    }
  };

  const handleOperation = (type) => {
    let relevantCells = [];
    if (selectedCol)
      relevantCells = Array.from({ length: numRows }, (_, i) => `${selectedCol}${i + 1}`).filter(
        (k) => cells[k]
      );
    else if (selectedRow)
      relevantCells = headers.map((c) => `${c}${selectedRow}`).filter((k) => cells[k]);
    else return alert("Select a row or column first!");

    if (!relevantCells.length) return alert("No data in selection");

    const values = relevantCells.map((key) => parseFloat(computeValue(key)) || 0);
    const sum = values.reduce((a, b) => a + b, 0);
    const average = values.length ? sum / values.length : 0;

    if (selectedCol) {
      const col = selectedCol;
      let lastFilled = 0;
      for (let r = 1; r <= numRows; r++) if (cells[`${col}${r}`]) lastFilled = r;
      const resultRow = lastFilled + 1;
      onSave(`${col}${resultRow}`, type === "sum" ? String(sum) : String(average));
    } else {
      const row = selectedRow;
      let lastColIndex = -1;
      for (let i = 0; i < headers.length; i++) if (cells[`${headers[i]}${row}`]) lastColIndex = i;
      const nextCol = headers[lastColIndex + 1] || String.fromCharCode(65 + headers.length);
      onSave(`${nextCol}${row}`, type === "sum" ? String(sum) : String(average));
    }
  };

  return (
    <div className="p-4">
      <NavChild onOperation={handleOperation} />
      <div className="grid-container" ref={containerRef} role="application">
        <div
          className="grid-table"
          style={{ width: `${(endCol + 1) * 100}px`, height: `${(endRow + 1) * 30}px` }}
        >
          {/* header row */}
          <div className="grid-row header-row">
            <div className="grid-cell header-cell empty-top-left"></div>
            {Array.from({ length: endCol }, (_, ci) => {
              const colIndex = ci + 1;
              const label = String.fromCharCode(64 + colIndex);
              return (
                <div
                  key={colIndex}
                  className={`grid-cell header-cell ${selectedCol === label ? "col-selected" : ""}`}
                  onDoubleClick={() => handleHeaderDoubleClick("col", label)}
                  style={{
                    left: `${colIndex * 100}px`,
                    width: "100px",
                    top: 0,
                    height: "30px",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  {label}
                </div>
              );
            })}
          </div>

          {/* rows */}
          {Array.from({ length: endRow }, (_, ri) => {
            const rowIndex = ri + 1;
            return (
              <React.Fragment key={rowIndex}>
                <div
                  className={`grid-cell header-cell row-header ${
                    selectedRow === rowIndex ? "row-selected" : ""
                  }`}
                  onDoubleClick={() => handleHeaderDoubleClick("row", rowIndex)}
                  style={{ top: `${rowIndex * 30}px`, height: "30px", width: "100px" }}
                >
                  {rowIndex}
                </div>
                {Array.from({ length: endCol }, (_, ci) => {
                  const colIndex = ci + 1;
                  if (colIndex < startCol || colIndex > endCol) return null;
                  const colLabel = String.fromCharCode(64 + colIndex);
                  const key = `${colLabel}${rowIndex}`;
                  const raw = cells[key];
                  const display = computeValue(key);
                  const isEditing = editing === key;
                  const highlight = selectedCol === colLabel || selectedRow === rowIndex;
                  return (
                    <div
                      key={key}
                      className="grid-cell cell-wrapper"
                      style={{
                        left: `${colIndex * 100}px`,
                        top: `${rowIndex * 30}px`,
                        width: "100px",
                        height: "30px",
                      }}
                    >
                      <Cell
                        cellKey={key}
                        value={isEditing ? raw : display}
                        isEditing={isEditing}
                        onStartEdit={onStartEdit}
                        onSave={onSave}
                        highlight={highlight}
                        onNavigate={onNavigate}
                      />
                    </div>
                  );
                })}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}
