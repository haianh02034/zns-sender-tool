import React, { useState, useEffect, ReactNode } from "react";
import { invoke } from "@tauri-apps/api/core";

interface Template {
  template_id: string;
  templateName: string;
  createdTime: number;
  status: string;
  templateQuality: string;
}

interface TemplateDetail {
  listButtons: any;
  listParams: any;
  previewUrl: string | undefined;
  templateTag: ReactNode;
  templateQuality: ReactNode;
  templateName: ReactNode;
  templateId: ReactNode;
  id?: number;
  template_id: string; // Changed to string
  template_id_text: string;
  template_name: string;
  fetched_at?: string;
  status: string;
  list_params: Array<{ name: string; require: boolean; type: string; maxLength: number; minLength: number; acceptNull: boolean; }>; // Changed to array of objects
  list_buttons: Array<{ type: number; title: string; content: string; }>; // Changed to array of objects
  timeout?: number;
  preview_url?: string;
  template_quality?: string;
  template_tag?: string;
  price?: number;
  apply_template_quota: boolean;
  reason?: string;
  content: string; // Raw JSON content
}

function formatDate(dateString: any) {
  const date = new Date(dateString);
  return date.toLocaleString('vi-VN');
}

function TemplatePage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedTemplateDetail, setSelectedTemplateDetail] = useState<TemplateDetail | null>(null);

  useEffect(() => {
    fetchCachedTemplates();
  }, []);

  const fetchCachedTemplates = async () => {
    setLoading(true);
    try {
      const result = await invoke<Template[]>("get_cached_templates");
      setTemplates(result);
      setMessage("Đã tải danh sách template từ cache.");
    } catch (error) {
      setMessage(`Lỗi khi tải template từ cache: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshTemplates = async () => {
    setLoading(true);
    setMessage("Đang làm mới danh sách template từ Zalo API...");
    try {
      const result = await invoke<Template[]>("fetch_and_cache_templates");
      setTemplates(result);
      setMessage("Danh sách template đã được làm mới thành công!");
    } catch (error) {
      setMessage(`Lỗi khi làm mới template từ Zalo API: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (template_id_str: string) => {
    setLoading(true);
    setMessage(`Đang tải chi tiết template ${template_id_str} từ Zalo API...`);
    try {
      // Directly call fetch_template_detail which also caches the data
      const detail = await invoke<TemplateDetail>("fetch_template_detail", { templateId: template_id_str });
      setSelectedTemplateDetail(detail);
      setMessage(`Đã tải chi tiết template ${template_id_str} từ Zalo API.`);
    } catch (error) {
      setMessage(`Lỗi khi tải chi tiết template ${template_id_str} từ Zalo API: ${error}`);
    } finally {
      setLoading(false);
    }
  };


  console.log("selectedTemplateDetail:", selectedTemplateDetail);
  return (
    <div className="template-page">
      <h2>Danh sách Template ZNS</h2>
      <button onClick={handleRefreshTemplates} disabled={loading}>
        {loading ? "Đang tải..." : "Làm mới từ Zalo API"}
      </button>
      {message && <p className="message">{message}</p>}

      {templates.length > 0 ? (
        <table>
          <thead>
            <tr>
              <th>id</th>
              <th>Name</th>
              <th>Trạng thái</th>
              <th>template_quality</th>
              <th>Thời gian tạo</th>
              <th>Xem chi tiết</th>
            </tr>
          </thead>
          <tbody>
            {templates.map((template) => (
              <tr key={template.template_id}>
                <td>{template.template_id}</td>
                <td>{template.templateName}</td>
                <td>{template.status}</td>
                <td>{template.templateQuality}</td>
                <td>{formatDate(template.createdTime)}</td>
                <td>
                  <button onClick={() => handleViewDetails(template.template_id)}>Xem</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        !loading && <p>Không có template nào. Vui lòng làm mới từ Zalo API.</p>
      )}

     {selectedTemplateDetail && (
        <div className="template-detail-overlay">
          <div className="template-detail-box">
            <button className="close-button" onClick={() => setSelectedTemplateDetail(null)}>X</button>
            <h3>Thông tin chi tiết Template</h3>
            <ul>
              <li><strong>Template ID:</strong> {selectedTemplateDetail.templateId}</li>
              <li><strong>Tên Template:</strong> {selectedTemplateDetail.templateName}</li>
              <li><strong>Trạng thái:</strong> {selectedTemplateDetail.status}</li>
              <li><strong>Lý do:</strong> {selectedTemplateDetail.reason}</li>
              <li><strong>Chất lượng:</strong> {selectedTemplateDetail.templateQuality}</li>
              <li><strong>Tag:</strong> {selectedTemplateDetail.templateTag}</li>
              <li><strong>Giá:</strong> {selectedTemplateDetail.price}</li>
              <li><strong>Thời gian hết hạn (ms):</strong> {selectedTemplateDetail.timeout}</li>
              <li><strong>URL xem trước:</strong> <a href={selectedTemplateDetail.previewUrl} target="_blank" rel="noreferrer">Xem</a></li>
            </ul>

            <h4>Danh sách Tham số (Params):</h4>
            {selectedTemplateDetail.listParams?.length ? (
              <ul>
                {selectedTemplateDetail.listParams.map((param: { name: string | number | boolean | React.ReactElement<any, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | null | undefined; type: any; require: any; minLength: string | number | boolean | React.ReactElement<any, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | null | undefined; maxLength: string | number | boolean | React.ReactElement<any, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | null | undefined; }, index: React.Key | null | undefined) => (
                  <li key={index}>
                    <strong>{param.name}</strong> – Loại: {param.type || "Không rõ"}, Bắt buộc: {param.require ? 'Có' : 'Không'}, Giới hạn: {param.minLength}–{param.maxLength}
                  </li>
                ))}
              </ul>
            ) : (
              <p>Không có tham số.</p>
            )}

            <h4>Danh sách Nút (Buttons):</h4>
            {selectedTemplateDetail.listButtons?.length ? (
              <ul>
                {selectedTemplateDetail.listButtons.map((btn: { title: string | number | boolean | React.ReactElement<any, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | null | undefined; content: string | number | boolean | React.ReactElement<any, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | null | undefined; type: string | number | boolean | React.ReactElement<any, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | null | undefined; }, index: React.Key | null | undefined) => (
                  <li key={index}>
                    <strong>{btn.title}</strong>: {btn.content} (Loại: {btn.type})
                  </li>
                ))}
              </ul>
            ) : (
              <p>Không có nút.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default TemplatePage;
