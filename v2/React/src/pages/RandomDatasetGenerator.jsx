import { useState } from "react";
import axios from "axios";
import "../css/RandomDatasetGenerator.css";

export default function RandomDatasetGenerator() {
  const [file, setFile] = useState(null);
  const [rows, setRows] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError("Please upload a sample Excel file.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("rows", rows);

      const response = await axios.post("http://localhost:5000/generate-random", formData, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "RandomDataset.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError("Failed to generate random dataset.");
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div className="generator-container">
      <h2 className="title">Random Dataset Generator</h2>
      <form className="generator-form" onSubmit={handleSubmit}>
        <label className="file-label">
          Upload Sample Excel
          <input
            type="file"
            accept=".xlsx"
            onChange={(e) => setFile(e.target.files[0])}
          />
        </label>
        <label className="rows-label">
          Number of Rows
          <input
            type="number"
            min="1"
            max="100"
            value={rows}
            onChange={(e) => setRows(e.target.value)}
          />
        </label>
        <button type="submit" className="generate-btn" disabled={loading}>
          {loading ? "Generating..." : "Generate Random Dataset"}
        </button>
        {error && <p className="error-text">{error}</p>}
      </form>
    </div>
  );
}
