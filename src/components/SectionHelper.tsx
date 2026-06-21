import React, { useState, useEffect } from "react";
import { MessageSquare, BarChart3, Send, Loader2, Sparkles, Check, Paperclip, HelpCircle, AlertCircle } from "lucide-react";

import { chatSection, suggestEvidence } from "../services/geminiService";

interface Message {
  role: "user" | "assistant";
  text: string;
}

interface Evidence {
  type: string;
  title: string;
  description: string;
  value: string;
}

interface SectionHelperProps {
  sectionId: "partA" | "partB" | "partC";
  sectionTitle: string;
  teacherName: string;
  topicTitle: string;
  currentText: string;
  onApplyImprovement: (text: string) => void;
}

export default function SectionHelper({
  sectionId,
  sectionTitle,
  teacherName,
  topicTitle,
  currentText,
  onApplyImprovement,
}: SectionHelperProps) {
  const [activeSubTab, setActiveSubTab] = useState<"chat" | "evidence">("chat");

  // Chat States
  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<Message[]>([
    {
      role: "assistant",
      text: `Xin chào thầy/cô ${teacherName || ""}! Tôi là Trợ lý AI chuyên biệt cho [${sectionTitle}]. Thầy/cô cần tôi mở rộng ý tưởng, bổ sung luận thuyết, hay thiết kế các hoạt động tổ chức cho phần này?`,
    },
  ]);
  const [chatLoading, setChatLoading] = useState(false);

  // Evidence States
  const [evidences, setEvidences] = useState<Evidence[]>([]);
  const [evidenceLoading, setEvidenceLoading] = useState(false);
  const [evidenceError, setEvidenceError] = useState("");

  // Update default chat welcome message when teacherName updates
  useEffect(() => {
    if (chatHistory.length === 1 && chatHistory[0].role === "assistant") {
      setChatHistory([
        {
          role: "assistant",
          text: `Xin chào thầy/cô ${teacherName || "giáo viên"}! Tôi là Trợ lý AI chuyên biệt cho [${sectionTitle}]. Thầy/cô cần tôi mở rộng ý tưởng, bổ sung luận thuyết, hay thiết kế các hoạt động tổ chức cho phần này?`,
        },
      ]);
    }
  }, [teacherName]);

  // Handle Send Chat
  const handleSendChat = async () => {
    if (!chatMessage.trim()) return;

    const userMsg = chatMessage.trim();
    const updatedHistory = [...chatHistory, { role: "user" as const, text: userMsg }];
    setChatHistory(updatedHistory);
    setChatMessage("");
    setChatLoading(true);

    try {
      const data = await chatSection(
        sectionTitle,
        teacherName,
        topicTitle,
        userMsg,
        currentText,
        updatedHistory.slice(-6)
      );

      if (data && data.responseMessage) {
        setChatHistory(prev => [...prev, { role: "assistant", text: data.responseMessage }]);
      } else {
        setChatHistory(prev => [
          ...prev,
          { role: "assistant", text: "⚠️ Không có phản hồi từ mô hình AI." },
        ]);
      }
    } catch (err: any) {
      setChatHistory(prev => [
        ...prev,
        { role: "assistant", text: `⚠️ Hệ thống gặp lỗi: ${err.message || err}` },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  // Handle Request Evidence Suggestions
  const handleSuggestEvidence = async () => {
    setEvidenceLoading(true);
    setEvidenceError("");
    setEvidences([]);

    try {
      const data = await suggestEvidence(
        sectionTitle,
        topicTitle,
        currentText,
        teacherName
      );

      if (data && data.recommendations) {
        setEvidences(data.recommendations);
      } else {
        setEvidenceError("Lỗi tự động phân tích gợi ý minh chứng.");
      }
    } catch (err: any) {
      setEvidenceError(`Lỗi kết nối AI: ${err.message || err}`);
    } finally {
      setEvidenceLoading(false);
    }
  };

  // Pre-filled helpers for teachers to quick-ask
  const quickPromptsForSection = {
    partA: [
      "Nhờ AI bổ sung mức độ cấp thiết lý thuyết",
      "Gợi ý thực trạng bất cập chung lớp học",
      "Viết lại đoạn nháp một cách trang trọng hơn",
    ],
    partB: [
      "Gợi ý quy trình tổ chức bài học 3 bước",
      "Vạch ra tiêu chí đánh giá sản phẩm học sinh",
      "Sửa lỗi lặp từ ngữ sư phạm trong bản nháp",
    ],
    partC: [
      "Gợi ý công việc phân tích định lượng %",
      "Bộ câu hỏi trắc nghiệm đo hứng thú học",
      "Giải pháp đóng gói quy trình chuyển giao",
    ],
  };

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden shadow-xs flex flex-col h-[400px]">
      {/* Sub-Tabs Nav */}
      <div className="flex bg-slate-100 border-b border-slate-200 p-1 gap-1">
        <button
          type="button"
          onClick={() => setActiveSubTab("chat")}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeSubTab === "chat" ? "bg-white text-indigo-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          Trợ lý AI Đồng hành
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab("evidence")}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeSubTab === "evidence" ? "bg-white text-indigo-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          Gợi ý Minh chứng ({evidences.length > 0 ? evidences.length : "Mới"})
        </button>
      </div>

      {/* Panel 1: CHAT */}
      {activeSubTab === "chat" && (
        <div className="flex-1 flex flex-col min-h-0 bg-white">
          {/* Chat Logs Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin select-text">
            {chatHistory.map((msg, i) => (
              <div key={i} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
                <span className="text-[9px] font-bold text-slate-400 mb-0.5 uppercase tracking-wider">
                  {msg.role === "user" ? "Bản thân thầy cô" : "Tư vấn Hội đồng AI"}
                </span>
                <div
                  className={`p-3 rounded-xl text-xs max-w-[85%] leading-relaxed ${
                    msg.role === "user"
                      ? "bg-indigo-600 text-white rounded-br-none"
                      : "bg-stone-100 text-stone-800 rounded-bl-none whitespace-pre-wrap"
                  }`}
                >
                  {msg.text}
                  {msg.role === "assistant" && i > 0 && (
                    <button
                      type="button"
                      onClick={() => onApplyImprovement(msg.text)}
                      className="mt-2.5 w-full py-1 bg-white hover:bg-slate-50 border border-slate-200 hover:border-indigo-400 text-indigo-700 font-bold text-[10px] rounded flex items-center justify-center gap-1 transition-all cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3 text-indigo-600 animate-pulse" />
                      Áp dụng ý tưởng này vào Bản nháp chính
                    </button>
                  )}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                AI chuyên khoa đang soạn thảo lập luận sư phạm...
              </div>
            )}
          </div>

          {/* Quick Prompts Helper */}
          <div className="px-3 py-1.5 bg-slate-50 border-t border-slate-100 flex flex-wrap gap-1.5 max-h-[70px] overflow-y-auto">
            {quickPromptsForSection[sectionId].map((qp, idx) => (
              <button
                type="button"
                key={idx}
                onClick={() => setChatMessage(qp)}
                className="text-[10px] bg-white border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 text-slate-600 hover:text-indigo-700 px-2 py-0.5 rounded-full transition-all cursor-pointer whitespace-nowrap"
              >
                💡 {qp}
              </button>
            ))}
          </div>

          {/* Chat Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendChat();
            }}
            className="p-3 border-t border-slate-200 bg-slate-50 flex gap-2"
          >
            <input
              type="text"
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              placeholder="Hỏi AI thêm luận ý, ví dụ: 'Gợi ý bài thơ vui rửa tay'..."
              className="flex-1 text-xs border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-indigo-500 bg-white"
            />
            <button
              type="submit"
              disabled={chatLoading || !chatMessage.trim()}
              className="p-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-lg transition-all flexitems-center justify-center cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}

      {/* Panel 2: EVIDENCE */}
      {activeSubTab === "evidence" && (
        <div className="flex-1 bg-white p-4 overflow-y-auto flex flex-col min-h-0">
          <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2">
            <div>
              <h5 className="text-xs font-bold text-slate-800">Kho Minh Chứng Giáo Dục</h5>
              <p className="text-[10px] text-slate-500">Giúp thuyết phục hội đồng thẩm định bằng trực quan học thuật</p>
            </div>
            <button
              type="button"
              onClick={handleSuggestEvidence}
              disabled={evidenceLoading}
              className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 font-bold text-[10px] rounded-lg transition-all flex items-center gap-1 cursor-pointer"
            >
              {evidenceLoading ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin text-indigo-700" />
                  Đang phân tích...
                </>
              ) : (
                <>
                  <Sparkles className="w-3 h-3 text-indigo-600" />
                  Quét & Gợi ý minh chứng
                </>
              )}
            </button>
          </div>

          {evidenceError && (
            <div className="text-[11px] text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-100 mb-3 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {evidenceError}
            </div>
          )}

          {evidences.length === 0 && !evidenceLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-slate-50 border border-dashed border-slate-200 rounded-xl">
              <Paperclip className="w-8 h-8 text-slate-300 mb-2" />
              <p className="text-xs font-bold text-slate-600">Chưa thiết lập minh chứng đề xuất</p>
              <p className="text-[10px] text-slate-500 max-w-[200px] mt-1">
                Bấm nút "Quét & Gợi ý minh chứng" ở trên để AI gợi ý các hình ảnh cụ thể, dạng biểu đồ, hoặc biểu mẫu khảo sát cho riêng bạn.
              </p>
            </div>
          ) : (
            <div className="space-y-3 flex-1 select-text">
              {evidences.map((evi, idx) => (
                <div key={idx} className="p-3 bg-stone-50 border border-stone-200 rounded-xl space-y-1">
                  <div className="flex items-center justify-between border-b border-stone-100 pb-1 flex-wrap gap-2">
                    <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded font-black text-[9px] uppercase">
                      {evi.type}
                    </span>
                    <span className="text-[10px] font-bold text-slate-700">
                      {evi.title}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    <b>Mô tả thiết kế:</b> {evi.description}
                  </p>
                  <p className="text-[11px] text-indigo-700 leading-relaxed font-medium">
                    <b>💡 Lợi ích thuyết phục:</b> {evi.value}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
