import Nav from "./Nav.jsx";
import { Outlet } from "react-router";

export default function Layout({ cells, setCells, clearCells }) {
  return (
    <>
      <Nav cells={cells} setCells={setCells} clearCells={clearCells} />
      <Outlet />
    </>
  );
}