import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import NavChild from "./NavChild.jsx";
import "../css/excel.css";

const DEFAULT_VISIBLE_ROWS = 25;
const DEFAULT_VISIBLE_COLS = 10;
const INITIAL_ROWS = 200;
const INITIAL_COLS = 60;
const BUFFER = 5;

// Generate column headers like A, B, ..., Z, AA, AB, etc.
const COLUMN_HEADERS = (numCols) => {
  const headers = [];
  for (let i = 0; i < numCols; i++) {
    let n = i;
    let label = "";
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
  onMouseDown,
  onMouseEnter,
}) {
  const inputRef = useRef(null);

  useEffect(() => {
    if (isEditing) inputRef.current?.focus();
  }, [isEditing]);

  return (
    <div
      className={`cell ${highlight ? "cell-highlight" : ""}`}
      onClick={() => onStartEdit(cellKey)}
      onMouseDown={() => onMouseDown?.(cellKey)}
      onMouseEnter={() => onMouseEnter?.(cellKey)}
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
            if (e.key === "Enter") onSave(cellKey, e.target.value, undefined, true);
            if (e.key === "Tab") {
              e.preventDefault();
              onSave(cellKey, e.target.value, "tab", true);
            }
            if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
              e.preventDefault();
              onNavigate(e, cellKey);
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

export default function Excel({ cells, updateCell }) {
  const containerRef = useRef(null);
  const [formulaResult, setFormulaResult] = useState("");
  const [editing, setEditing] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);
  const [selectedCol, setSelectedCol] = useState(null);
  const [numRows, setNumRows] = useState(INITIAL_ROWS);
  const [numCols, setNumCols] = useState(INITIAL_COLS);
  const [selection, setSelection] = useState([]);
  const [isSelecting, setIsSelecting] = useState(false);
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
          const parser = new FormulaParser();
          const scope = {};
          for (let k in cells) {
            const val = parseFloat(cells[k]);
            scope[k] = isNaN(val) ? 0 : val;
          }
          parser.functions = {
            PRINT: (value) => value,
          };
          const result = parser.parse(raw, { scope });
          return result;
        } catch (e) {
          return "#ERR";
        }
      }
      return raw;
    },
    [getRaw, cells]
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

    const visibleColsCount = Math.ceil(el.clientWidth / colWidth) + BUFFER;
    const visibleRowsCount = Math.ceil(el.clientHeight / rowHeight) + BUFFER;

    setViewport({
      startRow: Math.max(1, startRow - BUFFER),
      startCol: Math.max(1, startCol - BUFFER),
      visibleCols: visibleColsCount,
      visibleRows: visibleRowsCount,
    });

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

  const onStartEdit = useCallback((cellKey) => setEditing(cellKey), []);
  const onSave = useCallback(
    (cellKey, value, nav) => {
      updateCell(cellKey, value);
      const row = parseInt(cellKey.slice(1), 10);
      const colChar = cellKey[0];

      if (nav === "tab") {
        const nextKey = `${String.fromCharCode(colChar.charCodeAt(0) + 1)}${row}`;
        setEditing(nextKey);
      } else {
        const nextKey = `${colChar}${row + 1}`;
        setEditing(nextKey);
      }
    },
    [updateCell]
  );

  const onNavigate = useCallback(
    (e, cellKey) => {
      const colChar = cellKey[0];
      const row = parseInt(cellKey.slice(1), 10);
      let colCode = colChar.charCodeAt(0);

      switch (e.key) {
        case "ArrowDown":
          setEditing(`${String.fromCharCode(colCode)}${row + 1}`);
          break;
        case "ArrowUp":
          setEditing(`${String.fromCharCode(colCode)}${Math.max(1, row - 1)}`);
          break;
        case "ArrowLeft":
          setEditing(`${String.fromCharCode(Math.max(65, colCode - 1))}${row}`);
          break;
        case "ArrowRight":
          setEditing(`${String.fromCharCode(colCode + 1)}${row}`);
          break;
        case "Enter":
          setEditing(`${colChar}${row + 1}`);
          break;
        case "Escape":
          setSelection([]);
          setEditing(null);
          break;
        default:
          return;
      }
    },
    []
  );

  const startSelection = (cellKey) => {
    setSelection([cellKey]);
    setIsSelecting(true);
  };

  const extendSelection = (cellKey) => {
    if (!isSelecting) return;
    const [startCell] = selection;
    const startRow = parseInt(startCell.slice(1), 10);
    const startCol = startCell[0].charCodeAt(0);

    const endRow = parseInt(cellKey.slice(1), 10);
    const endCol = cellKey[0].charCodeAt(0);

    const rows = [startRow, endRow].sort((a, b) => a - b);
    const cols = [startCol, endCol].sort((a, b) => a - b);

    const newSelection = [];
    for (let r = rows[0]; r <= rows[1]; r++) {
      for (let c = cols[0]; c <= cols[1]; c++) {
        newSelection.push(`${String.fromCharCode(c)}${r}`);
      }
    }
    setSelection(newSelection);
  };

  const endSelection = () => setIsSelecting(false);

  const handleOperation = (type) => {
    if (!selection.length) return alert("Select cells first!");

    const isSingleCol = new Set(selection.map((k) => k[0])).size === 1;
    const isSingleRow = new Set(selection.map((k) => parseInt(k.slice(1), 10))).size === 1;

    const sorted = [...selection].sort((a, b) => {
      const rowA = parseInt(a.slice(1), 10);
      const rowB = parseInt(b.slice(1), 10);
      return rowA - rowB;
    });

    const values = sorted.map((key) => Number(cells[key] || 0));
    let result;
    if (type === "sum") result = values.reduce((a, b) => a + b, 0);
    else if (type === "average") result = values.reduce((a, b) => a + b, 0) / values.length;

    const newCells = { ...cells };

    if (isSingleCol) {
      const col = sorted[0][0];
      const lastRow = Math.max(...sorted.map((k) => parseInt(k.slice(1), 10)));
      const insertRow = lastRow + 1;
      for (let r = numRows; r > lastRow; r--) {
        const oldKey = `${col}${r}`;
        const newKey = `${col}${r + 1}`;
        newCells[newKey] = newCells[oldKey];
      }
      newCells[`${col}${insertRow}`] = result;
    } else if (isSingleRow) {
      const row = parseInt(sorted[0].slice(1), 10);
      const lastColCode = Math.max(...sorted.map((k) => k[0].charCodeAt(0)));
      const insertColCode = lastColCode + 1;
      for (let c = numCols; c > lastColCode - 64; c--) {
        const oldKey = `${String.fromCharCode(c + 64)}${row}`;
        const newKey = `${String.fromCharCode(c + 65)}${row}`;
        newCells[newKey] = newCells[oldKey];
      }
      newCells[`${String.fromCharCode(insertColCode)}${row}`] = result;
    }

    updateCellBatch(newCells);
    setSelection([]);
  };

  /** Updated executeCondition */
