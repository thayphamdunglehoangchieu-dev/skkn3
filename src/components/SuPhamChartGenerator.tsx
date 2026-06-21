import React, { useState, useEffect, useRef } from "react";
import { 
  BarChart, 
  TrendingUp, 
  PieChart, 
  Table2, 
  Sparkles, 
  Download, 
  Plus, 
  Trash2, 
  RefreshCw, 
  Info, 
  Copy, 
  Check, 
  AlertCircle,
  HelpCircle
} from "lucide-react";

interface ChartDataItem {
  category: string;
  before: number;
  after: number;
}

interface SuPhamChartGeneratorProps {
  title: string;
  domain: string;
  grade?: string;
  subject?: string;
}

import { suggestChartData } from "../services/geminiService";

export default function SuPhamChartGenerator({ title, domain, grade = "", subject = "" }: SuPhamChartGeneratorProps) {
  // Available templates
  const presets = [
    {
      name: "Phân bổ học lực học sinh",
      chartTitle: "Biểu đồ so sánh xếp loại học lực của học sinh trước và sau khi áp dụng sáng kiến",
      yAxisLabel: "Tỷ lệ học sinh (%)",
      items: [
        { category: "Giỏi / Xuất sắc", before: 12, after: 38 },
        { category: "Khá", before: 28, after: 46 },
        { category: "Trung bình", before: 45, after: 14 },
        { category: "Yếu / Kém", before: 15, after: 2 }
      ],
      commentary: "Nhận xét thực nghiệm: Sau thời gian giảng dạy thực nghiệm kết hợp giải pháp mới, cơ cấu xếp loại học lực lớp học đã chuyển dịch mạnh mẽ theo hướng tích cực. Tỷ lệ học sinh đạt loại Giỏi/Xuất sắc tăng vọt 26% (từ 12% lên 38%), trong khi tỷ lệ yếu kém sụt giảm triệt thoái chỉ còn 2%, chứng minh độ hiệu quả sâu sắc của sáng kiến sư phạm mới."
    },
    {
      name: "Thái độ & Mức độ hứng thú",
      chartTitle: "Biểu đồ so sánh mức độ tích cực hứng thú hoạt động học tập của học sinh",
      yAxisLabel: "Tỷ lệ bình chọn (%)",
      items: [
        { category: "Rất hứng thú", before: 18, after: 55 },
        { category: "Hứng thú học", before: 22, after: 35 },
        { category: "Bình thường", before: 45, after: 10 },
        { category: "Thụ động/Chán nản", before: 15, after: 0 }
      ],
      commentary: "Nhận xét định lượng: Số liệu khảo sát tâm lý lớp học cho thấy sự cải thiện tâm lý học tập rõ rệt. Số lượng học sinh cực kỳ yêu thích tiết học vượt ngưỡng từ 18% lên 55%, hoàn toàn loại bỏ tình trạng mệt mỏi thụ động (bản nháp ban đầu ghi nhận 15% chán nản nay về 0%). Sự chuyển đổi này nâng đỡ hứng khởi tự nhiên của học sinh."
    },
    {
      name: "Điểm kiểm tra trung bình",
      chartTitle: "Báo cáo điểm số các bài khảo sát thực nghiệm định kỳ trong năm học (Thang 10)",
      yAxisLabel: "Điểm trung bình lớp",
      items: [
        { category: "Khảo sát đầu năm", before: 5.6, after: 5.6 },
        { category: "Đánh giá giữa kỳ I", before: 5.8, after: 6.9 },
        { category: "Tổng kết kỳ I", before: 6.1, after: 7.8 },
        { category: "Tổng kết kỳ II", before: 6.2, after: 8.5 }
      ],
      commentary: "Nhận xét tiến trình: Điểm bình quân lớp tăng tiến bền vững qua từng giai đoạn đánh giá. Điểm khảo sát thực nghiệm ban đầu của hai nhóm khá tương đồng (5.6 điểm), tuy nhiên sau khi nhóm thực nghiệm áp dụng đổi mới, điểm số cuối năm bứt phá đạt ngưỡng 8.5 điểm (tăng 2.3 điểm so với lối dạy cũ truyền thống), thể hiện tính đột phá thực chất của giáo trình cải tiến."
    }
  ];

  // Current State
  const [chartTitle, setChartTitle] = useState(presets[0].chartTitle);
  const [yAxisLabel, setYAxisLabel] = useState(presets[0].yAxisLabel);
  const [items, setItems] = useState<ChartDataItem[]>(presets[0].items);
  const [commentary, setCommentary] = useState(presets[0].commentary);
  const [chartType, setChartType] = useState<"bar" | "line" | "pie" | "table">("bar");
  
  // UI Loading/Copy & Error states
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [copiedComment, setCopiedComment] = useState(false);
  const [themeColor, setThemeColor] = useState<"indigo" | "teal" | "amber" | "rose">("indigo");

  // Canvas ref for image compilation
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Apply a preset directly
  const handleApplyPreset = (idx: number) => {
    const cur = presets[idx];
    setChartTitle(cur.chartTitle);
    setYAxisLabel(cur.yAxisLabel);
    setItems(JSON.parse(JSON.stringify(cur.items)));
    setCommentary(cur.commentary);
    setAiError("");
  };

  // Modify a data point value
  const handleUpdateItem = (index: number, field: keyof ChartDataItem, value: any) => {
    const newItems = [...items];
    if (field === "category") {
      newItems[index].category = value;
    } else {
      const num = parseFloat(value) || 0;
      newItems[index][field] = num;
    }
    setItems(newItems);
  };

  // Add category row
  const handleAddRow = () => {
    setItems([...items, { category: "Tiêu chí mới " + (items.length + 1), before: 20, after: 50 }]);
  };

  // Remove category row
  const handleRemoveRow = (index: number) => {
    if (items.length <= 1) return;
    const newItems = items.filter((_, idx) => idx !== index);
    setItems(newItems);
  };

  // Copy Analysis Commentary to clipboard
  const handleCopyCommentary = () => {
    navigator.clipboard.writeText(commentary);
    setCopiedComment(true);
    setTimeout(() => setCopiedComment(false), 2000);
  };

  // Call API to automatically suggest custom stats matching the user's current project title
  const handleSuggestDataWithAI = async () => {
    if (!title || !title.trim()) {
      setAiError("Vui lòng ghi nhận 'Tên đề tài/Sáng kiến' tại tab Workspace trước khi gọi đề xuất.");
      return;
    }
    setAiLoading(true);
    setAiError("");

    try {
      const data = await suggestChartData(title, domain, grade, subject);
      if (data && data.items && data.items.length > 0) {
        setChartTitle(data.chartTitle || `Biểu đồ so sánh số liệu: ${title}`);
        setYAxisLabel(data.yAxisLabel || "Tỷ lệ (%)");
        setItems(data.items);
        setCommentary(data.commentary || "Gợi ý nhận xét thực nghiệm tự động...");
      } else {
        setAiError("Không nhận được phản hồi dữ liệu từ máy chủ AI.");
      }
    } catch (err: any) {
      setAiError(`Lỗi kết nối AI: ${err.message || err}`);
    } finally {
      setAiLoading(false);
    }
  };

  // Custom high-resolution Canvas drawing to export PNG image dynamically
  const handleDownloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Define colors based on selected theme
    const colors = {
      indigo: { before: "#94a3b8", after: "#4f46e5", textBefore: "Môi trường cũ (Trước SK)", textAfter: "Môi trường đổi mới (Sau SK)" },
      teal: { before: "#cbd5e1", after: "#0d9488", textBefore: "Trước áp dụng", textAfter: "Sau áp dụng" },
      amber: { before: "#fcd34d", after: "#d97706", textBefore: "Lớp học chuẩn (Before)", textAfter: "Lớp thực nghiệm (After)" },
      rose: { before: "#fda4af", after: "#e11d48", textBefore: "Chưa cải tiến", textAfter: "Có sáng kiến" }
    }[themeColor];

    // Set canvas dimensions
    const width = 1000;
    const height = 650;
    canvas.width = width;
    canvas.height = height;

    // White background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

    // Rounded Border
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 2;
    ctx.strokeRect(5, 5, width - 10, height - 10);

    // Decorative Header brand
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(6, 6, width - 12, 50);
    ctx.font = "bold 13px 'Times New Roman', Times, serif";
    ctx.fillStyle = "#64748b";
    ctx.fillText("HỘI ĐỒNG KIỂM ĐỊNH KHOA HỌC SƯ PHẠM - BẢNG SỐ LIỆU MINH CHỨNG", 30, 36);

    // Draw main chart title with text wrap
    ctx.font = "bold 20px 'Times New Roman', Times, serif";
    ctx.fillStyle = "#1e293b";
    
    // Simple text wrapping for title
    const maxTitleWidth = width - 100;
    const words = chartTitle.split(" ");
    let line = "";
    let titleY = 105;
    for (let n = 0; n < words.length; n++) {
      let testLine = line + words[n] + " ";
      let metrics = ctx.measureText(testLine);
      if (metrics.width > maxTitleWidth && n > 0) {
        ctx.fillText(line, 50, titleY);
        line = words[n] + " ";
        titleY += 26;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, 50, titleY);

    // Grid coordinates
    const chartX = 100;
    const chartY = titleY + 45;
    const chartW = width - 150;
    const chartH = height - chartY - 120;

    // Y Axis labels and helper rules
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 1;
    ctx.font = "12px Arial";
    ctx.fillStyle = "#4b5563";

    if (chartType === "bar" || chartType === "line") {
      // Find max value in dataset to scale axis properly
      const maxVal = Math.max(...items.flatMap(i => [i.before, i.after]), 10);
      const scaleMax = Math.ceil(maxVal / 10) * 10;
      
      const linesCount = 5;
      for (let i = 0; i <= linesCount; i++) {
        const val = (scaleMax / linesCount) * i;
        const py = chartY + chartH - (chartH / linesCount) * i;
        
        ctx.beginPath();
        ctx.moveTo(chartX, py);
        ctx.lineTo(chartX + chartW, py);
        ctx.stroke();

        ctx.textAlign = "right";
        ctx.fillText(val.toFixed(0), chartX - 12, py + 4);
      }

      // Draw axis vertical labels
      ctx.save();
      ctx.translate(chartX - 55, chartY + chartH / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.textAlign = "center";
      ctx.font = "bold 13px 'Times New Roman', Times, serif";
      ctx.fillText(yAxisLabel, 0, 0);
      ctx.restore();

      // Render chart specific data
      const colWidth = chartW / items.length;

      if (chartType === "bar") {
        items.forEach((item, index) => {
          const cx = chartX + index * colWidth;
          const barW = colWidth * 0.3;
          const spacing = colWidth * 0.08;

          const beforeH = (item.before / scaleMax) * chartH;
          const afterH = (item.after / scaleMax) * chartH;

          const bx1 = cx + (colWidth - barW * 2 - spacing) / 2;
          const by1 = chartY + chartH - beforeH;
          const bx2 = bx1 + barW + spacing;
          const by2 = chartY + chartH - afterH;

          // Before bar
          ctx.fillStyle = colors.before;
          ctx.fillRect(bx1, by1, barW, beforeH);
          ctx.strokeStyle = "#475569";
          ctx.lineWidth = 1;
          ctx.strokeRect(bx1, by1, barW, beforeH);

          // After bar
          ctx.fillStyle = colors.after;
          ctx.fillRect(bx2, by2, barW, afterH);
          ctx.strokeRect(bx2, by2, barW, afterH);

          // Values on top of bars
          ctx.fillStyle = "#334155";
          ctx.font = "bold 12px Arial";
          ctx.textAlign = "center";
          ctx.fillText(item.before.toString(), bx1 + barW / 2, by1 - 6);
          ctx.fillStyle = colors.after;
          ctx.fillText(item.after.toString(), bx2 + barW / 2, by2 - 6);

          // X Axis category labels
          ctx.fillStyle = "#1e293b";
          ctx.font = "bold 13px 'Times New Roman', serif";
          ctx.fillText(item.category, cx + colWidth / 2, chartY + chartH + 24);
        });

      } else if (chartType === "line") {
        // Draw trend curve
        const drawLinePath = (dataKey: "before" | "after", strokeColor: string, lineWidth: number) => {
          ctx.beginPath();
          items.forEach((item, index) => {
            const cx = chartX + index * colWidth + colWidth / 2;
            const cy = chartY + chartH - (item[dataKey] / scaleMax) * chartH;
            if (index === 0) ctx.moveTo(cx, cy);
            else ctx.lineTo(cx, cy);
          });
          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = lineWidth;
          ctx.stroke();

          // Nodes
          items.forEach((item, index) => {
            const cx = chartX + index * colWidth + colWidth / 2;
            const cy = chartY + chartH - (item[dataKey] / scaleMax) * chartH;
            
            ctx.beginPath();
            ctx.arc(cx, cy, 6, 0, Math.PI * 2);
            ctx.fillStyle = strokeColor;
            ctx.fill();
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.fillStyle = "#1e293b";
            ctx.font = "bold 11px Arial";
            ctx.textAlign = "center";
            ctx.fillText(item[dataKey].toString(), cx, cy - 10);
          });
        };

        // Draw Before & After trends
        drawLinePath("before", colors.before, 3);
        drawLinePath("after", colors.after, 4);

        // Category labels
        items.forEach((item, index) => {
          const cx = chartX + index * colWidth + colWidth / 2;
          ctx.font = "bold 13px 'Times New Roman', serif";
          ctx.fillStyle = "#1e293b";
          ctx.fillText(item.category, cx, chartY + chartH + 24);
        });
      }

      // Draw Main axes baseline
      ctx.beginPath();
      ctx.strokeStyle = "#475569";
      ctx.lineWidth = 1.5;
      ctx.moveTo(chartX, chartY);
      ctx.lineTo(chartX, chartY + chartH);
      ctx.lineTo(chartX + chartW, chartY + chartH);
      ctx.stroke();

      // Legend box
      const legendY = chartY + chartH + 65;
      ctx.font = "12px Arial";
      
      // Before marker
      ctx.fillStyle = colors.before;
      ctx.fillRect(chartX + 150, legendY - 10, 16, 12);
      ctx.strokeStyle = "#475569";
      ctx.strokeRect(chartX + 150, legendY - 10, 16, 12);
      ctx.fillStyle = "#334155";
      ctx.textAlign = "left";
      ctx.fillText(colors.textBefore, chartX + 175, legendY);

      // After marker
      ctx.fillStyle = colors.after;
      ctx.fillRect(chartX + 450, legendY - 10, 16, 12);
      ctx.strokeRect(chartX + 450, legendY - 10, 16, 12);
      ctx.fillStyle = "#334155";
      ctx.fillText(colors.textAfter, chartX + 475, legendY);

    } else if (chartType === "pie") {
      // Draw standard distribution comparison Pie charts (divided Left: Before, Right: After)
      const centerX1 = width * 0.28;
      const centerX2 = width * 0.72;
      const centerY = chartY + chartH / 2 - 10;
      const radius = 100;

      const pieColors = ["#4f46e5", "#06b6d4", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

      const drawPie = (centerX: number, isAfter: boolean) => {
        const total = items.reduce((sum, item) => sum + (isAfter ? item.after : item.before), 0);
        let startAngle = -Math.PI / 2;

        items.forEach((item, index) => {
          const val = isAfter ? item.after : item.before;
          if (val <= 0) return;
          const sliceAngle = (val / total) * Math.PI * 2;

          ctx.beginPath();
          ctx.moveTo(centerX, centerY);
          ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
          ctx.closePath();

          ctx.fillStyle = pieColors[index % pieColors.length];
          ctx.fill();
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Percent Text
          const middleAngle = startAngle + sliceAngle / 2;
          const textX = centerX + Math.cos(middleAngle) * (radius * 0.65);
          const textY = centerY + Math.sin(middleAngle) * (radius * 0.65);
          
          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 11px Arial";
          ctx.textAlign = "center";
          const percent = ((val / total) * 100).toFixed(0) + "%";
          ctx.fillText(percent, textX, textY);

          startAngle += sliceAngle;
        });

        // Label under pie chart
        ctx.fillStyle = "#1e293b";
        ctx.font = "bold 15px 'Times New Roman', serif";
        ctx.textAlign = "center";
        ctx.fillText(isAfter ? colors.textAfter : colors.textBefore, centerX, centerY + radius + 30);
      };

      drawPie(centerX1, false);
      drawPie(centerX2, true);

      // Shared color legend
      const legendRowsY = chartY + chartH + 50;
      let startLx = 120;
      items.forEach((item, idx) => {
        ctx.fillStyle = pieColors[idx % pieColors.length];
        ctx.fillRect(startLx, legendRowsY, 15, 12);
        ctx.fillStyle = "#334155";
        ctx.font = "bold 12px 'Times New Roman', serif";
        ctx.textAlign = "left";
        ctx.fillText(item.category, startLx + 22, legendRowsY + 10);
        startLx += 210;
      });

    } else if (chartType === "table") {
      // Academic double-border aligned data table
      const startTX = 100;
      const startTY = chartY + 20;
      const tWidth = width - 200;
      const rowHeight = 45;

      const headers = ["Chỉ số đánh giá/Xếp loại", colors.textBefore, colors.textAfter, "Thay đổi tăng/giảm (%)"];
      
      // Draw table stroke
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#1e293b";
      ctx.strokeRect(startTX, startTY, tWidth, (items.length + 1) * rowHeight);

      // Header row
      ctx.fillStyle = "#f8fafc";
      ctx.fillRect(startTX + 1, startTY + 1, tWidth - 2, rowHeight - 2);
      ctx.beginPath();
      ctx.moveTo(startTX, startTY + rowHeight);
      ctx.lineTo(startTX + tWidth, startTY + rowHeight);
      ctx.stroke();

      // Horizontal lines
      ctx.lineWidth = 1;
      items.forEach((_, idx) => {
        ctx.beginPath();
        ctx.moveTo(startTX, startTY + (idx + 2) * rowHeight);
        ctx.lineTo(startTX + tWidth, startTY + (idx + 2) * rowHeight);
        ctx.stroke();
      });

      // Columns dividers
      const colWidths = [tWidth * 0.4, tWidth * 0.2, tWidth * 0.2, tWidth * 0.2];
      let currentX = startTX;
      for (let c = 0; c < 3; c++) {
        currentX += colWidths[c];
        ctx.beginPath();
        ctx.moveTo(currentX, startTY);
        ctx.lineTo(currentX, startTY + (items.length + 1) * rowHeight);
        ctx.stroke();
      }

      // Draw header text
      ctx.font = "bold 14px 'Times New Roman', serif";
      ctx.fillStyle = "#0f172a";
      ctx.textAlign = "center";
      
      let curXText = startTX;
      headers.forEach((h, idx) => {
        const textCenterIdx = curXText + colWidths[idx] / 2;
        ctx.fillText(h, textCenterIdx, startTY + 28);
        curXText += colWidths[idx];
      });

      // Draw row cell values
      ctx.font = "14px 'Times New Roman', serif";
      items.forEach((item, rowIndex) => {
        const ry = startTY + (rowIndex + 1) * rowHeight;
        
        // Category Label
        ctx.textAlign = "left";
        ctx.fillStyle = "#1e293b";
        ctx.fillText(" " + item.category, startTX + 15, ry + 28);

        // Before Value
        ctx.textAlign = "center";
        ctx.fillText(item.before + "%", startTX + colWidths[0] + colWidths[1]/2, ry + 28);

        // After Value
        ctx.font = "bold 14px 'Times New Roman', serif";
        ctx.fillStyle = colors.after;
        ctx.fillText(item.after + "%", startTX + colWidths[0] + colWidths[1] + colWidths[2]/2, ry + 28);

        // Change percentage
        const diff = item.after - item.before;
        ctx.font = "bold 14px 'Times New Roman', serif";
        if (diff > 0) {
          ctx.fillStyle = "#16a34a"; // Green
          ctx.fillText(`+${diff.toFixed(1)}%`, startTX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3]/2, ry + 28);
        } else if (diff < 0) {
          ctx.fillStyle = "#dc2626"; // Red
          ctx.fillText(`${diff.toFixed(1)}%`, startTX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3]/2, ry + 28);
        } else {
          ctx.fillStyle = "#4b5563"; // gray
          ctx.fillText("0.0%", startTX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3]/2, ry + 28);
        }
        ctx.font = "14px 'Times New Roman', serif";
      });
    }

    // Double Border academic bottom note
    ctx.font = "italic 12px 'Times New Roman', serif";
    ctx.fillStyle = "#475569";
    ctx.textAlign = "center";
    ctx.fillText("Trích lục số liệu báo cáo đề tài thực nghiệm sư pháp cấp Quốc gia / Số hóa năm 2026", width / 2, height - 25);

    // Save image
    const dataURL = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = dataURL;
    link.download = `SANG_KIEN_BIEU_DO-${chartType.toUpperCase()}.png`;
    link.click();
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
      
      {/* Upper Title Block */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center border border-teal-200">
            <BarChart className="w-5 h-5 text-teal-600 animate-pulse" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-base">Bộ Đề Xuất & Vẽ Biểu Đồ Thống Kê Học Thuật</h3>
            <p className="text-xs text-slate-500">Giúp tạo nhanh hình ảnh bảng số liệu, biểu đồ so sánh Trước/Sau để đính kèm file Word.</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSuggestDataWithAI}
          disabled={aiLoading}
          className="px-4 py-2.5 bg-gradient-to-r from-teal-600 to-indigo-600 hover:from-teal-700 hover:to-indigo-700 disabled:from-slate-300 disabled:to-slate-300 text-white font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shadow-indigo-100 shrink-0"
        >
          {aiLoading ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
              AI Đang thiết kế chỉ số...
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-bounce" />
              AI Thiết Lập Số Liệu Theo Đề Tài
            </>
          )}
        </button>
      </div>

      {aiError && (
        <div className="text-xs text-red-600 bg-red-50 p-3 rounded-lg border border-red-100 flex items-start gap-1.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Cảnh báo: </span>{aiError}
          </div>
        </div>
      )}

      {/* Grid Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left block Control: Customize Category & values */}
        <div className="lg:col-span-4 bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Tinh chỉnh dữ liệu thủ công</h4>
            <p className="text-[11px] text-slate-500">Thầy cô tự ý biên tập dữ liệu hoặc sử dụng mẫu bên dưới.</p>
          </div>

          {/* Quick presets selectors */}
          <div className="grid grid-cols-3 gap-1.5">
            {presets.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleApplyPreset(idx)}
                className="py-1 px-1.5 border border-slate-200 bg-white hover:bg-indigo-50 text-[10px] rounded hover:border-indigo-400 font-bold text-slate-600 transition-all text-ellipsis overflow-hidden whitespace-nowrap cursor-pointer"
                title={p.name}
              >
                📊 {p.name}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {/* Chart Title Text input */}
            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">Mô tả nhãn biểu đồ</label>
              <input
                type="text"
                value={chartTitle}
                onChange={(e) => setChartTitle(e.target.value)}
                className="w-full text-xs bg-white border border-slate-200 rounded p-2 outline-none focus:border-indigo-500 font-bold text-slate-800"
                placeholder="Nhập tiêu đề cho biểu đồ..."
              />
            </div>

            {/* Y axis text label */}
            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">Trục tung (Y-Axis)</label>
              <input
                type="text"
                value={yAxisLabel}
                onChange={(e) => setYAxisLabel(e.target.value)}
                className="w-full text-xs bg-white border border-slate-200 rounded p-2 outline-none focus:border-indigo-500 text-slate-700"
                placeholder="Tỷ lệ % hoặc Điểm khảo sát..."
              />
            </div>
          </div>

          {/* Table of categories */}
          <div className="space-y-2.5 pt-2 border-t border-slate-200">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Hạng mục so sánh</span>
              <button
                type="button"
                onClick={handleAddRow}
                className="text-[9.5px] bg-indigo-50 hover:bg-indigo-100 hover:text-indigo-800 text-indigo-700 font-bold px-2 py-1 rounded border border-indigo-200 flex items-center gap-0.5 cursor-pointer"
              >
                <Plus className="w-3 h-3" /> Thêm tiêu chí
              </button>
            </div>

            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin">
              {items.map((item, idx) => (
                <div key={idx} className="bg-white border border-slate-200 p-2 rounded-lg space-y-1.5 relative group">
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={item.category}
                      onChange={(e) => handleUpdateItem(idx, "category", e.target.value)}
                      className="flex-1 text-[11px] font-bold text-slate-700 focus:bg-slate-50 border-0 border-b border-dashed border-slate-200 outline-none p-0.5"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveRow(idx)}
                      disabled={items.length <= 1}
                      className="text-slate-400 hover:text-red-600 opacity-60 hover:opacity-100 disabled:opacity-30 cursor-pointer"
                      title="Xóa dòng"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[9px] text-slate-400 block font-semibold uppercase">Trước Sáng kiến</span>
                      <input
                        type="number"
                        step="0.1"
                        value={item.before}
                        onChange={(e) => handleUpdateItem(idx, "before", e.target.value)}
                        className="w-full text-xs bg-slate-50 focus:bg-white border border-slate-200 rounded px-1.5 py-0.5 outline-none font-semibold text-slate-600"
                      />
                    </div>
                    <div>
                      <span className="text-[9px] text-indigo-500 block font-semibold uppercase">Sau Sáng kiến</span>
                      <input
                        type="number"
                        step="0.1"
                        value={item.after}
                        onChange={(e) => handleUpdateItem(idx, "after", e.target.value)}
                        className="w-full text-xs bg-slate-50 focus:bg-white border border-slate-200 rounded px-1.5 py-0.5 outline-none font-bold text-indigo-700"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right block: Live visual preview & download capability */}
        <div className="lg:col-span-8 space-y-5">
          
          <div className="bg-slate-900 text-slate-100 rounded-xl overflow-hidden border border-slate-800 shadow-lg flex flex-col">
            
            {/* Preview Toolbar */}
            <div className="bg-slate-950 p-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-500"></span>
                <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                <span className="w-3 h-3 rounded-full bg-green-500"></span>
                <span className="text-xs font-bold text-slate-400 ml-2 uppercase tracking-wide">Khoa học sư phạm trực quan</span>
              </div>

              {/* Chart Selector options */}
              <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700 text-xs font-extrabold">
                <button
                  type="button"
                  onClick={() => setChartType("bar")}
                  className={`px-2.5 py-1 rounded transition-all cursor-pointer flex items-center gap-1 ${
                    chartType === "bar" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <BarChart className="w-3.5 h-3.5" /> Thống kê cột kép
                </button>
                <button
                  type="button"
                  onClick={() => setChartType("line")}
                  className={`px-2.5 py-1 rounded transition-all cursor-pointer flex items-center gap-1 ${
                    chartType === "line" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5" /> Đường tiễn trình
                </button>
                <button
                  type="button"
                  onClick={() => setChartType("pie")}
                  className={`px-2.5 py-1 rounded transition-all cursor-pointer flex items-center gap-1 ${
                    chartType === "pie" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <PieChart className="w-3.5 h-3.5" /> Cơ cấu hình tròn
                </button>
                <button
                  type="button"
                  onClick={() => setChartType("table")}
                  className={`px-2.5 py-1 rounded transition-all cursor-pointer flex items-center gap-1 ${
                    chartType === "table" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Table2 className="w-3.5 h-3.5" /> Bảng học thuật
                </button>
              </div>
            </div>

            {/* LIVE DISPLAY EMBED */}
            <div className="p-6 bg-white min-h-[350px] flex flex-col justify-between items-center text-slate-900 border-b border-slate-200 relative">
              <div className="w-full text-center mb-6">
                <h4 className="font-extrabold text-sm sm:text-base text-slate-800 tracking-tight leading-relaxed font-serif">
                  {chartTitle}
                </h4>
              </div>

              {/* Visualized graphs using standard inline responsive CSS/SVG structures (Guarantees infinite layout scaling) */}
              <div className="w-full flex-1 flex items-center justify-center min-h-[220px]">
                
                {chartType === "bar" && (
                  <div className="w-full max-w-lg flex items-end justify-between h-48 border-b-2 border-l-2 border-slate-300 pb-2 pl-4 pr-2 select-none">
                    {items.map((item, id) => {
                      const beforeHeight = Math.min(Math.max((item.before / 100) * 100, 10), 100);
                      const afterHeight = Math.min(Math.max((item.after / 100) * 100, 10), 100);
                      return (
                        <div key={id} className="flex-1 flex flex-col items-center justify-end mx-2 h-full">
                          <div className="flex items-end gap-2.5 h-full w-full justify-center">
                            {/* Before */}
                            <div className="flex flex-col items-center justify-end h-full w-4 sm:w-6 group relative">
                              <span className="text-[9px] font-bold text-slate-400 mb-1">{item.before}%</span>
                              <div 
                                style={{ height: `${beforeHeight}%` }} 
                                className="w-full bg-slate-300 border border-slate-400 rounded-t-xs hover:bg-slate-400 transition-all duration-300"
                              ></div>
                              <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 bg-slate-800 text-white text-[9px] px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
                                Trước áp dụng: {item.before}%
                              </span>
                            </div>
                            {/* After */}
                            <div className="flex flex-col items-center justify-end h-full w-4 sm:w-6 group relative">
                              <span className="text-[9px] font-black text-indigo-600 mb-1">{item.after}%</span>
                              <div 
                                style={{ height: `${afterHeight}%` }} 
                                className="w-full bg-gradient-to-t from-indigo-600 to-indigo-500 border border-indigo-700 rounded-t-xs hover:from-indigo-700 transition-all duration-300 shadow-xs"
                              ></div>
                              <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 bg-indigo-950 text-white text-[9px] px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
                                Sau cải tiến: {item.after}%
                              </span>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold text-slate-600 mt-2 font-serif text-center line-clamp-1 h-4">
                            {item.category}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {chartType === "line" && (
                  <div className="w-full max-w-lg flex flex-col justify-between h-48 select-none relative pb-6 border-b-2 border-l-2 border-slate-300 pl-4">
                    {/* SVG Curve lines */}
                    <svg className="w-full h-full absolute inset-0 pt-3 pb-6 px-10" viewBox="0 0 100 100" preserveAspectRatio="none">
                      {/* Before grid lines */}
                      <path 
                        d={items.map((it, idx) => {
                          const px = (idx / (items.length - 1)) * 100;
                          const py = 100 - it.before;
                          return `${idx === 0 ? "M" : "L"} ${px} ${py}`;
                        }).join(" ")}
                        fill="none"
                        stroke="#cbd5e1"
                        strokeWidth="2.5"
                        strokeDasharray="4"
                      />
                      {/* After curve lines */}
                      <path 
                        d={items.map((it, idx) => {
                          const px = (idx / (items.length - 1)) * 100;
                          const py = 100 - it.after;
                          return `${idx === 0 ? "M" : "L"} ${px} ${py}`;
                        }).join(" ")}
                        fill="none"
                        stroke="#4f46e5"
                        strokeWidth="3"
                      />
                    </svg>

                    {/* Overlay dynamic nodes */}
                    <div className="w-full h-full flex justify-between px-6 relative z-10 font-serif">
                      {items.map((item, id) => (
                        <div key={id} className="flex-1 flex flex-col justify-between items-center h-full relative">
                          <div className="text-[10px] bg-slate-100 border border-slate-300 rounded font-black text-slate-600 px-1 hover:scale-105 transition-all">
                            {item.before}
                          </div>
                          
                          <div className="text-[10px] bg-indigo-50 border border-indigo-400 rounded font-black text-indigo-700 px-1 shadow-xs hover:scale-115 transition-all">
                            {item.after}
                          </div>

                          <div className="text-[10px] text-slate-600 font-bold absolute bottom-[-24px] text-center">
                            {item.category}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {chartType === "pie" && (
                  <div className="w-full flex justify-around items-center gap-4 flex-wrap">
                    {/* Before Pie representation */}
                    <div className="flex flex-col items-center">
                      <div className="w-24 h-24 rounded-full border-4 border-slate-200 bg-slate-100 flex items-center justify-center shadow-inner relative">
                        <span className="text-[11px] font-bold text-slate-600">Trước áp dụng</span>
                        <div className="absolute inset-2 rounded-full border-2 border-dashed border-indigo-300 opacity-40"></div>
                      </div>
                      <div className="mt-1.5 space-y-0.5 text-center">
                        {items.slice(0, 3).map((it, idx) => (
                          <span key={idx} className="block text-[9px] text-slate-500">{it.category}: {it.before}%</span>
                        ))}
                      </div>
                    </div>

                    <div className="w-0.5 h-16 bg-slate-100 hidden sm:block"></div>

                    {/* After Pie representation */}
                    <div className="flex flex-col items-center">
                      <div className="w-28 h-28 rounded-full border-4 border-indigo-500 bg-indigo-50 flex items-center justify-center shadow-md border-t-teal-400 border-l-purple-500 relative animate-pulse">
                        <span className="text-[11px] font-black text-indigo-800 text-center uppercase tracking-wider">Có cải tiến</span>
                        <div className="absolute top-1 right-2 w-2 h-2 rounded-full bg-teal-400 animate-spin"></div>
                      </div>
                      <div className="mt-1.5 space-y-0.5 text-center">
                        {items.slice(0, 3).map((it, idx) => (
                          <span key={idx} className="block text-[9px] text-indigo-700 font-bold">{it.category}: {it.after}%</span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {chartType === "table" && (
                  <div className="w-full overflow-x-auto">
                    <table className="w-full border-2 border-slate-800 border-collapse text-left text-[11px] font-serif">
                      <thead>
                        <tr className="bg-slate-100 border-b-2 border-slate-800 font-bold text-slate-900">
                          <th className="p-2.5 border-r border-slate-800">Tiêu chí đo lường</th>
                          <th className="p-2.5 border-r border-slate-800 text-center">Trước áp dụng (Bf)</th>
                          <th className="p-2.5 border-r border-slate-800 text-center">Sau cải tiến (Af)</th>
                          <th className="p-2.5 text-center">Biến thiên lệch (%)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item, idx) => {
                          const delta = item.after - item.before;
                          return (
                            <tr key={idx} className="hover:bg-slate-50 odd:bg-stone-50 border-b border-stone-200">
                              <td className="p-2 border-r border-stone-200 font-bold">{item.category}</td>
                              <td className="p-2 border-r border-stone-200 text-center text-slate-500">{item.before}%</td>
                              <td className="p-2 border-r border-stone-200 text-center text-indigo-700 font-black">{item.after}%</td>
                              <td className="p-2 text-center">
                                {delta > 0 ? (
                                  <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-black text-[10px]">+ {delta.toFixed(1)}%</span>
                                ) : delta < 0 ? (
                                  <span className="bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded font-black text-[10px]">{delta.toFixed(1)}%</span>
                                ) : (
                                  <span className="text-slate-400">---</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

              </div>

              {/* Shared Legend on live display */}
              {chartType !== "table" && (
                <div className="w-full flex items-center justify-center gap-10 mt-4 border-t border-slate-100 pt-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 bg-slate-300 border border-slate-400 rounded-xs"></span>
                    <span className="text-xs text-slate-500 font-serif">Môi trường cũ (Trước áp dụng)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 bg-indigo-600 rounded-xs"></span>
                    <span className="text-xs text-indigo-800 font-serif font-bold">Thực nghiệm (Sau sáng kiến)</span>
                  </div>
                </div>
              )}
            </div>

            {/* Hidden export canvas container for compiling PNG downloads */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Bottom Image Exporter controls */}
            <div className="p-4 bg-slate-950 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-400">Chọn tông màu biểu đồ:</span>
                <div className="flex gap-2">
                  {(["indigo", "teal", "amber", "rose"] as const).map((col) => (
                    <button
                      key={col}
                      type="button"
                      onClick={() => setThemeColor(col)}
                      className={`w-5 h-5 rounded-full cursor-pointer border hover:scale-110 active:scale-95 transition-all ${
                        col === "indigo" ? "bg-indigo-600" :
                        col === "teal" ? "bg-teal-600" :
                        col === "amber" ? "bg-amber-600" : "bg-rose-600"
                      } ${themeColor === col ? "ring-2 ring-white ring-offset-2 ring-offset-slate-950" : "border-transparent"}`}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-2.5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleDownloadImage}
                  className="w-full sm:w-auto px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-emerald-900 transition-all hover:scale-[1.02]"
                >
                  <Download className="w-4 h-4 text-emerald-200" />
                  Xuất & Tải Ảnh Biểu Đồ (.PNG)
                </button>
              </div>
            </div>

          </div>

          {/* AI generated Narrative Section commentary */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-slate-800">
                <Info className="w-4 h-4 text-indigo-600" />
                <h4 className="text-xs font-bold uppercase tracking-wider">Lời Phân Tích Thực Nghiệm Thể Thuyết</h4>
              </div>

              <button
                type="button"
                onClick={handleCopyCommentary}
                className="text-[10px] text-indigo-700 hover:text-indigo-900 font-bold bg-white hover:bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200 flex items-center gap-1 transition-all cursor-pointer"
              >
                {copiedComment ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-indigo-600" />}
                {copiedComment ? "Đã sao chép!" : "Sao chép dán vào Phần C"}
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed italic border-l-4 border-indigo-200 pl-3.5 select-text">
              {commentary}
            </p>

            <div className="text-[10px] text-slate-500 bg-white p-2.5 rounded border border-slate-200 leading-relaxed">
              💡 <b>Gợi ý sư phạm:</b> Thầy cô có thể chụp hoặc tải ảnh biểu đồ này bằng nút <b>"Xuất & Tải Ảnh Biểu Đồ (.PNG)"</b> ở trên và dán trực tiếp vào file Word báo cáo sáng kiến kinh nghiệm để đính kèm hồ sơ dự thi cực kỳ chuyên nghiệp và thuyết phục!
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
