import React, { useState } from "react";
import { Hammer, Loader2, AlertCircle, CheckCircle2, ChevronRight, HelpCircle } from "lucide-react";
import { LogicBuilderResult } from "../types";

import { logicBuilder } from "../services/geminiService";

export default function LogicBuilder() {
  const [problemText, setProblemText] = useState("");
  const [solutionSteps, setSolutionSteps] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LogicBuilderResult | null>(null);
  const [error, setError] = useState("");

  const handleBuildAndCheck = async () => {
    if (!problemText.trim() || !solutionSteps.trim()) {
      setError("Vui lòng nhập Vấn đề cốt lõi và các Bước hành động đổi mới.");
      return;
    }
    setError("");
    setLoading(true);
    setResult(null);

    try {
      const data = await logicBuilder(problemText, solutionSteps);
      if (data && data.logicScore !== undefined) {
        setResult(data);
      } else {
        setError("Không thể khởi chạy phân tích Logic xâu chuỗi.");
      }
    } catch (err: any) {
      setError(`Lỗi kết nối AI: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 overflow-hidden relative">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
      
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
          <Hammer className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-semibold text-slate-800 text-lg">Kiểm tra Mạch Logic (Logic Builder)</h3>
          <p className="text-xs text-slate-500">Đảm bảo giải pháp đề xuất xử lý trực diện và đồng bộ từ gốc của thực trạng</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1">
            <span>Nguyên nhân & Vấn đề Cốt lõi</span>
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" title="Chi tiết nguyên nhân gây sụt giảm hiệu năng hoặc quá tải" />
          </label>
          <textarea
            value={problemText}
            onChange={(e) => setProblemText(e.target.value)}
            placeholder="Ví dụ: Quy trình duyệt thủ công tốn thời gian do nhân viên phải ký tay 4 tầng phê duyệt riêng biệt..."
            rows={4}
            className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all resize-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1">
            <span>Hệ giải pháp / Các bước triển khai vụ việc</span>
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" title="Lộ trình hành động chi tiết giải cứu lỗi thực trạng" />
          </label>
          <textarea
            value={solutionSteps}
            onChange={(e) => setSolutionSteps(e.target.value)}
            placeholder="Ví dụ: Bước 1 - Rút gọn thành 2 cấp duyệt song song qua cổng Smart Office, Bước 2 - Phân quyền tự động..."
            rows={4}
            className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all resize-none"
          />
        </div>
      </div>

      {error && (
        <div className="mb-4 text-xs font-medium text-red-600 bg-red-50 p-3 rounded-lg border border-red-100 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <button
        onClick={handleBuildAndCheck}
        disabled={loading}
        className="w-full md:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-medium text-sm rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm hover:shadow"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Đang chấm điểm và kết nối xâu chuỗi logic...
          </>
        ) : (
          <>
            <Hammer className="w-4 h-4" />
            Kiểm tra mức độ chặt chẽ Logic
          </>
        )}
      </button>

      {result && (
        <div className="mt-6 border-t border-slate-100 pt-5 space-y-5">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-50 border border-slate-150 p-4 rounded-xl">
            <div>
              <h4 className="text-sm font-semibold text-slate-800">Kết quả Đánh giá Tính Mạch lạc</h4>
              <p className="text-xs text-slate-500 mt-0.5">Xếp hạng độ phủ của giải pháp so với nguyên nhân cốt lõi</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500">Điểm logic:</span>
              <span className={`px-3 py-1.5 rounded-lg text-lg font-bold ${
                result.logicScore >= 8 
                  ? "bg-green-100 text-green-800" 
                  : result.logicScore >= 6 
                  ? "bg-amber-100 text-amber-800" 
                  : "bg-red-100 text-red-800"
              }`}>
                {result.logicScore}/10
              </span>
            </div>
          </div>

          <div className="p-4 bg-blue-50/30 border border-blue-100/60 rounded-xl">
            <h5 className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-2">Thẩm định từ Hội đồng AI:</h5>
            <p className="text-sm text-slate-700 leading-relaxed">{result.assessment}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-red-100/80 bg-red-50/10 p-4 rounded-xl">
              <h5 className="text-xs font-bold text-red-800 uppercase tracking-widest mb-3 flex items-center gap-1.5 border-b border-red-100/50 pb-2">
                ⚠️ Điểm thiếu sót trong lập luận (Missing links):
              </h5>
              <ul className="space-y-2">
                {result.missingLinks?.map((link, idx) => (
                  <li key={idx} className="text-xs text-slate-700 flex items-start gap-2">
                    <span className="text-red-500 font-bold mt-0.5">•</span>
                    <span className="leading-relaxed">{link}</span>
                  </li>
                ))}
                {(!result.missingLinks || result.missingLinks.length === 0) && (
                  <p className="text-xs text-slate-400 italic">Không tìm thấy lỗ hổng logic nghiêm trọng.</p>
                )}
              </ul>
            </div>

            <div className="border border-green-100/80 bg-green-50/10 p-4 rounded-xl">
              <h5 className="text-xs font-bold text-green-800 uppercase tracking-widest mb-3 flex items-center gap-1.5 border-b border-green-100/50 pb-2">
                💡 Định hướng vá lỗi và tối ưu hành trình:
              </h5>
              <ul className="space-y-2">
                {result.suggestions?.map((sug, idx) => (
                  <li key={idx} className="text-xs text-slate-700 flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{sug}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
