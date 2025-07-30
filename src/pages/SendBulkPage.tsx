import { useState, useCallback, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useDropzone } from "react-dropzone";
import * as XLSX from "xlsx"; // For Excel files
import Papa from "papaparse"; // For CSV files

interface Template {
  template_id: string;
  templateName: string;
}

interface TemplateDetail {
  id?: number;
  templateId: number;
  template_id_text?: string;
  templateName: string;
  fetched_at?: string;
  status: string;
  listParams: Array<{ name: string; require: boolean; type: string; maxLength: number; minLength: number; acceptNull: boolean; }>;
  listButtons: Array<any>; // You might want to define a more specific interface for buttons if needed
  timeout?: number;
  previewUrl?: string;
  templateQuality?: string;
  templateTag?: string;
  price?: number;
  applyTemplateQuota: boolean;
  reason?: string;
  content?: string;
}

interface ZnsSendRequest {
  phone: string;
  template_id: string;
  variables: { [key: string]: string };
  retry_count: number;
}

interface SendZnsStatus {
  phone: string;
  success: boolean;
  error: string | null;
  tracking_id: string;
}

function SendBulkPage() {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ZnsSendRequest[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [selectedTemplateDetail, setSelectedTemplateDetail] = useState<TemplateDetail | null>(null);
  const [sendingResults, setSendingResults] = useState<SendZnsStatus[]>([]);
  const [sentCount, setSentCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setMessage(""); // Clear previous messages
    try {
      const result = await invoke<Template[]>("get_cached_templates");
      setTemplates(result);
      if (result.length === 0) {
        setMessage("Không tìm thấy template nào. Vui lòng tạo template trước.");
      }
      // Do NOT set selectedTemplateId here. User will select it manually.
    } catch (error) {
      console.error("Error fetching templates:", error);
      setMessage(`Lỗi khi tải template: ${error}`);
    }
  };

  // New useEffect to fetch template detail only when selectedTemplateId changes
  useEffect(() => {
    if (selectedTemplateId) {
      fetchTemplateDetail(selectedTemplateId);
    } else {
      setSelectedTemplateDetail(null); // Clear detail if no template is selected
      setMessage(""); // Clear message when no template is selected
    }
  }, [selectedTemplateId]);

  const fetchTemplateDetail = async (templateId: string) => {
    console.log(`Fetching template detail for ${templateId}`);
    setMessage(""); // Clear previous messages
    try {
      const detail = await invoke<TemplateDetail>("fetch_template_detail", { templateId });
      setSelectedTemplateDetail(detail);
    } catch (error) {
      // console.error(`Error fetching template detail for ${templateId}:`, error);
      // setMessage(`Lỗi khi tải chi tiết template: ${error}`);
      setSelectedTemplateDetail(null); // Clear detail on error
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const selectedFile = acceptedFiles[0];
      setFile(selectedFile);
      setMessage(`Đã chọn file: ${selectedFile.name}`);
      parseFile(selectedFile);
    }
  }, [selectedTemplateId, selectedTemplateDetail]); // Add dependencies

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const normalizePhoneNumber = (phone: string): string => {
    if (phone.startsWith("0")) {
      return "84" + phone.substring(1);
    }
    return phone;
  };

  const parseFile = (file: File) => {
    if (!selectedTemplateDetail) {
      setMessage("Vui lòng chọn một template trước khi tải file.");
      setFile(null);
      setParsedData([]);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target?.result;
      if (!data) {
        setMessage("Không thể đọc file.");
        return;
      }

      let items: ZnsSendRequest[] = [];
      const expectedParams = selectedTemplateDetail.listParams.map((p: { name: string }) => p.name);

      if (file.name.endsWith(".txt")) {
        const lines = (data as string).split(/\r?\n/).filter(line => line.trim() !== '');
        items = lines.map((line, index) => {
          const fields = line.split('|');
          if (fields.length !== expectedParams.length + 1) { // +1 for phone number
            console.warn(`Dòng ${index + 1} không khớp số lượng trường. Bỏ qua.`);
            return null;
          }

          const phone = normalizePhoneNumber(fields[0].trim());
          const variables: { [key: string]: string } = {};
          for (let i = 0; i < expectedParams.length; i++) {
            variables[expectedParams[i]] = fields[i + 1].trim();
          }

          return {
            phone,
            template_id: selectedTemplateId,
            variables,
            retry_count: 0,
          };
        }).filter(item => item !== null) as ZnsSendRequest[];
      } else if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
        const workbook = XLSX.read(data, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json<any>(worksheet);

        items = json.map((row) => {
          const phone = normalizePhoneNumber(String(row.phone || "").trim());
          const variables: { [key: string]: string } = {};
          expectedParams.forEach(param => {
            if (row[param] !== undefined) {
              variables[param] = String(row[param]).trim();
            }
          });
          return {
            phone,
            template_id: selectedTemplateId,
            variables,
            retry_count: 0,
          };
        });
      } else if (file.name.endsWith(".csv")) {
        Papa.parse(data as string, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            items = results.data.map((row: any) => {
              const phone = normalizePhoneNumber(String(row.phone || "").trim());
              const variables: { [key: string]: string } = {};
              expectedParams.forEach(param => {
                if (row[param] !== undefined) {
                  variables[param] = String(row[param]).trim();
                }
              });
              return {
                phone,
                template_id: selectedTemplateId,
                variables,
                retry_count: 0,
              };
            });
            setParsedData(items);
            setMessage(`Đã parse ${items.length} dòng từ file.`);
          },
          error: (err: any) => {
            setMessage(`Lỗi khi parse CSV: ${err.message}`);
          },
        });
        return; // PapaParse is async, so return here
      } else {
        setMessage("Định dạng file không được hỗ trợ. Vui lòng chọn .txt, Excel (.xlsx, .xls) hoặc CSV (.csv).");
        setFile(null);
        setParsedData([]);
        return;
      }
      setParsedData(items);
      setMessage(`Đã parse ${items.length} dòng từ file.`);
    };

    if (file.name.endsWith(".txt")) {
      reader.readAsText(file); // Read as text for .txt files
    } else {
      reader.readAsBinaryString(file);
    }
  };

  const handleSend = async (dataToSend: ZnsSendRequest[] = parsedData) => {
    if (dataToSend.length === 0) {
      setMessage("Không có dữ liệu để gửi. Vui lòng tải lên một file.");
      return;
    }
    if (!selectedTemplateId) {
      setMessage("Vui lòng chọn một template.");
      return;
    }

    setLoading(true);
    setTotalCount(dataToSend.length);
    setSentCount(0);
    setSendingResults([]);
    setMessage(`Đang gửi ${dataToSend.length} tin nhắn ZNS...`); // Set initial sending message

    try {
      const results = await invoke<SendZnsStatus[]>("send_bulk_zns", { data: dataToSend });
      setSendingResults(results);
      setSentCount(results.length);

      const failedCount = results.filter(r => !r.success).length;
      const successCount = results.filter(r => r.success).length;

      setMessage(`Quá trình gửi hoàn tất. Thành công: ${successCount}, Thất bại: ${failedCount}.`);
      
      // Optionally save batch upload log
      await invoke("save_batch_upload_log", {
        filename: file?.name || "manual_upload",
        totalSent: results.length,
        totalSuccess: successCount,
        totalFailed: failedCount,
      });

    } catch (error) {
      setMessage(`Lỗi trong quá trình gửi: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRetryFailed = () => {
    const failedRequests = sendingResults
      .filter(r => !r.success && (parsedData.find(pd => pd.phone === r.phone && pd.template_id === selectedTemplateId)?.retry_count || 0) < 3)
      .map(r => {
        const originalRequest = parsedData.find(pd => pd.phone === r.phone && pd.template_id === selectedTemplateId);
        return {
          ...originalRequest!, // Use non-null assertion as we filter based on parsedData
          retry_count: (originalRequest?.retry_count || 0) + 1,
        };
      });

    if (failedRequests.length > 0) {
      setMessage(`Đang thử lại ${failedRequests.length} tin nhắn thất bại...`);
      handleSend(failedRequests);
    } else {
      setMessage("Không có tin nhắn nào để thử lại hoặc đã đạt giới hạn retry.");
    }
  };

  return (
    <div className="send-bulk-page">
      <h2>Gửi tin nhắn ZNS hàng loạt</h2>

      <div className="template-selection">
        <label htmlFor="template-select">Chọn Template:</label>
        <select
          id="template-select"
          value={selectedTemplateId}
          onChange={(e) => {
            setSelectedTemplateId(e.target.value);
            fetchTemplateDetail(e.target.value);
            setParsedData([]); // Clear parsed data when template changes
            setFile(null);
            setMessage("");
            setSendingResults([]);
          }}
          disabled={loading}
        >
          <option value="">-- Chọn Template --</option> {/* Add a default empty option */}
          {templates.map((template) => (
            <option key={template.template_id} value={template.template_id}>
              {template.templateName}
            </option>
          ))}
          </select>
      </div>

      {message && <p className="message-display">{message}</p>} {/* Always display messages */}

      {selectedTemplateDetail && (
        <>
          <div className="template-params-guide">
            <h3>Cấu trúc file mẫu cho Template "{selectedTemplateDetail.templateName}":</h3>
            <table>
              <thead>
                <tr>
                  <th>SĐT</th>
                  {(selectedTemplateDetail.listParams || []).map((p: { name: string }) => (
                    <th key={p.name}>{p.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>84901234567</td>
                  {(selectedTemplateDetail.listParams || []).map((p: { name: string }) => (
                    <td key={p.name}>Ví dụ {p.name}</td>
                  ))}
                </tr>
              </tbody>
            </table>
            <p>File .txt: Mỗi dòng là một bản ghi, các trường phân tách bằng dấu gạch đứng "|".</p>
            <p>File Excel/CSV: Cột đầu tiên là "phone", các cột tiếp theo là tên các tham số.</p>
            <p>Với cột SĐT bắt buộc là 84.</p>
          </div>

          <div className="template-params-details">
            <h3>Chi tiết tham số:</h3>
            <ul>
              {(selectedTemplateDetail.listParams || []).map((p: { name: string; type: string; require: boolean; minLength: number; maxLength: number; }) => (
                <li key={p.name}>
                  {p.name} – Loại: {p.type}, Bắt buộc: {p.require ? 'Có' : 'Không'}, Giới hạn: {p.minLength}–{p.maxLength}
                </li>
              ))}
            </ul>
          </div>

          <div {...getRootProps()} className={`dropzone ${isDragActive ? "active" : ""}`}>
            <input {...getInputProps()} />
            {isDragActive ? (
              <p>Thả file vào đây...</p>
            ) : (
              <p>Kéo & thả file .txt, Excel/CSV vào đây, hoặc click để chọn file</p>
            )}
          </div>
          {file && <p>File đã chọn: {file.name} ({parsedData.length} dòng dữ liệu)</p>}
          <button onClick={() => handleSend()} disabled={loading || parsedData.length === 0}>
            {loading ? "Đang gửi..." : "Gửi tin nhắn ZNS"}
          </button>
          {sendingResults.length > 0 && sendingResults.filter(r => !r.success).length > 0 && (
            <button onClick={handleRetryFailed} disabled={loading}>
              Thử lại các tin nhắn thất bại ({sendingResults.filter(r => !r.success).length})
            </button>
          )}

          {totalCount > 0 && (
            <div className="progress-section">
              <h3>Tiến độ gửi:</h3>
              <progress value={sentCount} max={totalCount}></progress>
              <p>{sentCount} / {totalCount} đã gửi</p>
            </div>
          )}

          {sendingResults.length > 0 && (
            <div className="sending-results">
              <h3>Kết quả gửi:</h3>
              <table>
                <thead>
                  <tr>
                    <th>SĐT</th>
                    <th>Tracking ID</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {sendingResults.map((r, idx) => (
                    <tr key={idx}>
                      <td>{r.phone}</td>
                      <td>{r.tracking_id}</td>
                      <td>{r.success ? "✅ Thành công" : `❌ ${r.error}`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {parsedData.length > 0 && sendingResults.length === 0 && ( // Only show preview if no sending results yet
            <div className="preview-data">
              <h3>Xem trước dữ liệu ({parsedData.length} dòng):</h3>
              <table>
                <thead>
                  <tr>
                    <th>SĐT</th>
                    <th>Template ID</th>
                    <th>Biến</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedData.slice(0, 10).map((item, index) => ( // Show first 10 rows
                    <tr key={index}>
                      <td>{item.phone}</td>
                      <td>{item.template_id}</td>
                      <td>{JSON.stringify(item.variables)}</td>
                    </tr>
                  ))}
                  {parsedData.length > 10 && (
                    <tr>
                      <td colSpan={3}>... và {parsedData.length - 10} dòng khác</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default SendBulkPage;
