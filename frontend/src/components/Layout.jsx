import React from "react";
import { Link } from "react-router-dom";

const Layout = ({ children }) => {
  return (
    <div className="flex h-screen bg-gray-100">

      {/* SIDEBAR */}
      <aside className="w-64 bg-[#0F172A] text-white p-5 flex flex-col">

        <h1 className="text-2xl font-bold mb-6">Productr 🧩</h1>

        <input
          type="text"
          placeholder="Search"
          className="w-full p-2 rounded bg-[#1E293B] border border-[#334155] text-white placeholder-gray-400 mb-6"
        />

        <nav className="flex flex-col gap-4 text-gray-300">
          <Link
            to="/dashboard"
            className="text-left hover:text-white transition flex items-center gap-2 px-3 py-2 rounded-md hover:bg-[#1E293B]"
          >
            🏠 Home
          </Link>

          <Link
            to="/products"
            className="text-left hover:text-white transition flex items-center gap-2 px-3 py-2 rounded-md hover:bg-[#1E293B]"
          >
            📦 Products
          </Link>
        </nav>

      </aside>

      {/* MAIN CONTENT HERE */}
      <main className="flex-1 p-10">{children}</main>
    </div>
  );
};

export default Layout;