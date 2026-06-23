import React, { useState, useEffect } from "react";
import { 
  Sparkles, 
  BookOpen, 
  FileText, 
  ToggleLeft, 
  Hammer, 
  Calculator, 
  Award, 
  ShieldAlert, 
  Download, 
  RefreshCw, 
  Copy, 
  Check, 
  AlertCircle,
  HelpCircle,
  FolderSync,
  User,
  GraduationCap,
  BarChart,
  Settings
} from "lucide-react";
import { InitiativeDraft, CalcRow } from "./types";
import { ACADEMIC_TEMPLATES } from "./data/templates";
import TitleGenerator from "./components/TitleGenerator";
import GapAnalysis from "./components/GapAnalysis";
import LogicBuilder from "./components/LogicBuilder";
import AutoCalculator from "./components/AutoCalculator";
import DraftScorer from "./components/DraftScorer";
import QualityChecker from "./components/QualityChecker";
import SectionHelper from "./components/SectionHelper";
import SuPhamChartGenerator from "./components/SuPhamChartGenerator";
import { writeFullInitiative } from "./services/geminiService";

export default function App() {
  // Main state houses the complete working scientific draft targeting Education only
  const [draft, setDraft] = useState<InitiativeDraft>({
    title: ACADEMIC_TEMPLATES[0].title,
    teacherName: "Nguyễn Thị Mai",
    domain: "Đổi mới giảng dạy tích hợp STEM",
    grade: "Lớp 6",
    subject: "Toán học",
    partA: ACADEMIC_TEMPLATES[0].partA,
    partB: ACADEMIC_TEMPLATES[0].partB,
    partC: ACADEMIC_TEMPLATES[0].partC,
    calcRows: []
  });

  const [activeTab, setActiveTab] = useState<"workspace" | "titles" | "gap" | "logic" | "calculator" | "scorer" | "quality" | "charts">("workspace");
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  // Auto AI Generation states
  const [autoWritingLoading, setAutoWritingLoading] = useState(false);
  const [autoWritingError, setAutoWritingError] = useState("");

  // Load initial API Keys from GEMINI_API_KEYS or GEMINI_API_KEY
  const getInitialApiKeysInput = () => {
    const savedKeys = localStorage.getItem("GEMINI_API_KEYS");
    if (savedKeys) {
      try {
        const parsed = JSON.parse(savedKeys);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.join("\n");
        }
      } catch (e) {
        // ignore
      }
    }
    return localStorage.getItem("GEMINI_API_KEY") || "";
  };

  const hasConfiguredKeys = () => {
    const savedKeys = localStorage.getItem("GEMINI_API_KEYS");
    if (savedKeys) {
      try {
        const parsed = JSON.parse(savedKeys);
        if (Array.isArray(parsed) && parsed.filter(k => k.trim() && k !== "MY_GEMINI_API_KEY").length > 0) {
          return true;
        }
      } catch (e) {}
    }
    const savedKey = localStorage.getItem("GEMINI_API_KEY");
    return !!(savedKey && savedKey.trim() !== "" && savedKey !== "MY_GEMINI_API_KEY");
  };

  // Settings Modal and API Key States
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState(getInitialApiKeysInput());
  const [selectedModel, setSelectedModel] = useState(localStorage.getItem("GEMINI_MODEL") || "gemini-3-flash-preview");
  const [keyErrorMsg, setKeyErrorMsg] = useState("");

  useEffect(() => {
    if (!hasConfiguredKeys()) {
      setShowSettingsModal(true);
    }
  }, []);

  const handleSaveSettings = () => {
    if (!apiKeyInput.trim()) {
      setKeyErrorMsg("Vui lòng điền ít nhất một API Key để tiếp tục sử dụng ứng dụng.");
      return;
    }

    const keys = apiKeyInput
      .split(/[\n,]+/)
      .map(k => k.trim())
      .filter(k => k.length > 0 && k !== "MY_GEMINI_API_KEY");

    if (keys.length === 0) {
      setKeyErrorMsg("Vui lòng nhập ít nhất một API Key hợp lệ.");
      return;
    }

    localStorage.setItem("GEMINI_API_KEYS", JSON.stringify(keys));
    localStorage.setItem("GEMINI_API_KEY", keys[0]);
    localStorage.setItem("GEMINI_MODEL", selectedModel);
    setKeyErrorMsg("");
    setShowSettingsModal(false);
  };

  // Template handling
  const handleSelectTemplate = (tpl: any) => {
    setDraft({
      title: tpl.title,
      teacherName: draft.teacherName || "Nguyễn Thị Mai",
      domain: tpl.domain,
      grade: draft.grade || "Lớp 6",
      subject: draft.subject || "Toán học",
      partA: tpl.partA,
      partB: tpl.partB,
      partC: tpl.partC,
      calcRows: []
    });
  };

  const handleFieldChange = (key: keyof InitiativeDraft, value: any) => {
    setDraft(prev => ({ ...prev, [key]: value }));
  };

  // Callback to update rows from AutoCalculator
  const handleUpdateCalcRows = (newRows: CalcRow[]) => {
    setDraft(prev => ({ ...prev, calcRows: newRows }));
  };

  // Trigger when AI suggests an improved passage for parts A/B/C
  const handleApplyImprovement = (section: "partA" | "partB" | "partC", improvedText: string) => {
    handleFieldChange(section, improvedText);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(label);
    setTimeout(() => {
      setCopiedSection(null);
    }, 2500);
  };

  // Generate complete final document download as TXT
  const downloadDocument = () => {
    const docText = `========================================================
BÁO CÁO SÁNG KIẾN KINH NGHIỆM GIÁO DỤC ĐẠT GIẢI QUỐC GIA
========================================================

TÊN GIÁO VIÊN: ${draft.teacherName.toUpperCase()}
TÊN ĐỀ TÀI / SÁNG KIẾN: ${draft.title.toUpperCase()}
LỚP HỌC: ${draft.grade}
MÔN HỌC: ${draft.subject}
LĨNH VỰC ÁP DỤNG: ${draft.domain}

--------------------------------------------------------
PHẦN A: ĐẶT VẤN ĐỀ (Bối cảnh & Thực trạng học đường)
--------------------------------------------------------
${draft.partA}

--------------------------------------------------------
PHẦN B: GIẢI QUYẾT VẤN ĐỀ (Các biện pháp sư phạm chi tiết)
--------------------------------------------------------
${draft.partB}

--------------------------------------------------------
PHẦN C: MINH CHỨNG & HIỆU QUẢ SÁNG KIẾN (Trực quan & Khảo sát)
--------------------------------------------------------
${draft.partC}

========================================================
Kiến tạo bởi Trợ lý viết sáng kiến - Phiên bản chuyên biệt ngành Giáo dục
========================================================`;

    const blob = new Blob([docText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `SANG_KIEN_GIAO_DUC-${draft.teacherName.replace(/\s+/g, "_")}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Generate complete final document download as DOCX (Office Open XML HTML Envelope)
  const downloadDocx = () => {
    const filename = `SANG_KIEN_GIAO_DUC-${draft.teacherName.replace(/\s+/g, "_")}.docx`;
    
    // Process markdown-like lines and paragraphs into clean MS Word markup
    const formatSectionHtml = (text: string) => {
      return text
        .split("\n")
        .map(line => {
          const trimmed = line.trim();
          if (!trimmed) return "<p class='space'></p>";
          if (trimmed.startsWith("###")) {
            return `<h3 style="font-family: 'Times New Roman'; font-size: 13pt; font-weight: bold; margin-top: 10pt; margin-bottom: 4pt; color: #000000; text-align: left;">${trimmed.replace(/^###\s*/, "")}</h3>`;
          }
          if (trimmed.startsWith("##")) {
            return `<h2 style="font-family: 'Times New Roman'; font-size: 14pt; font-weight: bold; margin-top: 14pt; margin-bottom: 6pt; color: #000000; text-align: left;">${trimmed.replace(/^##\s*/, "")}</h2>`;
          }
          if (trimmed.startsWith("#")) {
            return `<h1 style="font-family: 'Times New Roman'; font-size: 16pt; font-weight: bold; text-align: center; text-transform: uppercase; margin-top: 20pt; margin-bottom: 10pt; color: #000000;">${trimmed.replace(/^#\s*/, "")}</h1>`;
          }
          if (trimmed.startsWith("-") || trimmed.startsWith("*")) {
            return `<li style="font-family: 'Times New Roman'; font-size: 13pt; margin-left: 20pt; margin-bottom: 4pt; text-align: justify;">${trimmed.replace(/^[-*]\s*/, "")}</li>`;
          }
          // Default justified paragraph with indentation
          return `<p style="font-family: 'Times New Roman'; font-size: 13pt; line-height: 1.45; text-indent: 0.5in; text-align: justify; margin-bottom: 8pt; margin-top: 0px;">${trimmed}</p>`;
        })
        .join("\n");
    };

    const partAHtml = formatSectionHtml(draft.partA);
    const partBHtml = formatSectionHtml(draft.partB);
    const partCHtml = formatSectionHtml(draft.partC);

    const docHtml = `
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8">
  <title>${draft.title}</title>
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <style>
    @page {
      size: 8.5in 11in;
      margin: 1.0in 1.0in 1.0in 1.0in;
      mso-header-margin: .5in;
      mso-footer-margin: .5in;
      mso-paper-source: 0;
    }
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 13pt;
      line-height: 1.45;
      color: #000000;
      margin: 0px;
    }
    .header-table {
      width: 100%;
      border: 1px solid #000000;
      border-collapse: collapse;
      margin-bottom: 24pt;
    }
    .header-table td {
      border: 1px solid #000000;
      padding: 10px;
      font-family: 'Times New Roman', serif;
      font-size: 11pt;
    }
    .logo-box {
      font-size: 14pt;
      font-weight: bold;
      text-align: center;
      background-color: #f1f5f9;
      padding: 12px;
      border-bottom: 1.5pt solid #000000;
    }
    .sec-title {
      font-family: 'Times New Roman', serif;
      font-size: 16pt;
      font-weight: bold;
      text-align: center;
      text-transform: uppercase;
      margin-top: 15pt;
      margin-bottom: 15pt;
      color: #1e3a8a;
    }
    .space {
      margin-bottom: 6pt;
      height: 1px;
    }
    .footer-note {
      text-align: center;
      font-size: 10pt;
      color: #4b5563;
      margin-top: 40pt;
      border-top: 1px solid #9ca3af;
      padding-top: 8px;
    }
  </style>
</head>
<body>
  <div class="logo-box">
    BÁO CÁO SÁNG KIẾN KINH NGHIỆM SƯ PHẠM ĐẠT GIẢI
  </div>
  <table class="header-table">
    <tr>
      <td width="30%"><b>Tác giả (Giáo viên):</b></td>
      <td width="70%">${draft.teacherName}</td>
    </tr>
    <tr>
      <td><b>Đề tài Sáng kiến:</b></td>
      <td><b>${draft.title}</b></td>
    </tr>
    <tr>
      <td><b>Lớp học:</b></td>
      <td>${draft.grade}</td>
    </tr>
    <tr>
      <td><b>Môn học:</b></td>
      <td>${draft.subject}</td>
    </tr>
    <tr>
      <td><b>Lĩnh vực áp dụng:</b></td>
      <td>${draft.domain}</td>
    </tr>
    <tr>
      <td><b>Thời gian xuất bản:</b></td>
      <td>Ngày ${new Date().getDate()} tháng ${new Date().getMonth() + 1} năm ${new Date().getFullYear()}</td>
    </tr>
  </table>

  <div class="sec-title">PHẦN A: ĐẶT VẤN ĐỀ</div>
  <div style="margin-bottom: 30pt;">
    ${partAHtml}
  </div>

  <br clear="all" style="page-break-before: always;" />

  <div class="sec-title">PHẦN B: GIẢI QUYẾT VẤN ĐỀ</div>
  <div style="margin-bottom: 30pt;">
    ${partBHtml}
  </div>

  <br clear="all" style="page-break-before: always;" />

  <div class="sec-title">PHẦN C: HIỆU QUẢ HOẠT ĐỘNG & MINH CHỨNG</div>
  <div style="margin-bottom: 30pt;">
    ${partCHtml}
  </div>

  <div class="footer-note">
    Hệ thống biên dịch kỹ thuật số của "Trợ lý viết sáng kiến" chuyên biệt Giáo dục & Đào tạo Việt Nam
  </div>
</body>
</html>
`;

    // Wrap the HTML content into XML / MsWord Blob
    const blob = new Blob(['\ufeff' + docHtml], {
      type: "application/msword;charset=utf-8"
    });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Call the AI writing API to automatically compose all three parts based on the specified title
  const handleAutoWriteInitiative = async () => {
    if (!draft.title || !draft.title.trim()) {
      setAutoWritingError("Vui lòng nhập hoặc chọn một Tên đề tài trước khi viết bài.");
      return;
    }
    
    setAutoWritingLoading(true);
    setAutoWritingError("");

    // Set temporary writing state
    setDraft(prev => ({
      ...prev,
      partA: "Đang soạn thảo Phần A (Đặt vấn đề)...",
      partB: "Đang soạn thảo Phần B (Giải quyết vấn đề)...",
      partC: "Đang soạn thảo Phần C (Hiệu quả hoạt động)..."
    }));

    try {
      const data = await writeFullInitiative(
        draft.title,
        draft.teacherName || "Nguyễn Thị Mai",
        draft.domain,
        draft.grade,
        draft.subject
      );
      if (data && data.partA && data.partB && data.partC) {
        setDraft(prev => ({
          ...prev,
          partA: data.partA,
          partB: data.partB,
          partC: data.partC
        }));
      } else {
        throw new Error("Dữ liệu phản hồi rỗng từ API.");
      }
    } catch (err: any) {
      const apiError = err.message || err || "Lỗi không xác định";
      setAutoWritingError(`Lỗi từ API: ${apiError}`);
      setDraft(prev => ({
        ...prev,
        partA: "Đã dừng do lỗi: " + apiError,
        partB: "Đã dừng do lỗi: " + apiError,
        partC: "Đã dừng do lỗi: " + apiError
      }));
    } finally {
      setAutoWritingLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col antialiased">
      {/* Header and Branding elements */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-100">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-extrabold text-slate-900 text-lg tracking-tight select-none">Trợ lý viết sáng kiến</h1>
                <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest bg-indigo-100 text-indigo-800 rounded-full">SƯ PHẠM</span>
              </div>
              <p className="text-xs text-slate-500">Chuyên nghiên cứu khoa học, đổi mới phương pháp giảng dạy & quản lý giáo dục</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end flex-wrap">
            <div className="flex flex-col items-end gap-1">
              <button
                onClick={() => setShowSettingsModal(true)}
                className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs h-[36px]"
              >
                <Settings className="w-3.5 h-3.5" /> Cấu hình API Key & Model
              </button>
              <a
                href="https://aistudio.google.com/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-red-600 hover:underline font-semibold"
              >
                Lấy API key để sử dụng app
              </a>
            </div>
            <button
              onClick={downloadDocument}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs h-[36px]"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" /> Xuất định dạng (.TXT)
            </button>
            <button
              onClick={downloadDocx}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md shadow-indigo-100 hover:scale-[1.02] h-[36px]"
            >
              <FileText className="w-3.5 h-3.5" /> Tải về file Word (.DOCX)
            </button>
          </div>
        </div>
      </header>

      {/* Main content stream */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Upper Core Instructional Hero */}
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 rounded-2xl p-6 text-white shadow-lg overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-slate-800 rounded-full opacity-10 transform translate-x-12 -translate-y-12"></div>
          <div className="absolute bottom-0 right-1/4 w-32 h-32 bg-indigo-500 rounded-full opacity-10 filter blur-2xl font-black"></div>
          
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-3">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 uppercase tracking-widest mb-3 border border-indigo-500/20">
                🏫 Thiết kế Đề tài Giáo dục Chuẩn mực
              </span>
              <h2 className="text-lg font-bold sm:text-xl text-indigo-100 leading-snug">
                Số hóa quy trình thẩm định, viết sáng kiến kinh nghiệm sư phạm và thiết lập hoạt động đổi mới dạy học
              </h2>
              <p className="text-slate-300 text-xs mt-2 leading-relaxed max-w-3xl">
                Tạo các lập luận khách quan bám sát Thông tư của Bộ GD&ĐT, phân tích khoảng trống học lực học sinh, tính toán định lượng thời gian tiết kiệm, đồng thời tích hợp khung chat AI hỗ trợ ý kiến chuyên nghiệp cho từng phần riêng biệt.
              </p>
            </div>
            
            <div className="md:col-span-1 flex items-center justify-start md:justify-end border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-6">
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-indigo-400 block tracking-widest">Tiêu chuẩn chấm đạt giải:</span>
                <p className="text-[11px] text-slate-200">✓ Tính sư phạm đổi mới thực chất</p>
                <p className="text-[11px] text-slate-200">✓ Có minh chứng cụ thể Before/After</p>
                <p className="text-[11px] text-slate-200">✓ Khả năng nhân rộng tại tỉnh/Sở</p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs - Bento Tools Area */}
        <div className="flex flex-wrap items-center bg-slate-200/50 p-1.5 rounded-xl gap-1">
          <button
            type="button"
            onClick={() => setActiveTab("workspace")}
            className={`px-4 py-2.5 rounded-lg text-xs font-bold tracking-tight transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "workspace" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <FileText className="w-4 h-4 text-indigo-500" />
            Cấu trúc Soạn thảo Sáng kiến
          </button>
          
          <button
            type="button"
            onClick={() => setActiveTab("titles")}
            className={`px-4 py-2.5 rounded-lg text-xs font-bold tracking-tight transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "titles" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Sparkles className="w-4 h-4 text-teal-500" />
            Thiết kế Tiêu đề AI
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("gap")}
            className={`px-4 py-2.5 rounded-lg text-xs font-bold tracking-tight transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "gap" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <ToggleLeft className="w-4 h-4 text-orange-500" />
            Phân tích GAP Học lực
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("logic")}
            className={`px-4 py-2.5 rounded-lg text-xs font-bold tracking-tight transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "logic" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Hammer className="w-4 h-4 text-blue-500" />
            Kiểm tra Logic Sư phạm
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("calculator")}
            className={`px-4 py-2.5 rounded-lg text-xs font-bold tracking-tight transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "calculator" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Calculator className="w-4 h-4 text-emerald-500" />
            Định lượng Thời gian & Chi phí học liệu
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("scorer")}
            className={`px-4 py-2.5 rounded-lg text-xs font-bold tracking-tight transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "scorer" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Award className="w-4 h-4 text-rose-500" />
            Thẩm định Chấm điểm AI
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("quality")}
            className={`px-4 py-2.5 rounded-lg text-xs font-bold tracking-tight transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "quality" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-rose-600" />
            Chống Trùng Lặp Giáo án
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("charts")}
            className={`px-4 py-2.5 rounded-lg text-xs font-bold tracking-tight transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "charts" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <BarChart className="w-4 h-4 text-teal-600" />
            Lập Biểu Đồ & Bảng Số Liệu
          </button>
        </div>

        {/* Tab Specific Content Area */}
        <div className="space-y-6">
          
          {/* TAB 1: WORKSPACE */}
          {activeTab === "workspace" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Left Edit Panels */}
              <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
                
                {/* 1. THÔNG TIN CHUNG SECTION */}
                <div className="bg-indigo-50/45 p-5 rounded-xl border border-indigo-100 space-y-4">
                  <div className="flex items-center gap-2 border-b border-indigo-100 pb-2">
                    <User className="w-4 h-4 text-indigo-600" />
                    <h3 className="font-bold text-indigo-950 text-sm uppercase tracking-wider">Thông Tin Chung Đề Tài</h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Teacher Name Input */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Tên Giáo viên biên soạn:</label>
                      <input
                        type="text"
                        value={draft.teacherName}
                        onChange={(e) => handleFieldChange("teacherName", e.target.value)}
                        className="w-full text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-lg px-3 py-2.5 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all h-[38px]"
                        placeholder="Ví dụ: Nguyễn Thị Mai, Phạm Văn Hải..."
                      />
                    </div>

                    {/* Class Selector (Grade 1 to 12 support) */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Chọn lớp học:</label>
                      <select
                        value={draft.grade}
                        onChange={(e) => handleFieldChange("grade", e.target.value)}
                        className="w-full text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-lg px-3 py-2 focus:border-indigo-500 outline-none transition-all h-[38px] cursor-pointer"
                      >
                        <option value="Mầm non">Mầm non (Trẻ 3-6 tuổi)</option>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((g) => (
                          <option key={g} value={`Lớp ${g}`}>{`Lớp ${g}`}</option>
                        ))}
                        <option value="Không phân lớp / Toàn trường">Không phân lớp / Toàn trường</option>
                      </select>
                    </div>

                    {/* Subject Selector */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Chọn môn học:</label>
                      <select
                        value={draft.subject}
                        onChange={(e) => handleFieldChange("subject", e.target.value)}
                        className="w-full text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-lg px-3 py-2 focus:border-indigo-500 outline-none transition-all h-[38px] cursor-pointer"
                      >
                        <option value="Toán học">Toán học</option>
                        <option value="Ngữ văn / Tiếng Việt">Ngữ văn / Tiếng Việt</option>
                        <option value="Tiếng Anh">Tiếng Anh</option>
                        <option value="Vật lí">Vật lí</option>
                        <option value="Hóa học">Hóa học</option>
                        <option value="Sinh học">Sinh học</option>
                        <option value="Khoa học tự nhiên">Khoa học tự nhiên</option>
                        <option value="Lịch sử">Lịch sử</option>
                        <option value="Địa lí">Địa lí</option>
                        <option value="Lịch sử & Địa lí">Lịch sử & Địa lí</option>
                        <option value="Tin học">Tin học</option>
                        <option value="Công nghệ">Công nghệ</option>
                        <option value="Giáo dục công dân">Giáo dục công dân</option>
                        <option value="Giáo dục Kinh tế & Pháp luật">Giáo dục Kinh tế & Pháp luật</option>
                        <option value="Âm nhạc">Âm nhạc</option>
                        <option value="Mĩ thuật">Mĩ thuật</option>
                        <option value="Giáo dục thể chất">Giáo dục thể chất</option>
                        <option value="Hoạt động trải nghiệm">Hoạt động trải nghiệm</option>
                        <option value="Giáo dục chuyên biệt / Chủ nhiệm / Khác">Chủ nhiệm / Môn khác</option>
                      </select>
                    </div>

                    {/* Custom Domain Input */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Lĩnh vực áp dụng:</label>
                      <input
                        type="text"
                        value={draft.domain}
                        onChange={(e) => handleFieldChange("domain", e.target.value)}
                        className="w-full text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-lg px-3 py-2.5 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all h-[38px]"
                        placeholder="Tự điền (Ví dụ: Đổi mới phương pháp, STEM...)"
                      />
                    </div>
                  </div>

                  {/* Topic Title (Đề tài) Field with suggestions trigger */}
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Tên Đề tài / Sáng kiến Giáo dục:</label>
                      <button
                        type="button"
                        onClick={() => setActiveTab("titles")}
                        className="text-[11px] text-indigo-700 hover:text-indigo-900 font-bold flex items-center gap-1.5 bg-white border border-indigo-200 px-2.5 py-1 rounded-lg hover:shadow-xs transition-all cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-teal-600 animate-pulse" />
                        Gợi ý tên đề tài AI...
                      </button>
                    </div>
                    <textarea
                      value={draft.title}
                      onChange={(e) => handleFieldChange("title", e.target.value)}
                      rows={2}
                      className="w-full text-xs font-bold text-slate-900 bg-white border border-slate-200 rounded-lg px-3 py-2.5 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none resize-none transition-all leading-relaxed"
                      placeholder="Mô tả chính xác tên dự án sáng kiến kinh nghiệm hoặc đề tài sư phạm của cô..."
                    />
                  </div>

                  {/* Master AI Auto-Writer block */}
                  <div className="pt-3 border-t border-dashed border-indigo-100">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-indigo-50 to-indigo-100/50 p-4 rounded-xl border border-indigo-100/60">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-indigo-600 animate-pulse" />
                          <h4 className="text-xs font-bold text-slate-800">Sáng Tác Toàn Bộ Sáng Kiến Siêu Tốc Bằng AI</h4>
                        </div>
                        <p className="text-[10px] text-slate-500 max-w-xl">
                          Sử dụng mô hình ngôn ngữ lớn để nghiên cứu thực trạng và tự động vạch ra giải pháp, hoạt động chi tiết cho cả 3 phân đoạn <b>Phần A, Phần B, Phần C</b> đồng loạt chỉ từ tên đề tài ở trên.
                        </p>
                      </div>
                      
                      <button
                        type="button"
                        onClick={handleAutoWriteInitiative}
                        disabled={autoWritingLoading || !draft.title.trim()}
                        className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer shadow-xs active:scale-[0.98]"
                      >
                        {autoWritingLoading ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                            Đang soạn thảo học thuật (đợi 10-15s)...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                            AI Tự Động Viết Toàn Bộ
                          </>
                        )}
                      </button>
                    </div>

                    {autoWritingError && (
                      <div className="mt-2.5 text-[11px] text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-100 flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        {autoWritingError}
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. CHUYÊN ĐỀ PHÂN ĐOẠN EDITOR & CHAT WIDGETS */}
                <div className="space-y-6">
                  
                  {/* PHẦN A CARD */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs bg-white">
                    <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
                      <div>
                        <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest block">Phân đoạn nghiên cứu</span>
                        <h4 className="font-bold text-slate-950 text-xs uppercase tracking-wider">Phần A: ĐẶT VẤN ĐỀ (Bối cảnh & Thực trạng học lực)</h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(draft.partA, "A")}
                        className="p-1.5 hover:bg-white text-slate-400 hover:text-slate-600 rounded border border-slate-200 transition-all cursor-pointer flex items-center gap-1.5 text-[10px] font-bold bg-slate-100"
                      >
                        {copiedSection === "A" ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedSection === "A" ? "Đã sao chép" : "Sao chép"}
                      </button>
                    </div>

                    <div className="p-4 grid grid-cols-1 xl:grid-cols-12 gap-5">
                      {/* Editor */}
                      <div className="xl:col-span-7 flex flex-col justify-between">
                        <div>
                          <p className="text-[11px] text-slate-500 mb-2 leading-relaxed">Hãy nêu rõ lý do giáo lý cấp thiết, thực trạng bất cập tồn tại (học sinh chán nản, giáo cụ cũ kỹ...) của nhà trường trước sáng kiến.</p>
                          <textarea
                            value={draft.partA}
                            onChange={(e) => handleFieldChange("partA", e.target.value)}
                            rows={15}
                            className="w-full text-xs text-slate-700 bg-white border border-slate-200 rounded-lg px-3 py-3 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all font-sans leading-relaxed"
                            placeholder="Mô tả lý do sư phạm nghẽn..."
                          />
                        </div>
                        <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest border-t border-slate-100 pt-2">
                          <span>Giáo dục & Sư phạm</span>
                          <span>Độ dài: {draft.partA.length} ký tự</span>
                        </div>
                      </div>
                      {/* AI Chat & Evidence box for Part A */}
                      <div className="xl:col-span-5">
                        <SectionHelper 
                          sectionId="partA"
                          sectionTitle="Phần A: Đặt vấn đề"
                          teacherName={draft.teacherName}
                          topicTitle={draft.title}
                          currentText={draft.partA}
                          onApplyImprovement={(text) => handleApplyImprovement("partA", text)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* PHẦN B CARD */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs bg-white">
                    <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
                      <div>
                        <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest block">Phân đoạn nghiên cứu</span>
                        <h4 className="font-bold text-slate-950 text-xs uppercase tracking-wider">Phần B: GIẢI QUYẾT VẤN ĐỀ (Biện pháp sỹ phạm & Tổ chức lớp)</h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(draft.partB, "B")}
                        className="p-1.5 hover:bg-white text-slate-400 hover:text-slate-600 rounded border border-slate-200 transition-all cursor-pointer flex items-center gap-1.5 text-[10px] font-bold bg-slate-100"
                      >
                        {copiedSection === "B" ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedSection === "B" ? "Đã sao chép" : "Sao chép"}
                      </button>
                    </div>

                    <div className="p-4 grid grid-cols-1 xl:grid-cols-12 gap-5">
                      {/* Editor */}
                      <div className="xl:col-span-7 flex flex-col justify-between">
                        <div>
                          <p className="text-[11px] text-slate-500 mb-2 leading-relaxed">Trọng tâm sáng kiến: Vạch rõ các biện pháp thực nghiệm cụ thể, thứ tự hành động (luật chơi, các bước hướng dẫn bài giảng, cách đóng gói quy trình).</p>
                          <textarea
                            value={draft.partB}
                            onChange={(e) => handleFieldChange("partB", e.target.value)}
                            rows={15}
                            className="w-full text-xs text-slate-700 bg-white border border-slate-200 rounded-lg px-3 py-3 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all font-sans leading-relaxed"
                            placeholder="Mô tả cụ thể từng giải pháp của cô..."
                          />
                        </div>
                        <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest border-t border-slate-100 pt-2">
                          <span>Sơ đồ / Kịch bản / Luật chơi</span>
                          <span>Độ dài: {draft.partB.length} ký tự</span>
                        </div>
                      </div>
                      {/* AI Chat & Evidence box for Part B */}
                      <div className="xl:col-span-5">
                        <SectionHelper 
                          sectionId="partB"
                          sectionTitle="Phần B: Giải quyết vấn đề"
                          teacherName={draft.teacherName}
                          topicTitle={draft.title}
                          currentText={draft.partB}
                          onApplyImprovement={(text) => handleApplyImprovement("partB", text)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* PHẦN C CARD */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs bg-white">
                    <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
                      <div>
                        <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest block">Phân đoạn nghiên cứu</span>
                        <h4 className="font-bold text-slate-950 text-xs uppercase tracking-wider">Phần C: HIỆU QUẢ HOẠT ĐỘNG & MINH CHỨNG THUYẾT PHỤC</h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(draft.partC, "C")}
                        className="p-1.5 hover:bg-white text-slate-400 hover:text-slate-600 rounded border border-slate-200 transition-all cursor-pointer flex items-center gap-1.5 text-[10px] font-bold bg-slate-100"
                      >
                        {copiedSection === "C" ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedSection === "C" ? "Đã sao chép" : "Sao chép"}
                      </button>
                    </div>

                    <div className="p-4 grid grid-cols-1 xl:grid-cols-12 gap-5">
                      {/* Editor */}
                      <div className="xl:col-span-7 flex flex-col justify-between">
                        <div>
                          <p className="text-[11px] text-slate-500 mb-2 leading-relaxed">Định lượng hiệu quả: Chênh lệch tỷ lệ %, số điểm thực hành tăng lên, mức độ chuyên cần và hiệu suất tiết kiệm thời gian hoặc kinh phí chế cụ dạy học.</p>
                          <textarea
                            value={draft.partC}
                            onChange={(e) => handleFieldChange("partC", e.target.value)}
                            rows={15}
                            className="w-full text-xs text-slate-700 bg-white border border-slate-200 rounded-lg px-3 py-3 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all font-sans leading-relaxed"
                            placeholder="Mô tả số liệu chứng đắc..."
                          />
                        </div>
                        <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest border-t border-slate-100 pt-2">
                          <span>Biểu đồ / Số tăng trưởng / Phản hồi</span>
                          <span>Độ dài: {draft.partC.length} ký tự</span>
                        </div>
                      </div>
                      {/* AI Chat & Evidence box for Part C */}
                      <div className="xl:col-span-5">
                        <SectionHelper 
                          sectionId="partC"
                          sectionTitle="Phần C: Hiệu quả & Minh chứng"
                          teacherName={draft.teacherName}
                          topicTitle={draft.title}
                          currentText={draft.partC}
                          onApplyImprovement={(text) => handleApplyImprovement("partC", text)}
                        />
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* Right Sidebar Checklist Panel */}
              <div className="lg:col-span-4 space-y-6">
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-widest mb-3 border-b border-slate-100 pb-2">
                    ✓ Các Tiêu chuẩn xét duyệt Giáo viên giỏi
                  </h4>
                  <div className="space-y-3">
                    <div className="flex gap-2 text-xs text-slate-600">
                      <input type="checkbox" checked={draft.teacherName.trim().length > 3} readOnly className="mt-0.5 rounded text-indigo-600" />
                      <div>
                        <span className="font-semibold block text-slate-800">Đã điền danh tính giáo viên</span>
                        <p className="text-[10px] text-slate-500">Giúp đồng bộ dữ liệu báo cáo chính xác</p>
                      </div>
                    </div>

                    <div className="flex gap-2 text-xs text-slate-600">
                      <input type="checkbox" checked={draft.title.length > 25} readOnly className="mt-0.5 rounded text-indigo-600" />
                      <div>
                        <span className="font-semibold block text-slate-800">Tên đề tài sâu sắc & chuẩn sư phạm</span>
                        <p className="text-[10px] text-slate-500">Có giải pháp cụ thể và phản ánh cấp học</p>
                      </div>
                    </div>

                    <div className="flex gap-2 text-xs text-slate-600">
                      <input type="checkbox" checked={draft.partA.length > 150} readOnly className="mt-0.5 rounded text-indigo-600" />
                      <div>
                        <span className="font-semibold block text-slate-800">Mô tả lý do đặt vấn đề đầy đủ</span>
                        <p className="text-[10px] text-slate-500">Làm rõ các luận điểm bất cập học lực học sinh</p>
                      </div>
                    </div>

                    <div className="flex gap-2 text-xs text-slate-600">
                      <input type="checkbox" checked={draft.partB.length > 250} readOnly className="mt-0.5 rounded text-indigo-600" />
                      <div>
                        <span className="font-semibold block text-slate-800">Cơ cấu giải pháp phân phối chi tiết</span>
                        <p className="text-[10px] text-slate-500">Trình bày ít nhất 2 đến 3 biện pháp sư phạm cụ thể</p>
                      </div>
                    </div>

                    <div className="flex gap-2 text-xs text-slate-600">
                      <input type="checkbox" checked={draft.partC.length > 150} readOnly className="mt-0.5 rounded text-indigo-600" />
                      <div>
                        <span className="font-semibold block text-slate-800">Đủ điều kiện kiểm chứng thực tế</span>
                        <p className="text-[10px] text-slate-500">Có số phần trăm gia tăng rõ rệt kèm minh chứng hình ảnh</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-tr from-indigo-50 to-teal-50 border border-indigo-100 rounded-xl p-5 shadow-xs">
                  <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-indigo-600" /> Bản sắc Sư phạm Đổi mới:
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Sáng kiến sư phạm của thầy/cô đang được rà soát từng phần. Hãy nhập thông tin chung gồm tên giáo viên giỏi, chọn cấp học và dán nội dung thô. Hãy thường xuyên bấm <b>"Quét gợi ý minh chứng"</b> ở thanh bên phải của mỗi phần để thiết kế biểu đồ, bảng biểu hoặc khảo sát học đường một cách tối ưu.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TITLES */}
          {activeTab === "titles" && (
            <TitleGenerator 
              onSelectTitle={(newTitle) => handleFieldChange("title", newTitle)} 
            />
          )}

          {/* TAB 3: GAP ANALYSIS */}
          {activeTab === "gap" && (
            <GapAnalysis />
          )}

          {/* TAB 4: LOGIC BUILDER */}
          {activeTab === "logic" && (
            <LogicBuilder />
          )}

          {/* TAB 5: ECONOMIC CALCULATOR */}
          {activeTab === "calculator" && (
            <AutoCalculator 
              rows={draft.calcRows} 
              onChangeRows={handleUpdateCalcRows} 
            />
          )}

          {/* TAB 6: SCORER & SWOT */}
          {activeTab === "scorer" && (
            <DraftScorer 
              draft={draft} 
              onApplyImprovement={handleApplyImprovement} 
            />
          )}

          {/* TAB 7: ANTI PLAGIARISM */}
          {activeTab === "quality" && (
            <QualityChecker 
              title={draft.title}
              partA={draft.partA}
              partB={draft.partB}
              partC={draft.partC}
            />
          )}

          {/* TAB 8: CHARTS AND TABLES GENERATOR */}
          {activeTab === "charts" && (
            <SuPhamChartGenerator 
              title={draft.title}
              domain={draft.domain}
              grade={draft.grade}
              subject={draft.subject}
            />
          )}

        </div>
      </main>

      {/* Footer copyright */}
      <footer className="bg-slate-900 text-slate-400 mt-12 py-8 border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-slate-300">Trợ lý viết sáng kiến giáo dục (Hội đồng sáng kiến Khoa học Sư phạm)</p>
            <p className="mt-1">Hệ thống AI số hóa hỗ trợ giáo viên hoàn thiện báo cáo khoa học trải nghiệm, thiết lập minh chứng thực tiễn và chống đạo văn sư phạm.</p>
          </div>
          <div className="text-right">
            <p>© {new Date().getFullYear()} Trợ lý viết sáng kiến. Thiết kế riêng cho ngành Giáo dục & Đào tạo Việt Nam.</p>
          </div>
        </div>
      </footer>

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-800 text-lg">Thiết lập cấu hình Gemini AI</h3>
              </div>
              {hasConfiguredKeys() && (
                <button
                  onClick={() => {
                    setApiKeyInput(getInitialApiKeysInput());
                    setSelectedModel(localStorage.getItem("GEMINI_MODEL") || "gemini-3-flash-preview");
                    setKeyErrorMsg("");
                    setShowSettingsModal(false);
                  }}
                  className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer px-2 py-1 rounded-lg hover:bg-slate-100"
                >
                  Đóng
                </button>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Google Gemini API Keys (Một hoặc Nhiều Keys):</label>
                <textarea
                  rows={4}
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all font-mono resize-y"
                  placeholder="Thầy cô có thể nhập 3 - 4 API Key cùng lúc (mỗi dòng một key hoặc phân tách bằng dấu phẩy) để hệ thống tự động xoay vòng tránh giới hạn (rate limit) của bản miễn phí."
                />
                <p className="text-[11px] text-slate-500 mt-2">
                  API Key được lưu trực tiếp trên trình duyệt của bạn (localStorage). Nếu chưa có API Key, vui lòng truy cập{" "}
                  <a
                    href="https://aistudio.google.com/api-keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:underline font-bold"
                  >
                    Google AI Studio (https://aistudio.google.com/api-keys)
                  </a>{" "}
                  để khởi tạo một key hoàn toàn miễn phí.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Chọn mô hình AI (Model):</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: "gemini-3-flash-preview", name: "Gemini 3 Flash", badge: "Mặc định", desc: "Tốc độ nhanh nhất, lý tưởng cho đa số các tác vụ." },
                    { id: "gemini-3-pro-preview", name: "Gemini 3 Pro", badge: "Cao cấp", desc: "Thông minh nhất, độ chính xác cao đối với các phân tích học thuật sâu." },
                    { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", badge: "Mới", desc: "Mô hình thế hệ mới ổn định, xử lý nhanh chóng." }
                  ].map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSelectedModel(m.id)}
                      className={`p-4 rounded-xl border text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                        selectedModel === m.id
                          ? "border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-50"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="font-bold text-slate-900 text-xs">{m.name}</span>
                          <span className={`px-1.5 py-0.5 text-[9px] font-black uppercase rounded ${
                            m.id === "gemini-3-flash-preview" ? "bg-indigo-100 text-indigo-800" :
                            m.id === "gemini-3-pro-preview" ? "bg-purple-100 text-purple-800" : "bg-emerald-100 text-emerald-800"
                          }`}>
                            {m.badge}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 leading-relaxed">{m.desc}</p>
                      </div>
                      <div className="mt-3 flex items-center justify-between text-[10px] font-bold">
                        <span className={selectedModel === m.id ? "text-indigo-600" : "text-slate-400"}>
                          {selectedModel === m.id ? "✓ Đang chọn" : "Chọn model này"}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {keyErrorMsg && (
              <div className="text-xs font-semibold text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">
                {keyErrorMsg}
              </div>
            )}

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
              {hasConfiguredKeys() && (
                <button
                  type="button"
                  onClick={() => {
                    setApiKeyInput(getInitialApiKeysInput());
                    setSelectedModel(localStorage.getItem("GEMINI_MODEL") || "gemini-3-flash-preview");
                    setKeyErrorMsg("");
                    setShowSettingsModal(false);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-all cursor-pointer h-[36px]"
                >
                  Hủy bỏ
                </button>
              )}
              <button
                type="button"
                onClick={handleSaveSettings}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition-all cursor-pointer shadow-md shadow-indigo-100 h-[36px]"
              >
                Lưu cấu hình
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
