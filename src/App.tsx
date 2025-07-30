import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import "./App.css"; // Keep existing CSS or modify as needed

// Import your page components (will be created next)
import ConfigPage from "./pages/ConfigPage";
import TemplatePage from "./pages/TemplatePage";
import SendBulkPage from "./pages/SendBulkPage";
import HistoryPage from "./pages/HistoryPage";
import { invoke } from "@tauri-apps/api/core";

function App() {
  React.useEffect(() => {
    async function initDatabase() {
      try {
        await invoke('init_database_command'); // Removed as DB is initialized in setup
        console.log('Database initialized'); // Removed as DB is initialized in setup
      } catch (error) {
        console.error('Database error:', error);
      }
    }
    initDatabase();
  }, []);

  return (
    <Router>
      <div className="app-container">
        <aside className="sidebar">
          <nav>
            <ul>
              <li>
                <Link to="/config">Cấu hình</Link>
              </li>
              <li>
                <Link to="/templates">Template</Link>
              </li>
              <li>
                <Link to="/send-bulk">Gửi hàng loạt</Link>
              </li>
              <li>
                <Link to="/history">Lịch sử gửi</Link>
              </li>
            </ul>
          </nav>
        </aside>
        <main className="main-content">
          <Routes>
            <Route path="/config" element={<ConfigPage />} />
            <Route path="/templates" element={<TemplatePage />} />
            <Route path="/send-bulk" element={<SendBulkPage />} />
            <Route path="/history" element={<HistoryPage />} />
            {/* Default route or dashboard */}
            <Route path="/" element={<h2>Chào mừng đến với ứng dụng quản lý ZNS!</h2>} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
