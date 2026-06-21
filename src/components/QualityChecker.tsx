import React, { useState } from "react";
import { ShieldAlert, CheckCircle2, ChevronRight, Loader2, AlertCircle, Info, FileWarning } from "lucide-react";
import { QualityCheckResult } from "../types";

import { qualityChecker } from "../services/geminiService";

interface QualityCheckerProps {
  title: string;
  partA: string;
  partB: string;
  partC: string;
}

export default function QualityChecker({ title, partA, partB, partC }: QualityCheckerProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<QualityCheckResult | null>(null);
  const [error, setError] = useState("");

  const handleQualityCheck = async () => {
    const fullContent = `${partA}\n\n${partB}\n\n${partC}`;
    if (!fullContent.trim() || fullContent.length < 50) {
      setError("Nội dung nháp sáng kiến quá ngắn hoặc rỗng để thực hiện đối chiếu kiểm soát trùng lặp.");
      return;
    }

    setError("");
    setLoading(true);
    setResult(null);

    try {
      const data = await qualityChecker(title, fullContent);
      if (data && data.plagiarismRisk) {
        setResult(data);
      } else {
        setError("Gặp lỗi trong quá trình quét đối chuẩn học thuật / hành chính.");
      }
    } catch (err: any) {
      setError(`Lỗi kết nối AI: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (risk: string) => {
    const r = risk.toLowerCase();
    if (r.indexOf("cao") !== -1) return "text-red-700 bg-red-100 border-red-200";
    if (r.indexOf("trung") !== -1) return "text-amber-700 bg-amber-100 border-amber-200";
    return "text-green-700 bg-green-100 border-green-200";
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 overflow-hidden relative">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-rose-600"></div>
      
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2.5 bg-rose-50 text-rose-600 rounded-lg">
          <ShieldAlert className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-semibold text-slate-800 text-lg">Kiểm định Chất lượng & Trùng Lặp (Anti-Plagiarism)</h3>
          <p className="text-xs text-slate-500">Đối chuẩn các rủi ro trùng lặp ý tưởng công vụ, lạm dụng sáo rỗng hoặc thiếu bằng chứng</p>
        </div>
      </div>

      <p className="text-xs text-slate-600 mb-4 leading-relaxed">
        Phân tích chéo cấu trúc câu, từ khóa hành chính phổ biến để dự báo khả năng trùng lặp, phòng vệ sai sót và kiểm tra cấu trúc phù hợp chuẩn đạo văn sáng kiến cấp ngành.
      </p>

      {error && (
        <div className="mb-4 text-xs font-medium text-red-600 bg-red-50 p-3 rounded-lg border border-red-100 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <button
        onClick={handleQualityCheck}
        disabled={loading}
        className="w-full md:w-auto px-5 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 text-white font-medium text-sm rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm hover:shadow"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Đại sứ đang tra cứu nguồn & so khớp biểu mẫu...
          </>
        ) : (
          <>
            <ShieldAlert className="w-4 h-4" />
            Khởi động quét kiểm soát Đạo văn & Hành chính
          </>
        )}
      </button>

      {result && (
        <div className="mt-6 border-t border-slate-100 pt-5 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={`p-4 rounded-xl border ${getRiskColor(result.plagiarismRisk)} flex items-center justify-between`}>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider block mb-1">Mức Độ Tự Trùng Lặp Ý Tưởng</span>
                <h4 className="font-bold text-lg">{result.plagiarismRisk}</h4>
              </div>
              <div className="text-right">
                <span className="text-xs block font-medium opacity-80">Rủi ro trùng lặp</span>
                <span className="font-bold text-lg font-mono">{result.riskScorePercentage}%</span>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Phân tích từ khóa dễ đụng hàng:</span>
              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                {result.duplicatedKeywordsAnalysis}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
            <div className="border border-red-100 rounded-xl p-4 bg-red-50/20">
              <h5 className="text-xs font-bold text-red-900 uppercase tracking-widest mb-3 flex items-center gap-1 border-b border-red-100/50 pb-2">
                <FileWarning className="w-4 h-4 text-red-600" /> Phát hiện lỗi tuân thủ hành chính:
              </h5>
              <ul className="space-y-2">
                {result.complianceViolations?.map((violation, idx) => (
                  <li key={idx} className="text-xs text-slate-700 flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-red-100 text-red-700 text-[10px] font-bold flex-shrink-0 flex items-center justify-center mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed">{violation}</span>
                  </li>
                ))}
                {(!result.complianceViolations || result.complianceViolations.length === 0) && (
                  <p className="text-xs text-slate-400 italic">Văn bản tuân thủ 100% định dạng quy định hành chính.</p>
                )}
              </ul>
            </div>

            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
              <h5 className="text-xs font-bold text-slate-800 uppercase tracking-widest mb-3 flex items-center gap-1 border-b border-slate-200/60 pb-2">
                <Info className="w-4 h-4 text-teal-600" /> Giải pháp điều hướng khắc phục hoàn hảo:
              </h5>
              <ul className="space-y-2">
                {result.recommendations?.map((rec, idx) => (
                  <li key={idx} className="text-xs text-slate-700 flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold flex-shrink-0 flex items-center justify-center mt-0.5">
                      ✓
                    </span>
                    <span className="leading-relaxed">{rec}</span>
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
