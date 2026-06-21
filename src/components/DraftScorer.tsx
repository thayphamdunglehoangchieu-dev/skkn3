import React, { useState } from "react";
import { Award, AlertTriangle, CheckCircle, RefreshCw, Sparkles, BookOpen, Trash2, ArrowUpRight } from "lucide-react";
import { ScoreDashboardData, InitiativeDraft } from "../types";

import { scoreDraft, improveSection } from "../services/geminiService";

interface DraftScorerProps {
  draft: InitiativeDraft;
  onApplyImprovement: (section: "partA" | "partB" | "partC", improvedText: string) => void;
}

export default function DraftScorer({ draft, onApplyImprovement }: DraftScorerProps) {
  const [loading, setLoading] = useState(false);
  const [scoreData, setScoreData] = useState<ScoreDashboardData | null>(null);
  const [error, setError] = useState("");

  // Section improvement states
  const [improvingSection, setImprovingSection] = useState<"partA" | "partB" | "partC" | null>(null);
  const [improveInstruction, setImproveInstruction] = useState("");
  const [improvedTextResult, setImprovedTextResult] = useState("");
  const [improvedReasons, setImprovedReasons] = useState<string[]>([]);
  const [improveError, setImproveError] = useState("");
  const [improvingLoading, setImprovingLoading] = useState(false);

  const triggerScoring = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await scoreDraft(
        draft.title,
        draft.partA,
        draft.partB,
        draft.partC,
        draft.domain
      );
      if (data && data.scores) {
        setScoreData(data);
      } else {
        setError("Không thể thực hiện thẩm định điểm lúc này.");
      }
    } catch (err: any) {
      setError(`Lỗi kết nối AI: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleImproveSectionText = async (section: "partA" | "partB" | "partC") => {
    setImprovingSection(section);
    setImproveInstruction("");
    setImprovedTextResult("");
    setImprovedReasons([]);
    setImproveError("");
  };

  const executeImprovement = async () => {
    if (!improvingSection) return;
    const textToImprove = draft[improvingSection];
    if (!textToImprove.trim()) {
      setImproveError("Phần văn bản hiện hành đang trống, vui lòng nhập nội dung trước khi nâng cấp.");
      return;
    }

    setImprovingLoading(true);
    setImproveError("");
    try {
      const rawSectionName = 
        improvingSection === "partA" 
          ? "Phần A: Đặt vấn đề" 
          : improvingSection === "partB" 
          ? "Phần B: Giải quyết vấn đề" 
          : "Phần C: Minh chứng & Hiệu quả";

      const data = await improveSection(rawSectionName, textToImprove, improveInstruction);
      if (data && data.improvedText) {
        setImprovedTextResult(data.improvedText);
        setImprovedReasons(data.reasons || []);
      } else {
        setImproveError("Gặp lỗi trong quá trình chau chuốt văn phong.");
      }
    } catch (err: any) {
      setImproveError(`Lỗi AI nâng cấp: ${err.message || err}`);
    } finally {
      setImprovingLoading(false);
    }
  };

  const applySuggestedText = () => {
    if (improvingSection && improvedTextResult) {
      onApplyImprovement(improvingSection, improvedTextResult);
      // Clean up states
      setImprovingSection(null);
      setImprovedTextResult("");
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-emerald-600 bg-emerald-50 border-emerald-200";
    if (score >= 6) return "text-amber-600 bg-amber-50 border-amber-200";
    return "text-red-600 bg-red-50 border-red-200";
  };

  const getPercentageColor = (score: number) => {
    if (score >= 8) return "bg-emerald-500";
    if (score >= 6) return "bg-amber-500";
    return "bg-red-500";
  };

  return (
    <div className="space-y-6">
      {/* Action Button Trigger */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="font-semibold text-slate-800 text-lg flex items-center gap-2">
            <Award className="w-5 h-5 text-indigo-500" />
            Hội đồng Thẩm định & Chấm điểm Thời gian thực (Real-time Scoring)
          </h3>
          <p className="text-xs text-slate-500 mt-1">Đánh giá trực tiếp nội dung đang chuẩn bị theo đúng cấu trúc tiêu chuẩn nhà nước</p>
        </div>
        <button
          onClick={triggerScoring}
          disabled={loading}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md hover:shadow-lg flex-shrink-0"
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Hội đồng đang thẩm định sáng kiến...
            </>
          ) : (
            <>
              <Award className="w-4 h-4" />
              Bắt đầu Chấm điểm & Thẩm định AI
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="text-xs font-semibold text-red-600 bg-red-50 p-4 rounded-xl border border-red-100">
          {error}
        </div>
      )}

      {/* Main Scoring Dashboard */}
      {scoreData && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
          {/* Left panel: Detailed Scores */}
          <div className="lg:col-span-1 bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">
                Bảng Điểm Dự Báo
              </h4>
              
              <div className="space-y-4">
                {/* Score Rubric 1 */}
                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1.5">
                    <span>1. Hình thức văn bản</span>
                    <span className="font-mono">{scoreData.scores.format}/10</span>
                  </div>
                  <div className="w-full bg-slate-150 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${getPercentageColor(scoreData.scores.format)}`}
                      style={{ width: `${scoreData.scores.format * 10}%` }}
                    ></div>
                  </div>
                </div>

                {/* Score Rubric 2 */}
                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1.5">
                    <span>2. Tính hiệu quả thực tiễn</span>
                    <span className="font-mono">{scoreData.scores.effectiveness}/10</span>
                  </div>
                  <div className="w-full bg-slate-150 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${getPercentageColor(scoreData.scores.effectiveness)}`}
                      style={{ width: `${scoreData.scores.effectiveness * 10}%` }}
                    ></div>
                  </div>
                </div>

                {/* Score Rubric 3 */}
                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1.5">
                    <span>3. Khả năng nhân rộng</span>
                    <span className="font-mono">{scoreData.scores.replicability}/10</span>
                  </div>
                  <div className="w-full bg-slate-150 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${getPercentageColor(scoreData.scores.replicability)}`}
                      style={{ width: `${scoreData.scores.replicability * 10}%` }}
                    ></div>
                  </div>
                </div>

                {/* Score Rubric 4 */}
                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1.5">
                    <span>4. Tiềm năng bền vững/Mở rộng</span>
                    <span className="font-mono">{scoreData.scores.sustainability}/10</span>
                  </div>
                  <div className="w-full bg-slate-150 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${getPercentageColor(scoreData.scores.sustainability)}`}
                      style={{ width: `${scoreData.scores.sustainability * 10}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-slate-100 bg-indigo-50/30 -mx-6 -mb-6 p-6 rounded-b-xl">
              <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-widest block mb-1">Đánh giá chung từ chủ trì:</span>
              <p className="text-sm font-medium text-slate-800 leading-relaxed italic">
                "{scoreData.overallVerdict}"
              </p>
            </div>
          </div>

          {/* Right panel: Improvement Actions based on score levels */}
          <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
            <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
              Chỉ Dẫn Nâng Cấp Từng Tiêu Chí (Actionable Advice)
            </h4>

            <div className="space-y-4">
              {/* Form Advice */}
              <div className="flex gap-3">
                <span className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold flex-shrink-0 ${getScoreColor(scoreData.scores.format)}`}>
                  {scoreData.scores.format}
                </span>
                <div>
                  <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Hình Thức Sáng Kiến</h5>
                  <ul className="text-xs text-slate-600 mt-1 space-y-1 list-disc pl-4 leading-relaxed">
                    {scoreData.formatAdvice?.map((adv, idx) => (
                      <li key={idx}>{adv}</li>
                    ))}
                    {scoreData.scores.format >= 8 && <li className="text-emerald-600 font-medium">Bố cục và hành văn xuất sắc, đạt tiêu chuẩn văn phòng hành chính nhà nước.</li>}
                  </ul>
                  <button
                    onClick={() => handleImproveSectionText("partA")}
                    className="mt-2 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5 cursor-pointer"
                  >
                    Nâng cấp văn phong Phần A <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Effectiveness Advice */}
              <div className="flex gap-3">
                <span className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold flex-shrink-0 ${getScoreColor(scoreData.scores.effectiveness)}`}>
                  {scoreData.scores.effectiveness}
                </span>
                <div>
                  <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Hiệu quả thực tế & Định lượng</h5>
                  <ul className="text-xs text-slate-600 mt-1 space-y-1 list-disc pl-4 leading-relaxed">
                    {scoreData.effectivenessAdvice?.map((adv, idx) => (
                      <li key={idx}>{adv}</li>
                    ))}
                    {scoreData.scores.effectiveness >= 8 && <li className="text-emerald-600 font-medium">Số liệu chứng thực đầy đủ và có sức thuyết phục cao.</li>}
                  </ul>
                  <button
                    onClick={() => handleImproveSectionText("partB")}
                    className="mt-2 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5 cursor-pointer"
                  >
                    Nâng cấp văn phong Phần B <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Replicability Advice */}
              <div className="flex gap-3">
                <span className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold flex-shrink-0 ${getScoreColor(scoreData.scores.replicability)}`}>
                  {scoreData.scores.replicability}
                </span>
                <div>
                  <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Tính nhân rộng & Phát triển</h5>
                  <ul className="text-xs text-slate-600 mt-1 space-y-1 list-disc pl-4 leading-relaxed">
                    {scoreData.replicabilityAdvice?.map((adv, idx) => (
                      <li key={idx}>{adv}</li>
                    ))}
                    {scoreData.scores.replicability >= 8 && <li className="text-emerald-600 font-medium">Bố trí lộ trình đóng gói và triển khai tối ưu.</li>}
                  </ul>
                  <button
                    onClick={() => handleImproveSectionText("partC")}
                    className="mt-2 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5 cursor-pointer"
                  >
                    Nâng cấp văn phong Phần C <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Sustainability Advice */}
              <div className="flex gap-3">
                <span className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold flex-shrink-0 ${getScoreColor(scoreData.scores.sustainability)}`}>
                  {scoreData.scores.sustainability}
                </span>
                <div>
                  <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider">SWOT & Đóng góp xã hội</h5>
                  <ul className="text-xs text-slate-600 mt-1 space-y-1 list-disc pl-4 leading-relaxed">
                    {scoreData.sustainabilityAdvice?.map((adv, idx) => (
                      <li key={idx}>{adv}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SWOT AI Matrix Component if present */}
      {scoreData && scoreData.swotAI && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">
            Phân tích Ma trận SWOT AI (Thẩm định Mở rộng)
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-emerald-50/30 border border-emerald-100 p-4 rounded-xl">
              <h5 className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-2">💪 S (Strengths - Điểm mạnh)</h5>
              <ul className="text-xs text-slate-700 space-y-1.5 list-inside list-disc">
                {scoreData.swotAI.strengths.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>

            <div className="bg-red-50/30 border border-red-100 p-4 rounded-xl">
              <h5 className="text-xs font-bold text-red-800 uppercase tracking-wider mb-2">⚠️ W (Weaknesses - Điểm yếu)</h5>
              <ul className="text-xs text-slate-700 space-y-1.5 list-inside list-disc">
                {scoreData.swotAI.weaknesses.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>

            <div className="bg-blue-50/30 border border-blue-100 p-4 rounded-xl">
              <h5 className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-2">🚀 O (Opportunities - Cơ hội)</h5>
              <ul className="text-xs text-slate-700 space-y-1.5 list-inside list-disc">
                {scoreData.swotAI.opportunities.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>

            <div className="bg-orange-50/30 border border-orange-100 p-4 rounded-xl">
              <h5 className="text-xs font-bold text-orange-850 uppercase tracking-wider mb-2">⚡ T (Threats - Rách thức)</h5>
              <ul className="text-xs text-slate-700 space-y-1.5 list-inside list-disc">
                {scoreData.swotAI.threats.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Inline Section Improvement UI Modal-like Drawer */}
      {improvingSection && (
        <div className="bg-slate-900 text-white rounded-xl border border-slate-700 p-6 space-y-4 animate-slide-up">
          <div className="flex justify-between items-center border-b border-slate-700 pb-3">
            <div>
              <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">Công cụ AI Chuyên nghiệp</span>
              <h4 className="font-bold text-sm text-slate-100">
                Nâng cấp chất lượng: {
                  improvingSection === "partA" 
                    ? "Phần A: Đặt vấn đề" 
                    : improvingSection === "partB" 
                    ? "Phần B: Giải quyết vấn đề" 
                    : "Phần C: Minh chứng & Hiệu quả"
                }
              </h4>
            </div>
            <button
              onClick={() => setImprovingSection(null)}
              className="text-xs text-slate-400 hover:text-white cursor-pointer px-2 py-1 border border-slate-700 hover:border-slate-500 rounded"
            >
              Hủy bỏ
            </button>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Hệ thống sẽ tái cấu trúc luận điểm, sửa lỗi ngôn ngữ tự phát thành văn phong hành chính khoa học của Hội đồng, đồng thời giữ nguyên các số liệu kiểm chứng của bạn.
          </p>

          <div>
            <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1.5">Lưu ý bổ sung cho AI (Tùy chọn)</label>
            <input
              type="text"
              value={improveInstruction}
              onChange={(e) => setImproveInstruction(e.target.value)}
              placeholder="ví dụ: Sát nhập ý này sâu hơn vào đặc thù giáo dục miền núi, làm trang trọng hơn..."
              className="w-full text-xs bg-slate-850 border border-slate-700 rounded-lg px-2.5 py-2.5 text-slate-100 placeholder-slate-500 outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={executeImprovement}
              disabled={improvingLoading}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1 cursor-pointer disabled:bg-slate-700"
            >
              {improvingLoading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Đang hiệu đính câu chữ...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  Khởi động Nâng cấp Văn phong
                </>
              )}
            </button>
          </div>

          {improveError && (
            <p className="text-xs text-red-400 font-semibold bg-red-950/40 p-2.5 rounded border border-red-900/50">{improveError}</p>
          )}

          {improvedTextResult && (
            <div className="border border-slate-700 rounded-lg p-4 bg-slate-950 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Đoạn văn cải tiến tối ưu:</span>
                <button
                  onClick={applySuggestedText}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded cursor-pointer"
                >
                  Áp dụng sửa dán văn bản mới
                </button>
              </div>

              <p className="text-xs text-slate-200 font-sans leading-relaxed whitespace-pre-wrap">{improvedTextResult}</p>

              {improvedReasons.length > 0 && (
                <div className="pt-2 border-t border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Danh mục các chỉnh sửa chuẩn lý thuyết:</span>
                  <ul className="text-[11px] text-slate-400 list-disc list-inside mt-1 space-y-0.5">
                    {improvedReasons.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
