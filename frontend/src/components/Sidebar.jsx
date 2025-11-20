import React from "react";
import { FaChartLine, FaHome, FaMoon } from "react-icons/fa";

const Sidebar = ({ onToggleDark }) => {
  return (
    <div
      className="d-flex flex-column p-3 text-white"
      style={{
        width: "260px",
        height: "100vh",
        background: "#1d1f29",
        position: "fixed",
        left: 0,
        top: 0,
      }}
    >
      <h3 className="text-center mb-4">🏡 Real Estate AI</h3>

      <ul className="nav nav-pills flex-column mb-auto">
        <li className="nav-item mb-3">
          <span className="nav-link text-white">
            <FaHome className="me-2" />
            Dashboard
          </span>
        </li>

        <li className="nav-item mb-3">
          <span className="nav-link text-white">
            <FaChartLine className="me-2" />
            Analysis
          </span>
        </li>
      </ul>

      <hr />

      <button
        onClick={onToggleDark}
        className="btn btn-outline-light w-100 mt-auto"
      >
        <FaMoon className="me-2" />
        Dark Mode
      </button>
    </div>
  );
};

export default Sidebar;
