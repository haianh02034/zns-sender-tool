import React, { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";

interface Config {
  id?: number;
  app_id: string;
  app_secret: string;
  refresh_token: string;
  access_token?: string;
  access_token_expires_at?: string;
}

function ConfigPage() {
  const [config, setConfig] = useState<Config>({
    app_id: "",
    app_secret: "",
    refresh_token: "",
  });
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const result = await invoke<Config | null>("get_config");
      if (result) {
        setConfig(result);
      }
    } catch (error) {
      setMessage(`Error fetching config: ${error}`);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await invoke("save_config", {
        appId: config.app_id,
        appSecret: config.app_secret,
        refreshToken: config.refresh_token,
      });
      setMessage("Cấu hình đã được lưu thành công!");
      fetchConfig(); // Re-fetch to show updated state
    } catch (error) {
      setMessage(`Lỗi khi lưu cấu hình: ${error}`);
    }
  };

  const handleRefreshAccessToken = async () => {
    try {
      const token = await invoke<string>("check_and_refresh_token");
      setMessage(`Access Token đã được làm mới: ${token}`);
      fetchConfig(); // Re-fetch to show updated state
    } catch (error) {
      setMessage(`Lỗi khi làm mới Access Token: ${error}`);
    }
  };

  return (
    <div className="config-page">
      <h2>Cấu hình Zalo OA</h2>
      <form onSubmit={handleSave}>
        <div className="form-group">
          <label htmlFor="app_id">App ID:</label>
          <input
            id="app_id"
            type="text"
            value={config.app_id}
            onChange={(e) => setConfig({ ...config, app_id: e.target.value })}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="app_secret">App Secret:</label>
          <input
            id="app_secret"
            type="text"
            value={config.app_secret}
            onChange={(e) => setConfig({ ...config, app_secret: e.target.value })}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="refresh_token">Refresh Token:</label>
          <input
            id="refresh_token"
            type="text"
            value={config.refresh_token}
            onChange={(e) => setConfig({ ...config, refresh_token: e.target.value })}
            required
          />
        </div>
        <button type="submit">Lưu Cấu hình</button>
      </form>

      {message && <p className="message">{message}</p>}

      <div className="current-token-info">
        <h3>Thông tin Access Token hiện tại:</h3>
        <p>Access Token: {config.access_token || "Chưa có"}</p>
        <p>Hết hạn vào: {config.access_token_expires_at || "Không rõ"}</p>
        <button onClick={handleRefreshAccessToken}>Làm mới Access Token</button>
      </div>
    </div>
  );
}

export default ConfigPage;
