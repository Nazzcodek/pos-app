import React from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import "../../styles/Layout.css";

const Layout = ({ children }) => {
  return (
    <div className="layout">
      {/* Header */}
      <Header />

      {/* Layout content */}
      <div className="layout-content">
        <Sidebar />
        <main
          className="main-content"
          style={{ paddingTop: "64px" }} // Fixed padding for the header height
        >
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
