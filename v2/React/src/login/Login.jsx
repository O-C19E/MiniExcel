import { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

export default function Login() {
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = "hidden"; // disable scroll

    return () => {
      document.body.style.overflow = originalStyle; // restore on unmount
    };
  }, []);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleLogin = async (e) => {
  e.preventDefault();
  setError("");
  setSuccess("");

  try {
    const res = await axios.post("http://localhost:5000/login", { username, password });

    if (res.data.message === "Login successful") {
      localStorage.setItem("loggedInUser", username); // persist login
      setSuccess("Login successful! Redirecting...");
      window.location.href = "/dashboard";
    } else {
      setError("Login failed");
    }
  } catch (err) {
    setError(err.response?.data?.error || "Login failed");
  }
};

  return (
    <div
      style={{
        height: "100vh",
        width: "100vw",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #74ABE2, #5563DE)",
        fontFamily: "Segoe UI, sans-serif",
      }}
    >
      <div
        style={{
          width: "400px",
          background: "white",
          padding: "30px",
          borderRadius: "10px",
          boxShadow: "0 8px 20px rgba(0,0,0,0.2)",
        }}
      >
        <h2 style={{ textAlign: "center", marginBottom: "20px" }}>Login</h2>
        <form onSubmit={handleLogin}>
          <label style={{ display: "block", marginBottom: "10px" }}>
            Username:
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                border: "1px solid #ccc",
                borderRadius: "6px",
                marginTop: "5px",
              }}
            />
          </label>

          <label style={{ display: "block", marginBottom: "15px" }}>
            Password:
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                border: "1px solid #ccc",
                borderRadius: "6px",
                marginTop: "5px",
              }}
            />
          </label>

          {error && (
            <p style={{ color: "red", textAlign: "center", marginBottom: "10px" }}>
              {error}
            </p>
          )}
          {success && (
            <p style={{ color: "green", textAlign: "center", marginBottom: "10px" }}>
              {success}
            </p>
          )}

          <button
            type="submit"
            style={{
              width: "100%",
              padding: "12px",
              border: "none",
              borderRadius: "6px",
              backgroundColor: "#5563DE",
              color: "white",
              fontSize: "16px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            Login
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: "15px" }}>
          Don't have an account?{" "}
          <Link to="/register" style={{ color: "#5563DE", fontWeight: "bold" }}>
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
