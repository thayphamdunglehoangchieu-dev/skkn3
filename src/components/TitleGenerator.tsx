import React, { useState } from "react";
import { Sparkles, ArrowRight, Check, Copy, Loader2, Info } from "lucide-react";
import { TitleRecommendation } from "../types";

import { generateTitles } from "../services/geminiService";

interface TitleGeneratorProps {
  onSelectTitle: (title: string) => void;
}

export default function TitleGenerator({ onSelectTitle }: TitleGeneratorProps) {
  const [problem, setProblem] = useState("");
  const [solution, setSolution] = useState("");
  const [target, setTarget] = useState("");
  const [loading, setLoading] = useState(false);
  const [titles, setTitles] = useState<TitleRecommendation[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    if (!problem.trim() || !solution.trim()) {
      setError("Vui lòng điền đủ Vấn đề cần giải quyết và Giải pháp cốt lõi.");
      return;
    }
    setError("");
    setLoading(true);
    setTitles([]);
    setSelectedIndex(null);

    try {
      const data = await generateTitles(problem, solution, target);
      if (data && data.titles) {
        setTitles(data.titles);
      } else {
        setError("Không thể tạo tiêu đề gợi ý từ AI.");
      }
    } catch (err: any) {
      setError(`Lỗi kết nối AI: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleApply = (title: string, index: number) => {
    setSelectedIndex(index);
    onSelectTitle(title);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 overflow-hidden relative">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 to-indigo-500"></div>
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2.5 bg-teal-50 text-teal-600 rounded-lg">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-semibold text-slate-800 text-lg">Thiết kế & Gợi ý Tên Đề Tài AI</h3>
          <p className="text-xs text-slate-500">Công thức chuẩn đạt giải cấp Tỉnh/Sở: "Tên giải pháp cụ thể + nhằm nâng cao/phát triển + khía cạch lấp nghẽn + đối với đối tượng học sinh tại Trường X"</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">1. Vấn đề nghẽn / Thực trạng học đường</label>
          <textarea
            value={problem}
            onChange={(e) => setProblem(e.target.value)}
            placeholder="Ví dụ: Học sinh lười đọc sách cảm thụ văn học, trẻ mầm non thụ động sợ xỏ giày dép, điểm thực hành môn Lý chỉ đạt 6.2..."
            rows={3}
            className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition-all resize-none"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">2. Giải pháp / Biện pháp đổi mới sư phạm</label>
          <textarea
            value={solution}
            onChange={(e) => setSolution(e.target.value)}
            placeholder="Ví dụ: Thiết kế bộ thẻ câu chuyện hoạt cảnh vè 4 câu, ứng dụng sơ đồ bong bóng từ vựng đa màu sắc, dạy học sản phẩm STEM robotic..."
            rows={3}
            className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition-all resize-none"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">3. Đối tượng giáo dục & Đơn vị trường</label>
          <textarea
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="Ví dụ: Học sinh lớp 3 trường Tiểu học Alpha, trẻ lớp Lá 5-6 tuổi trường Mầm non Hoa Mai, học sinh lớp 8..."
            rows={3}
            className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition-all resize-none"
          />
        </div>
      </div>

      {error && (
        <div className="mb-4 text-xs font-medium text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">
          {error}
        </div>
      )}

      <button
        onClick={handleGenerate}
        disabled={loading}
        className="w-full md:w-auto px-5 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 text-white font-medium text-sm rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm hover:shadow"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Đóng gói ý tưởng & gợi ý tiêu đề...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            Tạo Tiêu đề Hành chính Đạt chuẩn AI
          </>
        )}
      </button>

      {titles.length > 0 && (
        <div className="mt-6 border-t border-slate-100 pt-5 space-y-3">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest block mb-1">Gợi ý từ Chuyên gia Thẩm định AI:</span>
          
          <div className="grid grid-cols-1 gap-3">
            {titles.map((rec, i) => (
              <div 
                key={i} 
                className={`p-4 rounded-xl border transition-all ${
                  selectedIndex === i 
                    ? "bg-teal-50/50 border-teal-500 ring-2 ring-teal-50/70" 
                    : "bg-slate-50/50 border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-1">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-teal-100 text-teal-800 uppercase">
                      Lựa chọn {i + 1}
                    </span>
                    <h4 className="font-semibold text-slate-800 text-sm leading-relaxed">{rec.title}</h4>
                    <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-2">
                      <Info className="w-3.5 h-3.5 text-teal-500 flex-shrink-0" />
                      {rec.explanation}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => copyToClipboard(rec.title, i)}
                      className="p-1.5 hover:bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-slate-700 transition-all cursor-pointer"
                      title="Sao chép"
                    >
                      {copiedIndex === i ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => handleApply(rec.title, i)}
                      className="px-3 py-1.5 bg-white border border-slate-200 hover:border-teal-500 text-slate-700 hover:text-teal-600 font-medium text-xs rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                    >
                      {selectedIndex === i ? (
                        <>
                          <Check className="w-3 h-3 text-teal-600" />
                          Đang Chọn
                        </>
                      ) : (
                        <>
                          Áp dụng
                          <ArrowRight className="w-3 h-3" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
