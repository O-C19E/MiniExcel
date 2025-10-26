import { useState, useEffect } from "react";
import { createBrowserRouter, RouterProvider } from "react-router";
import Login from "../login/Login.jsx";
import Excel from "./Excel.jsx";
import Home from "../pages/Home.jsx";
import RDG from "../pages/RDG.jsx";
import Layout from "../pages/Layout.jsx";
import Register from "../login/Register.jsx";
import Dashboard from "../login/Dashboard.jsx";

export default function App() {
  const [cells, setCells] = useState({});
  const [loaded, setLoaded] = useState(false); 
  const [loggedInUser, setLoggedInUser] = useState(""); 

  // Load saved cells
  useEffect(() => {
    const saved = localStorage.getItem("miniExcelCells_v2");
    if (saved) setCells(JSON.parse(saved));

    // Load logged-in user
    const storedUser = localStorage.getItem("loggedInUser");
    if (storedUser) setLoggedInUser(storedUser);

    setLoaded(true); 
  }, []);

  // Save cells
  useEffect(() => {
    if (!loaded) return; 
    if (Object.keys(cells).length > 0) {
      const t = setTimeout(() => {
        localStorage.setItem("miniExcelCells_v2", JSON.stringify(cells));
      }, 200);
      return () => clearTimeout(t);
    } else {
      localStorage.removeItem("miniExcelCells_v2");
    }
  }, [cells, loaded]);

  const updateCell = (key, value) => {
    setCells((prev) => {
      const copy = { ...prev };
      if (!value || value === "") delete copy[key];
      else copy[key] = value;
      return copy;
    });
  };

  const clearCells = () => {
    setCells({});
  };

  const router = createBrowserRouter([
    {
      element: (
        <Layout
          cells={cells}
          setCells={setCells}
          clearCells={clearCells}
          loggedInUser={loggedInUser} 
          setLoggedInUser={setLoggedInUser}
        />
      ),
      children: [
        { path: "/", element: <Home /> },
        { path: "/help", element: <RDG /> },
        { path: "/login", element: <Login setLoggedInUser={setLoggedInUser} />},
        { path: "/register", element: <Register />},
        { path: "/dashboard", element: <Dashboard setCells={setCells}  /> }
      ],
    },
  ]);

  return (
    <>
      <RouterProvider router={router} />
      <Excel cells={cells} updateCell={updateCell} />
    </>
  );
}
