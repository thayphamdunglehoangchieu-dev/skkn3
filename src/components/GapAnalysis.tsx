import React, { useState } from "react";
import { ToggleLeft, HelpCircle, AlertCircle, Loader2, ArrowRight, ClipboardCheck } from "lucide-react";
import { GapAnalysisResult } from "../types";

import { gapAnalysis } from "../services/geminiService";

export default function GapAnalysis() {
  const [baseline, setBaseline] = useState("");
  const [targetState, setTargetState] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GapAnalysisResult | null>(null);
  const [error, setError] = useState("");

  const handleAnalyze = async () => {
    if (!baseline.trim() || !targetState.trim()) {
      setError("Vui lòng mô tả đầy đủ thực trạng đang có và mục tiêu mong muốn.");
      return;
    }
    setError("");
    setLoading(true);
    setResult(null);

    try {
      const data = await gapAnalysis(baseline, targetState);
      if (data && data.gaps) {
        setResult(data);
      } else {
        setError("Không thể phân tích khoảng cách lúc này.");
      }
    } catch (err: any) {
      setError(`Lỗi kết nối AI: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 overflow-hidden relative">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-400 to-amber-500"></div>
      
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2.5 bg-orange-50 text-orange-600 rounded-lg">
          <ToggleLeft className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-semibold text-slate-800 text-lg">Định vị Điểm Nghẽn (AI Gap Analysis)</h3>
          <p className="text-xs text-slate-500">Xác định khoảng trống khoa học lý giải nguyên nhân giải pháp là cần thiết</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1">
            <span>Trạng thái Thực tế (Cái đang có)</span>
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" title="Hiện trạng chưa tích cực của đơn vị" />
          </label>
          <textarea
            value={baseline}
            onChange={(e) => setBaseline(e.target.value)}
            placeholder="Mô tả cụ thể thông số lỗi, số giờ nhân sự lãng phí cho các quy trình giấy, hoặc máy móc vận hành kém..."
            rows={4}
            className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all resize-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1">
            <span>Trạng thái Kỳ vọng (Trọng điểm cải cách)</span>
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" title="Mục tiêu định lượng muốn đạt được sau sáng kiến" />
          </label>
          <textarea
            value={targetState}
            onChange={(e) => setTargetState(e.target.value)}
            placeholder="Tiết kiệm bao nhiêu điện, giảm bao nhiêu phần trăm lỗi kỹ thuật, tinh gọn mấy bước thủ tục kiểm định..."
            rows={4}
            className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all resize-none"
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
        onClick={handleAnalyze}
        disabled={loading}
        className="w-full md:w-auto px-5 py-2.5 bg-orange-600 hover:bg-orange-700 disabled:bg-slate-300 text-white font-medium text-sm rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm hover:shadow"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Đang phân tích cấu trúc khoảng cách...
          </>
        ) : (
          <>
            <ToggleLeft className="w-4 h-4" />
            Nhận diện Điểm nghẽn Sáng kiến
          </>
        )}
      </button>

      {result && (
        <div className="mt-6 border-t border-slate-100 pt-5 space-y-4">
          <div className="bg-orange-50/40 border border-orange-100 p-4 rounded-xl">
            <h4 className="text-xs font-bold text-orange-800 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <ClipboardCheck className="w-4 h-4" /> Phân tích Khoảng trống (Gap Analysis Overall):
            </h4>
            <p className="text-sm text-slate-700 leading-relaxed">{result.gaps}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-slate-200 p-4 rounded-xl bg-slate-50/50">
              <h5 className="text-xs font-bold text-slate-800 uppercase tracking-widest mb-3 flex items-center gap-1.5 border-b border-slate-200/60 pb-1.5">
                🚫 Rào cản kỹ thuật - nguồn lực:
              </h5>
              <ul className="space-y-2.5">
                {result.barriers.map((bar, idx) => (
                  <li key={idx} className="text-xs text-slate-600 flex items-start gap-2">
                    <span className="w-5 h-5 flex items-center justify-center rounded-full bg-red-100 text-red-700 text-[10px] font-bold flex-shrink-0">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed">{bar}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border border-slate-200 p-4 rounded-xl bg-slate-50/50">
              <h5 className="text-xs font-bold text-slate-800 uppercase tracking-widest mb-3 flex items-center gap-1.5 border-b border-slate-200/60 pb-1.5">
                📈 Chỉ số KPIs Đề xuất Đo lường:
              </h5>
              <ul className="space-y-2.5">
                {result.kpis.map((kpi, idx) => (
                  <li key={idx} className="text-xs text-slate-600 flex items-start gap-2">
                    <span className="w-5 h-5 flex items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold flex-shrink-0">
                      ✓
                    </span>
                    <span className="leading-relaxed">{kpi}</span>
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