const executeCondition = async (formula, cells) => {
  try {
    const res = await fetch("http://localhost:5000/formula", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ formula, cells }),
    });
    const data = await res.json();
    console.log("Formula result from Python:", data.result);

    // Store the result to display in the UI
    setFormulaResult(data.result);
  } catch (err) {
    console.error("Error executing formula via Python:", err);
    setFormulaResult("#ERR");
  }
};

  const updateCellBatch = (newCells) => {
    for (let key in newCells) updateCell(key, newCells[key]);
  };

  const startRow = viewport.startRow;
  const startCol = viewport.startCol;
  const endRow = Math.min(numRows, startRow + viewport.visibleRows + BUFFER);
  const endCol = Math.min(numCols, startCol + viewport.visibleCols + BUFFER);

  return (
    <div
      className="p-4"
      onMouseUp={endSelection}
      onMouseLeave={endSelection}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Escape") setSelection([]);
      }}
    >
      <NavChild
        onOperation={handleOperation}
        cells={cells}
        onExecuteCondition={(code, cells, targetCell) => executeCondition(code, cells, targetCell)}
      />

      <div style={{ marginTop: "10px", fontSize: "20px" }}>
        <em>Result:</em> <em style={{fontFamily: "monospace", fontSize: "20px", fontStyle: "normal"}}>{formulaResult}</em>
        <hr/>
      </div>

      <div className="grid-container" ref={containerRef} role="application">
        <div
          className="grid-table"
          style={{ width: `${(endCol + 2) * 100}px`, height: `${(endRow + 1) * 30}px` }}
        >
          {/* header row */}
          <div className="grid-row header-row">
            <div className="grid-cell header-cell empty-top-left"></div>
            {Array.from({ length: endCol }, (_, ci) => {
              const colIndex = ci + 1;
              const label = headers[colIndex - 1];
              return (
                <div
                  key={colIndex}
                  className={`grid-cell header-cell ${selectedCol === label ? "col-selected" : ""}`}
                  onDoubleClick={() => setSelectedCol(label)}
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
                  className={`grid-cell header-cell row-header ${selectedRow === rowIndex ? "row-selected" : ""}`}
                  onDoubleClick={() => setSelectedRow(rowIndex)}
                  style={{ top: `${rowIndex * 30}px`, height: "30px", width: "100px" }}
                >
                  {rowIndex}
                </div>
                {Array.from({ length: endCol }, (_, ci) => {
                  const colIndex = ci + 1;
                  if (colIndex < startCol || colIndex > endCol) return null;
                  const colLabel = headers[colIndex - 1];
                  const key = `${colLabel}${rowIndex}`;
                  const raw = cells[key];
                  const display = computeValue(key);
                  const isEditing = editing === key;
                  const highlight = selection.includes(key);
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
                        onMouseDown={startSelection}
                        onMouseEnter={extendSelection}
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
