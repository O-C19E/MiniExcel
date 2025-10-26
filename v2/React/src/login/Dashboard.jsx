import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";

export default function Dashboard({ setCells }) {
  const navigate = useNavigate();
  const username = localStorage.getItem("loggedInUser") || "";

  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!username) navigate("/login");
    else fetchFiles();
  }, [username, navigate]);

  const fetchFiles = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/files?username=${username}`);
      setFiles(res.data.files);
      setError("");
    } catch {
      setError("Failed to fetch files");
    }
  };

  // --- Upload file with PIN ---
  const handleUploadFile = async () => {
    if (!selectedFile) return setError("No file selected");

    const userPin = prompt("Enter your 6-digit PIN to upload this file:");
    if (!userPin || userPin.length !== 6) return setError("Invalid PIN");

    const formData = new FormData();
    formData.append("username", username);
    formData.append("pin", userPin);
    formData.append("file", selectedFile);

    try {
      const res = await axios.post("http://localhost:5000/upload-file", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert(res.data.message);
      setSelectedFile(null);
      fetchFiles();
      setError("");
    } catch (err) {
      setError(err.response?.data?.error || "Upload failed");
    }
  };

  // --- Open file with PIN and import into Excel state ---
  const handleOpenFile = async (fileName) => {
    setError(""); // clear previous error

    const userPin = prompt("Enter your 6-digit PIN to access this file:");
    if (!userPin || userPin.length !== 6) {
      setError("Invalid PIN");
      return;
    }

    try {
      // Verify PIN
      const verifyRes = await axios.post("http://localhost:5000/verify-pin", {
        username,
        pin: userPin,
      });

      if (verifyRes.data.message !== "PIN verified") {
        setError("Incorrect PIN");
        return;
      }

      // Download file
      const fileRes = await axios.get(
        `http://localhost:5000/download-file?username=${username}&fileName=${fileName}`,
        { responseType: "arraybuffer" }
      );

      // Parse XLSX
      const data = new Uint8Array(fileRes.data);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      // Convert to Excel cells
      // Convert to Excel cells
      const importedCells = {};
      json.forEach((row, r) => {
        row.forEach((cell, c) => {
          if (cell !== null && cell !== undefined && cell !== "") {
            const colLabel = String.fromCharCode(65 + c);
            importedCells[`${colLabel}${r + 1}`] = {
              value: cell,
              style: {
                fontFamily: "Calibri",
                fontSize: 14,
                textAlign: "left",
              },
            };
          }
        });
      });

      // Update Excel state
      setCells(importedCells);
      localStorage.setItem("miniExcelCells_v2", JSON.stringify(importedCells));
      setError("");
      alert(`✅ Access granted and file imported: ${fileName}`);
      setTimeout(() => navigate("/"))
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "PIN verification failed");
    }
  };

  return (
    <div style={{
      padding: "30px",
      fontFamily: "'Segoe UI', sans-serif",
      minHeight: "100vh",
      background: "#f0f4ff",
      display: "flex",
      flexDirection: "column",
      alignItems: "center"
    }}>
      <h2 style={{ marginBottom: "20px", color: "#333" }}>Welcome [ {username} ] </h2>

      <div style={{
        marginBottom: "30px",
        display: "flex",
        alignItems: "center",
        gap: "10px"
      }}>
        <input
          type="file"
          accept=".xlsx"
          onChange={(e) => setSelectedFile(e.target.files[0])}
          style={{
            padding: "8px",
            borderRadius: "6px",
            border: "1px solid #ccc",
            fontSize: "14px"
          }}
        />
        <button
          onClick={handleUploadFile}
          style={{
            padding: "10px 16px",
            backgroundColor: "#3748dfff",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "bold",
            transition: "background 0.2s"
          }}
          onMouseOver={(e) => (e.target.style.backgroundColor = "#4350b3")}
          onMouseOut={(e) => (e.target.style.backgroundColor = "#3748dfff")}
        >
          Upload File
        </button>
      </div>

      {error && <p style={{ color: "red", marginBottom: "20px" }}>{error}</p>}

      <h3 style={{ marginBottom: "15px" }}>Your Excel Files:</h3>
      <ul style={{
        listStyle: "none",
        padding: 0,
        display: "flex",
        flexWrap: "wrap",
        gap: "15px",
        justifyContent: "center"
      }}>
        {files.map((file) => (
          <li key={file}>
            <button
              onClick={() => handleOpenFile(file)}
              style={{
                background: "#0f71d2ff",
                color: "white",
                padding: "10px 16px",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: "bold",
                transition: "background 0.2s"
              }}
              onMouseOver={(e) => (e.target.style.backgroundColor = "#5d92d6")}
              onMouseOut={(e) => (e.target.style.backgroundColor = "#0f71d2ff")}
            >
              {file}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
