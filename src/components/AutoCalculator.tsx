import React, { useState } from "react";
import { Calculator, Plus, Trash2, TrendingDown, DollarSign, Clock, CheckCircle2 } from "lucide-react";
import { CalcRow } from "../types";

interface AutoCalculatorProps {
  rows: CalcRow[];
  onChangeRows: (newRows: CalcRow[]) => void;
}

export default function AutoCalculator({ rows, onChangeRows }: AutoCalculatorProps) {
  const [label, setLabel] = useState("");
  const [costBefore, setCostBefore] = useState<number>(0);
  const [costAfter, setCostAfter] = useState<number>(0);
  const [laborHoursSaved, setLaborHoursSaved] = useState<number>(0);
  const [laborRatePerHour, setLaborRatePerHour] = useState<number>(100000); // default VND 100k/hr

  const handleAddRow = () => {
    if (!label.trim()) return;
    const newRow: CalcRow = {
      id: Date.now().toString(),
      label: label.trim(),
      costBefore: costBefore || 0,
      costAfter: costAfter || 0,
      laborHoursSaved: laborHoursSaved || 0,
      laborRatePerHour: laborRatePerHour || 0
    };
    onChangeRows([...rows, newRow]);
    setLabel("");
    setCostBefore(0);
    setCostAfter(0);
    setLaborHoursSaved(0);
  };

  const handleRemoveRow = (id: string) => {
    onChangeRows(rows.filter(r => r.id !== id));
  };

  // Calculate totals
  const totalCostBefore = rows.reduce((sum, r) => sum + r.costBefore, 0);
  const totalCostAfter = rows.reduce((sum, r) => sum + r.costAfter, 0);
  const totalLaborHoursSaved = rows.reduce((sum, r) => sum + r.laborHoursSaved, 0);
  const totalLaborWorthSaved = rows.reduce((sum, r) => sum + (r.laborHoursSaved * r.laborRatePerHour), 0);
  
  const directMaterialSavings = totalCostBefore - totalCostAfter;
  const totalFinancialBenefit = directMaterialSavings + totalLaborWorthSaved;

  const currentFormat = (val: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val);
  };

  // Formulating the text block to paste straight into Section C
  const generatedProofText = `Hệ phân tích tài chính & kiểm chứng định lượng tự động ghi nhận tại đơn vị:
1. Chi phí vật tư/quy trình cũ: ${currentFormat(totalCostBefore)}/năm.
2. Chi phí vật tư/quy trình sau tối ưu: ${currentFormat(totalCostAfter)}/năm.
=> Số tiền vật tư tiết kiệm trực tiếp: ${currentFormat(directMaterialSavings)}/năm.
3. Số giờ lao động hành chính tinh giảm: ${totalLaborHoursSaved.toLocaleString()} giờ/năm (Quy đổi giá trị làm lợi dựa trên đơn giá nhân sự trung bình là ${currentFormat(totalLaborWorthSaved)}/năm).
=> TỔNG GIÁ TRỊ LỢI ÍCH KINH TẾ (Định lượng trực tiếp): ${currentFormat(totalFinancialBenefit)}/năm.`;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 overflow-hidden relative">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
      
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
          <Calculator className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-semibold text-slate-800 text-lg">Định lượng Kinh tế Sáng kiến (Auto-Calculation)</h3>
          <p className="text-xs text-slate-500">Tự động tính toán giá trị làm lợi vật tư, thời gian lao động để kết xuất đưa vào Phần C</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Input fields to build rows */}
        <div className="lg:col-span-1 bg-slate-50 border border-slate-200/80 p-4 rounded-xl space-y-4">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Thêm Mục Mục tiêu Lợi ích</h4>
          
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Tên quy trình / Hạng mục</label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Ví dụ: Giấy in phiếu khám, nhân lực trực..."
              className="w-full text-xs border border-slate-200 bg-white rounded-md px-2.5 py-2.5 outline-none focus:border-emerald-500 transition-all font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Chi phí trước (VND)</label>
              <input
                type="number"
                value={costBefore || ""}
                onChange={(e) => setCostBefore(Number(e.target.value))}
                placeholder="0"
                className="w-full text-xs border border-slate-200 bg-white rounded-md px-2 py-2 outline-none focus:border-emerald-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Chi phí sau (VND)</label>
              <input
                type="number"
                value={costAfter || ""}
                onChange={(e) => setCostAfter(Number(e.target.value))}
                placeholder="0"
                className="w-full text-xs border border-slate-200 bg-white rounded-md px-2 py-2 outline-none focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Giờ công giảm/năm</label>
              <input
                type="number"
                value={laborHoursSaved || ""}
                onChange={(e) => setLaborHoursSaved(Number(e.target.value))}
                placeholder="0"
                className="w-full text-xs border border-slate-200 bg-white rounded-md px-2 py-2 outline-none focus:border-emerald-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Lương/giờ bộ phận</label>
              <input
                type="number"
                value={laborRatePerHour || ""}
                onChange={(e) => setLaborRatePerHour(Number(e.target.value))}
                placeholder="100000"
                className="w-full text-xs border border-slate-200 bg-white rounded-md px-2 py-2 outline-none focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          <button
            onClick={handleAddRow}
            disabled={!label.trim()}
            className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-semibold text-xs rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4" /> Thêm vào bảng định lượng
          </button>
        </div>

        {/* Center Side: Active calculations Table */}
        <div className="lg:col-span-2 flex flex-col justify-between">
          <div className="border border-slate-200 rounded-xl overflow-hidden mb-4">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="px-4 py-3">Hạng mục</th>
                  <th className="px-4 py-3 text-right">Trước tối ưu</th>
                  <th className="px-4 py-3 text-right">Sau tối ưu</th>
                  <th className="px-4 py-3 text-right">Giờ công bớt</th>
                  <th className="px-4 py-3 text-center">Xóa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {rows.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/50 transition-all">
                    <td className="px-4 py-3 font-medium text-slate-800">{row.label}</td>
                    <td className="px-4 py-3 text-right text-red-600">{currentFormat(row.costBefore)}</td>
                    <td className="px-4 py-3 text-right text-green-600">{currentFormat(row.costAfter)}</td>
                    <td className="px-4 py-3 text-right font-mono">{row.laborHoursSaved} giờ</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleRemoveRow(row.id)}
                        className="p-1 hover:bg-red-50 text-slate-300 hover:text-red-500 rounded transition-all cursor-pointer inline-flex"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-xs text-slate-400 italic">
                      Chưa có danh mục định lượng tài chính. Hãy thêm ở bảng bên cạnh.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Aggregated widgets and copyable text */}
          {rows.length > 0 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3 bg-red-50/40 rounded-xl border border-red-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-red-700 uppercase tracking-wider">Chi cũ định kỳ</span>
                    <h5 className="font-bold text-slate-800 text-sm mt-0.5">{currentFormat(totalCostBefore)}</h5>
                  </div>
                  <TrendingDown className="w-5 h-5 text-red-400" />
                </div>

                <div className="p-3 bg-green-50/40 rounded-xl border border-green-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Giờ công tiết giảm</span>
                    <h5 className="font-bold text-slate-800 text-sm mt-0.5">{totalLaborHoursSaved} giờ/năm</h5>
                  </div>
                  <Clock className="w-5 h-5 text-emerald-400" />
                </div>

                <div className="p-3 bg-teal-50 rounded-xl border border-teal-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-teal-800 uppercase tracking-wider">TỔNG GIÁ TRỊ LÀM LỢI</span>
                    <h5 className="font-bold text-teal-900 text-sm mt-0.5">{currentFormat(totalFinancialBenefit)}</h5>
                  </div>
                  <DollarSign className="w-5 h-5 text-teal-500 animate-pulse" />
                </div>
              </div>

              {/* Copyable Proof Data box */}
              <div className="bg-slate-900 text-teal-300 p-4 rounded-xl relative group">
                <div className="absolute top-2.5 right-2.5">
                  <button
                    onClick={() => navigator.clipboard.writeText(generatedProofText)}
                    className="px-2 py-1 bg-white/10 hover:bg-white/20 text-white text-[10px] font-semibold rounded transition-all cursor-pointer flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" /> Sao chép minh chứng
                  </button>
                </div>
                <h5 className="text-[10px] font-bold text-teal-400 uppercase tracking-wider mb-2">Báo cáo số liệu minh chứng (Nội dung cho Phần C):</h5>
                <pre className="text-xs font-mono whitespace-pre-wrap leading-relaxed text-slate-200">
                  {generatedProofText}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
