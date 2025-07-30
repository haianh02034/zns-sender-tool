import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";

interface SendLog {
  id?: number;
  phone: string;
  template_id: string;
  variables?: string; // JSON string
  status?: string;
  error?: string;
  sent_at?: string;
}

function HistoryPage() {
  const [logs, setLogs] = useState<SendLog[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Filter states
  const [filterPhone, setFilterPhone] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");

  useEffect(() => {
    fetchSendLogs();
  }, [filterPhone, filterStatus, filterStartDate, filterEndDate]); // Re-fetch on filter change

  const fetchSendLogs = async () => {
    setLoading(true);
    try {
      const result = await invoke<SendLog[]>("get_send_logs", {
        phone: filterPhone || null,
        status: filterStatus || null,
        startDate: filterStartDate || null,
        endDate: filterEndDate || null,
      });
      setLogs(result);
      setMessage(`Đã tải ${result.length} lịch sử gửi.`);
    } catch (error) {
      setMessage(`Lỗi khi tải lịch sử gửi: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="history-page">
      <h2>Lịch sử gửi tin nhắn ZNS</h2>

      <div className="filters">
        <input
          type="text"
          placeholder="Lọc theo SĐT"
          value={filterPhone}
          onChange={(e) => setFilterPhone(e.target.value)}
        />
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">Tất cả trạng thái</option>
          <option value="success">Thành công</option>
          <option value="failed">Thất bại</option>
        </select>
        <input
          type="date"
          placeholder="Từ ngày"
          value={filterStartDate}
          onChange={(e) => setFilterStartDate(e.target.value)}
        />
        <input
          type="date"
          placeholder="Đến ngày"
          value={filterEndDate}
          onChange={(e) => setFilterEndDate(e.target.value)}
        />
        <button onClick={fetchSendLogs} disabled={loading}>
          {loading ? "Đang tải..." : "Lọc"}
        </button>
      </div>

      {message && <p className="message">{message}</p>}

      {logs.length > 0 ? (
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>SĐT</th>
              <th>Template ID</th>
              <th>Biến</th>
              <th>Trạng thái</th>
              <th>Lỗi</th>
              <th>Thời gian gửi</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td>{log.id}</td>
                <td>{log.phone}</td>
                <td>{log.template_id}</td>
                <td>{log.variables ? JSON.stringify(log.variables) : "N/A"}</td>
                <td>{log.status}</td>
                <td>{log.error || "N/A"}</td>
                <td>{log.sent_at ? new Date(log.sent_at).toLocaleString() : "N/A"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        !loading && <p>Không có lịch sử gửi nào.</p>
      )}
    </div>
  );
}

export default HistoryPage;
