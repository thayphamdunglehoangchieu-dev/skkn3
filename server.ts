import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Middleware for JSON parsing with safety limits
app.use(express.json({ limit: "20mb" }));

// Lazy initializer for Google GenAI to handle missing keys gracefully on startup
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY || "";
    if (!key || key === "MY_GEMINI_API_KEY") {
      throw new Error("GEMINI_API_KEY is not configured. Please add it to your Secrets in Settings.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// ----------------------------------------------------
// API ENDPOINTS FOR INNO-SCIENCE ASSISTANT
// ----------------------------------------------------

/**
 * 1. AI Title Generator: Problems + Solutions + Targets => Suggest standard titles
 */
app.post("/api/generate-title", async (req, res) => {
  try {
    const { problem, solution, target } = req.body;
    if (!problem || !solution) {
      return res.status(400).json({ error: "Vui lòng nhập đầy đủ vấn đề và giải pháp đề xuất." });
    }

    const ai = getGeminiClient();
    const prompt = `Bạn là Chuyên gia Tư vấn Sáng kiến cấp cao. Hãy đề xuất 3 tiêu đề sáng kiến khoa học/nghiệp vụ hành lý đạt chuẩn, ngắn gọn nhưng đầy đủ ý nghĩa dựa trên thông tin sau:
- Vấn đề/Thực trạng: "${problem}"
- Giải pháp: "${solution}"
- Đối tượng/Phạm vi áp dụng (nếu có): "${target || "Không chỉ định"}"

Vui lòng áp dụng công thức phối hợp chuẩn mực: "Giải pháp + đối với/mục đích + vấn đề tại đối tượng" hoặc "Một số giải pháp/sáng kiến nhằm + giải quyết vấn đề + tại đối tượng".
Yêu cầu phản hồi bằng định dạng JSON nghiêm ngặt như mẫu này:
{
  "titles": [
    { "title": "Tiêu đề mẫu 1", "explanation": "Giải thích tại sao tiêu đề này tối ưu" },
    { "title": "Tiêu đề mẫu 2", "explanation": "Giải thích..." },
    { "title": "Tiêu đề mẫu 3", "explanation": "Giải thích..." }
  ]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const text = response.text || "{}";
    res.json(JSON.parse(text));
  } catch (error: any) {
    console.error("Error in generate-title:", error);
    res.status(500).json({ error: error.message || "Lỗi xử lý tiêu đề từ AI." });
  }
});

/**
 * 2. Gap Analysis Tool: What exists vs What is desired => Suggest gaps and indicators
 */
app.post("/api/gap-analysis", async (req, res) => {
  try {
    const { baseline, targetState } = req.body;
    if (!baseline || !targetState) {
      return res.status(400).json({ error: "Vui lòng nhập đầy đủ trạng thái thực tế và mong muốn." });
    }

    const ai = getGeminiClient();
    const prompt = `Bạn là Chuyên gia Tư vấn Sáng kiến. Hãy phân tích khoảng trống phát triển (Gap Analysis) dựa trên:
- Trạng thái Thực tế (Cái đang có): "${baseline}"
- Trạng thái Mong muốn (Target Goal): "${targetState}"

Hãy chỉ rõ:
1. Điểm nghẽn cốt lõi (Gaps) là gì?
2. Chi tiết 3 rào cản cần giải quyết.
3. 2 chỉ số đo lường hiệu quả cốt lõi (KPIs) đề xuất.

Trả về kết quả bằng JSON mẫu:
{
  "gaps": "Phân tích điểm nghẽn chung...",
  "barriers": [
    "Rào cản 1: ...",
    "Rào cản 2: ...",
    "Rào cản 3: ..."
  ],
  "kpis": [
    "Chỉ số 1: ...",
    "Chỉ số 2: ..."
  ]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    res.json(JSON.parse(response.text || "{}"));
  } catch (error: any) {
    console.error("Error in gap-analysis:", error);
    res.status(500).json({ error: error.message || "Lỗi phân tích khoảng cách từ AI." });
  }
});

/**
 * 3. Logic Builder: Map problems directly to solution steps to ensure logic
 */
app.post("/api/logic-builder", async (req, res) => {
  try {
    const { problemText, solutionSteps } = req.body;
    if (!problemText || !solutionSteps) {
      return res.status(400).json({ error: "Cần nhập đầy đủ thông tin vấn đề và các bước giải quyết." });
    }

    const ai = getGeminiClient();
    const prompt = `Kiểm tra tính logic (Logic Builder) của đề xuất sáng kiến:
- Vấn đề cốt lõi: "${problemText}"
- Các bước giải pháp người dùng xây dựng: "${solutionSteps}"

Hãy đánh giá xem giải pháp có giải quyết trực diện, triệt để nguyên nhân gốc rễ của vấn đề trên chưa. Đưa ra điểm logic (thang điểm 10), nhận xét sự liên kết và bổ sung gợi ý sửa đổi logic.
Định dạng JSON yêu cầu:
{
  "logicScore": 8,
  "assessment": "Nhận xét chi tiết về tính mạch lạc và liên kết...",
  "missingLinks": [
    "Mối liên hệ thiếu sót 1: ...",
    "Mối liên hệ thiếu sót 2: ..."
  ],
  "suggestions": [
    "Đề xuất sửa đổi bước X để giải quyết triệt để nguyên nhân Y...",
    "Bổ sung bước Z..."
  ]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    res.json(JSON.parse(response.text || "{}"));
  } catch (error: any) {
    console.error("Error in logic-builder:", error);
    res.status(500).json({ error: error.message || "Lỗi kiểm tra logic từ AI." });
  }
});

/**
 * 4. Real-time Scoring: Assess draft based on standard 4-criteria rubric
 */
app.post("/api/score-draft", async (req, res) => {
  try {
    const { title, partA, partB, partC, domain } = req.body;

    const ai = getGeminiClient();
    const prompt = `Bạn là Trưởng ban Hội đồng tư vấn, đánh giá và xếp hạng Sáng kiến Khoa học Công nghệ & Nghiệp vụ Sáng tạo cấp tỉnh/ngành.
Hãy thẩm định và đánh giá chi tiết bản nháp sáng kiến thuộc lĩnh vực: [${domain || "Hành chính & Kỹ thuật chung"}]
- Tiêu đề Sáng kiến: "${title || "Chưa đặt tiêu đề"}"
- Phần A: Đặt vấn đề: "${partA || "Trống"}"
- Phần B: Giải quyết vấn đề: "${partB || "Trống"}"
- Phần C: Minh chứng & Hiệu quả: "${partC || "Trống"}"

Dựa trên 4 tiêu chí định lượng nghiêm ngặt của nhà nước (thang điểm 10):
1. HÌNH THỨC (Đúng mẫu, văn phong chuẩn mực hành chính công sở Công chức, ngắn gọn mạch lạc, lùi mục khoa học)
2. HIỆU QUẢ (Đã đạt được dữ liệu so sánh Trước/Sau chưa, có tính toán số liệu hoặc giá trị làm lợi cụ thể không, có chứng cứ trực quan không)
3. NHÂN RỘNG (Khả năng áp dụng tại các đơn vị khác, phạm vi ảnh hưởng khu vực hay cấp tỉnh, tính đóng gói chuyển giao)
4. MỞ RỘNG (Tiềm năng nhân văn, tác động xã hội lâu dài, SWOT và nâng cấp trong tương lai)

Nếu một tiêu chí dưới 8/10, phải có "Actionable Advice" cực kỳ chi tiết về những từ/câu/dữ liệu cần viết thêm bổ sung.
Định dạng JSON yêu cầu:
{
  "scores": {
    "format": 7,
    "effectiveness": 6,
    "replicability": 5,
    "sustainability": 6
  },
  "overallVerdict": "Nhận xét tổng quan về sáng kiến này (Tốt, Khá hay Trung bình) và phân tích hành văn...",
  "formatAdvice": [
    "Lời khuyên 1...",
    "Lời khuyên 2..."
  ],
  "effectivenessAdvice": [
    "Lời khuyên 1 về định lượng số liệu...",
    "Lời khuyên 2..."
  ],
  "replicabilityAdvice": [
    "Lời khuyên 1 về nhân rộng..."
  ],
  "sustainabilityAdvice": [
    "Lời khuyên 1 về SWOT và bền vững..."
  ],
  "swotAI": {
    "strengths": ["Điểm mạnh 1", "Điểm mạnh 2"],
    "weaknesses": ["Điểm yếu 1", "Điểm yếu 2"],
    "opportunities": ["Cơ hội 1"],
    "threats": ["Thách thức 1"]
  }
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    res.json(JSON.parse(response.text || "{}"));
  } catch (error: any) {
    console.error("Error in scoring:", error);
    res.status(500).json({ error: error.message || "Lỗi thẩm định đánh giá từ AI." });
  }
});

/**
 * 5. Improve Section Text: Nâng cấp văn bản theo văn phong hành chính khoa học chuẩn mực
 */
app.post("/api/improve-section", async (req, res) => {
  try {
    const { sectionName, sectionText, instructions } = req.body;
    if (!sectionText) {
      return res.status(400).json({ error: "Vui lòng nhập đoạn văn bản cần nâng cấp." });
    }

    const ai = getGeminiClient();
    const prompt = `Bạn là Chuyên gia Tư vấn Viết sáng kiến khoa học công nghệ hành chính công. 
Hãy hiệu đính, chau chuốt và nâng cấp chất lượng đoạn văn bản sau để trở nên cực kỳ chuyên nghiệp, đúng chuẩn quy tắc văn bản hành chính Việt Nam (trang trọng, khách quan, giàu sức thuyết phục công sở, mạch lạc và súc tích).
- Tên phần/tiêu đề con: "${sectionName || "Chung"}"
- Nội dung gốc cần sửa: "${sectionText}"
- Lưu ý bổ sung của người dùng (nếu có): "${instructions || "Hãy làm cho hành văn khoa học và đầy tính thuyết phục hơn"}"

Yêu cầu giữ nguyên các số liệu thực chứng nếu có, nhưng sắp xếp lại luận điểm logic, sửa các lỗi lặp từ, khẩu ngữ, hoặc viết câu quá dài.
Vui lòng trả về kết quả bằng JSON dạng:
{
  "improvedText": "Đoạn văn sau khi đã được nâng cấp hoàn hảo...",
  "reasons": [
    "Sửa lỗi lặp từ X thành từ Y sang trọng hơn",
    "Gộp câu đơn vụn vặt thành câu ghép có bổ ngữ rõ ràng hơn",
    "Tạo cấu trúc liệt kê đầu dòng tạo điểm nhấn trực quan"
  ]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    res.json(JSON.parse(response.text || "{}"));
  } catch (error: any) {
    console.error("Error in improve-section:", error);
    res.status(500).json({ error: error.message || "Lỗi nâng cấp văn bản từ AI." });
  }
});

/**
 * 6. Quick Plagiarism & Quality Compliance Check
 */
app.post("/api/quality-checker", async (req, res) => {
  try {
    const { title, content } = req.body;
    if (!content) {
      return res.status(400).json({ error: "Vui lòng nhập nội dung cần kiểm tra." });
    }

    const ai = getGeminiClient();
    const prompt = `Kiểm định bản quyền ý tưởng và rủi ro đạo văn / trung lặp sáng kiến hành chính:
- Tiêu đề Sáng kiến: "${title || "Chưa rõ"}"
- Nội dung kiểm tra mẫu: "${content.substring(0, 4000)}"

Hãy ước lượng rủi ro trùng lặp ý tưởng (đạo văn học thuật/sáng kiến công sở) dựa trên độ phổ biến của giải pháp, tìm các lỗi hành chính Việt Nam (ví dụ dùng sai thuật ngữ pháp lý, lạm dụng sáo rỗng, thiếu định lượng, sai bố cục).
Trả về kết quả bằng JSON mẫu:
{
  "plagiarismRisk": "Thấp/Trung bình/Cao",
  "riskScorePercentage": 25,
  "duplicatedKeywordsAnalysis": "Phân tích các cụm từ dễ bị trùng lặp hoặc quá đại trà như...",
  "complianceViolations": [
    "Lỗi 1: ...",
    "Lỗi 2: ..."
  ],
  "recommendations": [
    "Giải pháp khắc phục 1...",
    "Giải pháp khắc phục 2..."
  ]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    res.json(JSON.parse(response.text || "{}"));
  } catch (error: any) {
    console.error("Error in quality-checker:", error);
    res.status(500).json({ error: error.message || "Lỗi kiểm định chất lượng." });
  }
});

/**
 * 7. AI Chat Box for Each Section: Write or expand ideas
 */
app.post("/api/chat-section", async (req, res) => {
  try {
    const { sectionName, teacherName, title, message, currentText, history } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Vui lòng nhập tin nhắn của bạn." });
    }

    const ai = getGeminiClient();
    
    // Construct a rich prompt using teacherName and title focusing 100% on Education
    const systemPrompt = `Bạn là một Chuyên gia Giáo dục & Đào tạo chuyên thẩm định và hỗ trợ viết sáng kiến kinh nghiệm sư phạm, cải cách dạy học và quản lý trường học bậc cao tại Việt Nam.
Nhiệm vụ của bạn là hỗ trợ Giáo viên lập luận khoa học, khai phá và mở rộng ý tưởng sâu sắc cho phần đang soạn thảo.

THÔNG TIN GIÁO VIÊN & ĐỀ TÀI:
- Giáo viên phụ trách: ${teacherName || "Chưa nhập tên giáo viên"}
- Tên Đề tài/Sáng kiến Giáo dục: "${title || "Chưa nhập tên đề tài"}"
- Lĩnh vực: Giáo dục & Đào tạo (Áp dụng cho mầm non, tiểu học, trung học, đại học, phương pháp sư phạm, chủ nhiệm hoặc chuyển đổi số trường học)
- Bản nháp hiện tại của phần này [${sectionName}]:
---
${currentText || "Trống (Chưa có nội dung nháp)"}
---

Yêu cầu về nội dung tư vấn:
1. Tập trung 100% vào nghiệp vụ sư phạm, định hướng đổi mới giáo dục theo chương trình GDPT mới, phương lý luận, các hoạt động tổ chức lớp học tích cực và các biện pháp kích thích học tập.
2. Hãy đưa ra các giải pháp thực nghiệm cụ thể (ví dụ: sơ đồ trò chơi học tập, cách chia nhóm, phiếu khảo sát tâm lý học sinh, cách kết nối phụ huynh) thay vì những lời khuyên chung chung.
3. Giúp giáo viên chau chuốt câu từ trang nghiêm, cấu trúc văn bản hành chính rõ ràng, khoa học phù hợp nộp lên Sở/Phòng Giáo dục.

Lịch sử cuộc hội thoại (nếu có):
${(history || []).map((h: any) => `${h.role === 'user' ? 'Giáo viên' : 'Hội đồng AI'}: ${h.text}`).join('\n')}

Hãy phản hồi trực tiếp câu hỏi/yêu cầu sau của Giáo viên liên quan đến việc viết phần [${sectionName}]:
Giáo viên: "${message}"`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: systemPrompt,
    });

    res.json({ responseMessage: response.text });
  } catch (error: any) {
    console.error("Error in chat-section:", error);
    res.status(500).json({ error: error.message || "Lỗi phản hồi từ AI Chat." });
  }
});

/**
 * 8. Suggest Evidence (Minh chứng) for Each Section: Hình ảnh, biểu đồ, mẫu khảo sát...
 */
app.post("/api/suggest-evidence", async (req, res) => {
  try {
    const { sectionName, title, content, teacherName } = req.body;

    const ai = getGeminiClient();
    const prompt = `Bạn là Chuyên gia Khảo thí và Kiểm định chất lượng giáo dục hàng đầu. Hãy đề xuất các hình ảnh minh chứng, dạng biểu đồ thống kê, số hiệu kiểm chứng thực tế hoặc bảng khảo sát có sức thuyết phục nhất đối với hội đồng khoa học giáo dục cho phần [${sectionName}] của đề tài này:

Tên Đề tài Giáo dục: "${title || "Không có tên đề tài"}"
Giáo viên thực hiện: ${teacherName || "Chưa rõ"}
Nội dung hiện tại của phần [${sectionName}]:
---
${content || "Trống"}
---

Yêu cầu đề xuất tối thiểu 3-4 loại minh chứng mang tính trực quan và thuyết phục cao, chỉ rõ cách giáo viên thu thập, hình thức thiết kế (Ví dụ: chụp ảnh lúc học sinh tương tác nhóm, biểu đồ cột so sánh tỷ lệ hoàn thành bài tập của học sinh, bảng trích xuất khảo sát mức độ tự tin của trẻ mầm non trước/sau sáng kiến).

Vui lòng phản hồi bằng định dạng JSON nghiêm ngặt theo mẫu sau:
{
  "recommendations": [
    {
      "type": "Loại minh chứng (ví dụ: Hình ảnh chụp, Biểu đồ thống kê, Bảng khảo sát, Phiếu đánh giá...)",
      "title": "Tiêu đề gợi ý đầy đủ cho minh chứng này",
      "description": "Chi tiết cách giáo viên tự chuẩn bị hoặc thiết kế minh chứng này (ví dụ: chụp ảnh ngang góc rộng lớp học lúc hoạt động STEM đang diễn ra nhộn nhịp, bảng Excel thống kê 5 thang đo mức độ hứng thú phát phiếu thăm dò)",
      "value": "Ý nghĩa/giá trị tăng sức nặng thuyết phục trước Ban giám khảo thẩm định"
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    res.json(JSON.parse(response.text || '{"recommendations":[]}'));
  } catch (error: any) {
    console.error("Error in suggest-evidence:", error);
    res.status(500).json({ error: error.message || "Lỗi gợi ý minh chứng từ AI." });
  }
});


/**
 * 9. AI Auto-write Full Initiative based on Title, Teacher Name and Domain
 */
app.post("/api/write-full-initiative", async (req, res) => {
  try {
    const { title, teacherName, domain, grade, subject } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ error: "Vui lòng nhập tên đề tài sáng kiến để AI viết bài." });
    }

    const ai = getGeminiClient();
    const prompt = `Bạn là một Chuyên gia Thẩm định khoa học giáo dục và viết Sáng kiến Kinh nghiệm học thuật xuất sắc tại Việt Nam.
Hãy lập dàn ý & viết nội dung chi tiết bài soạn thảo hoàn chỉnh, chuẩn mực sư phạm cao nhất cho đề tài này:

THÔNG TIN CHUNG:
- Tên Đề tài Sáng kiến: "${title}"
- Lĩnh vực áp dụng: "${domain || "Chung"}"
- Khối lớp: "${grade || "Cấp học chung"}"
- Môn học: "${subject || "Tất cả các môn"}"
- Giáo viên đăng ký: "${teacherName || "Chưa rõ"}"

VUI LÒNG VIẾT CHI TIẾT TỪNG PHẦN THEO KHUNG CHUẨN SAU:

Phần A. ĐẶT VẤN ĐỀ (Phải đủ ý sau):
1. Lý do chọn đề tài: Phân tích bối cảnh đổi mới giáo dục hiện nay, tại sao đề tài này vô cùng cấp thiết đối với môn học ${subject || ""} ở ${grade || ""}, và lý do khoa học thực tiễn.
2. Thực trạng khảo sát trước khi áp dụng: Các khó khăn cụ thể của lớp học, mô tả điểm kiểm tra thực nghiệm giả định yếu hoặc học lực lúc đầu, cơ cấu vật chất giáo cụ còn thô sơ hoặc tâm lý chán nản của trò học trước sáng kiến.

Phần B. GIẢI QUYẾT VẤN ĐỀ (Phải đủ ý sau):
1. Nội dung và bản chất giải pháp: Cốt lõi của sự mới mẻ, tinh thần sáng tạo đột phá trong lĩnh vực ${domain || ""}.
2. Các bước triển khai chi tiết: Chia làm ít nhất 3 bước hành động cụ thể rõ ràng (Chuẩn bị hoạt động/thiết kế giáo án, Tổ chức phát động/phối hợp trò chơi/tích hợp CNTT, Tổng kết bổ sung vinh danh/chia nhóm thực hành và theo dõi kiểm toán).

Phần C. HIỆU QUẢ HOẠT ĐỘNG HOÀN THÀNH (Phải đủ ý sau):
1. Hiệu quả giáo dục & thực nghiệm: Mô tả rõ rệt các con số giả định thuyết phục về sự tiến bộ của môn học ${subject || ""} ở ${grade || ""} (ví dụ điểm số trung bình từ 6.1 tăng lên 8.5, mức độ hứng thú học tập tăng từ 30% lên 95%, giảm tải 30 phút mỗi tuần tự chấm bài...).
2. Khả năng nhân rộng & Gợi ý minh chứng: Khả năng vận dụng thuận tiện cho các trường giáo dục khác lân cận, và kết quả trích dẫn tóm lược.

Yêu cầu về văn phong:
- Trang trọng, bám sát thuật ngữ chuyên môn giáo dục của Bộ Giáo Dục & Đào Tạo Việt Nam.
- Trình bày mạch lạc, cấu trúc rõ ràng các đề mục 1. , 2. và gạch đầu dòng cụ thể.
- Tạo ra nội dung đầy đủ dài, chi tiết từng phần chứ không viết sơ sài tóm tắt.

Vui lòng phản hồi bằng định dạng JSON nghiêm ngặt theo mẫu sau:
{
  "partA": "Nội dung chi tiết Phần A...",
  "partB": "Nội dung chi tiết Phần B...",
  "partC": "Nội dung chi tiết Phần C..."
}
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    res.json(JSON.parse(response.text || '{"partA":"","partB":"","partC":""}'));
  } catch (error: any) {
    console.error("Error in write-full-initiative:", error);
    res.status(500).json({ error: error.message || "Lỗi tự động sáng tác bài viết sư phạm bằng AI." });
  }
});


/**
 * 10. AI Suggest Chart & Table Data based on Title & Domain
 */
app.post("/api/suggest-chart-data", async (req, res) => {
  try {
    const { title, domain, grade, subject } = req.body;
    if (!title) {
      return res.status(400).json({ error: "Vui lòng nhập tiêu đề sáng kiến để gợi ý bảng số liệu." });
    }

    const ai = getGeminiClient();
    const prompt = `Bạn là Chuyên gia thống kê khoa học và kiểm định chất lượng giáo dục tại Việt Nam.
Hãy đề xuất một bộ số liệu thực nghiệm Giả định nhưng Vô cùng thực tế và phù hợp với tên đề tài sáng kiến sau:
Tên Đề tài: "${title}"
Lĩnh vực áp dụng: "${domain || "Giáo dục"}"
Lớp học: "${grade || "Mọi khối lớp"}"
Môn học: "${subject || "Môn học chung"}"

VUI LÒNG ĐỀ XUẤT:
1. Tiêu đề biểu đồ/bảng số liệu (ví dụ: "Bảng 1: So sánh tỷ lệ hoàn thành kỹ năng tự phục vụ môn học" hoặc "Bảng 2: Kết quả điểm khảo sát Trước và Sau khi áp dụng giải pháp cho học sinh ${grade || ""}")
2. Bộ 4 danh mục dữ liệu phù hợp (Ví dụ: ["Xuất sắc", "Khá", "Trung bình", "Yếu"] hoặc các mốc đánh giá năng lực).
3. Giá trị tỷ lệ % hoặc điểm số Trước sáng kiến (Before) và Sau sáng kiến (After). Hãy đảm bảo các con số Sau sáng kiến (After) thể hiện sự tiến bộ rõ rệt có giá trị khoa học (ví dụ: Giỏi tăng lên, Yếu giảm hẳn/triệt tiêu). Tổng tỷ lệ phần trăm (nếu dùng %) cho mỗi nhóm Before hoặc After phải xấp xỉ bằng 100%.
4. Lời nhận xét, phân tích khoa học sư phạm sâu sắc về biểu đồ này để thầy cô copy dán trực tiếp vào báo cáo Phần C.

Vui lòng viết kết quả chính xác theo cấu trúc JSON mẫu sau:
{
  "chartTitle": "So sánh kết quả...",
  "yAxisLabel": "Tỷ lệ (%) hoặc Điểm số",
  "commentary": "Nhận xét biểu đồ: Sau khi áp dụng sáng kiến kinh nghiệm sư phạm cho môn ${subject || ""} ở lớp ${grade || ""}...",
  "items": [
    { "category": "Giỏi (hoặc Xuất sắc)", "before": 15, "after": 45 },
    { "category": "Khá", "before": 35, "after": 45 },
    { "category": "Trung bình", "before": 40, "after": 10 },
    { "category": "Yếu / Kém", "before": 10, "after": 0 }
  ]
}
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    res.json(JSON.parse(response.text || '{"chartTitle":"","yAxisLabel":"","commentary":"","items":[]}'));
  } catch (error: any) {
    console.error("Error in suggest-chart-data:", error);
    res.status(500).json({ error: error.message || "Lỗi thiết kế số liệu từ AI." });
  }
});


// ----------------------------------------------------
// VITE OR STATIC SERVING MIDDLEWARE
// ----------------------------------------------------
async function setupViteOrStatic() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Setting up Vite development server middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Setting up static file server for production...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Inno-Science Server] running on http://localhost:${PORT}`);
  });
}

setupViteOrStatic().catch((err) => {
  console.error("Failed to start server:", err);
});
