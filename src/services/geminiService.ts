import { TitleRecommendation, GapAnalysisResult, ScoreDashboardData } from "../types";

/**
 * Utility to clean markdown code blocks (e.g., ```json) and parse JSON safely.
 */
function cleanAndParseJSON(rawText: string): any {
  let cleaned = rawText.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```[a-zA-Z]*\n?/, "");
    cleaned = cleaned.replace(/\n?```$/, "");
  }
  return JSON.parse(cleaned.trim());
}

/**
 * Core function to send request to Google Gemini API
 */
async function callGeminiAPI(
  prompt: string,
  model: string,
  apiKey: string,
  options: { responseMimeType?: string; systemInstruction?: string } = {}
): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const contentsPayload: any = [
    {
      parts: [{ text: prompt }]
    }
  ];

  const body: any = {
    contents: contentsPayload
  };

  if (options.systemInstruction) {
    body.systemInstruction = {
      parts: [{ text: options.systemInstruction }]
    };
  }

  if (options.responseMimeType) {
    body.generationConfig = {
      responseMimeType: options.responseMimeType
    };
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    let errorMsg = `API Error ${response.status}`;
    try {
      const errorJson = await response.json();
      errorMsg = errorJson.error?.message || errorJson.error?.status || errorMsg;
    } catch (e) {
      // ignore
    }
    throw new Error(errorMsg);
  }

  const data = await response.json();
  const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!candidateText) {
    throw new Error("Không có phản hồi từ mô hình AI.");
  }
  return candidateText;
}

/**
 * Run Gemini generation with automatic fallback models list
 */
export async function generateWithFallback(
  prompt: string,
  options: { responseMimeType?: string; systemInstruction?: string } = {}
): Promise<{ text: string; modelUsed: string }> {
  const apiKey = localStorage.getItem("GEMINI_API_KEY") || "";
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    throw new Error("API_KEY_MISSING: Vui lòng cấu hình Gemini API Key chính xác để tiếp tục.");
  }

  const selectedModel = localStorage.getItem("GEMINI_MODEL") || "gemini-3-flash-preview";

  // Reorder fallback chain to start with the selected model
  const baseChain = [
    "gemini-3-flash-preview",
    "gemini-3-pro-preview",
    "gemini-2.5-flash",
    "gemini-2.5-pro",
    "gemini-2.0-flash",
    "gemini-1.5-flash"
  ];

  const uniqueChain = Array.from(new Set([selectedModel, ...baseChain]));

  let lastError: any = null;

  for (const model of uniqueChain) {
    try {
      console.log(`Trying Gemini with model: ${model}...`);
      const resultText = await callGeminiAPI(prompt, model, apiKey, options);
      return { text: resultText, modelUsed: model };
    } catch (err: any) {
      console.warn(`Failed with model ${model}:`, err);
      lastError = err;
      // Continue to try the next model
    }
  }

  // If we reach here, all models in the fallback list failed
  const errorMsg = lastError?.message || lastError || "Tất cả các model AI đều thất bại.";
  throw new Error(errorMsg);
}

// ----------------------------------------------------
// FRONTEND SERVICE API WRAPPERS
// ----------------------------------------------------

/**
 * 1. AI Title Generator
 */
export async function generateTitles(problem: string, solution: string, target?: string): Promise<{ titles: TitleRecommendation[] }> {
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

  const { text } = await generateWithFallback(prompt, { responseMimeType: "application/json" });
  return cleanAndParseJSON(text);
}

/**
 * 2. Gap Analysis Tool
 */
export async function gapAnalysis(baseline: string, targetState: string): Promise<GapAnalysisResult> {
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

  const { text } = await generateWithFallback(prompt, { responseMimeType: "application/json" });
  return cleanAndParseJSON(text);
}

/**
 * 3. Logic Builder
 */
export async function logicBuilder(problemText: string, solutionSteps: string): Promise<any> {
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

  const { text } = await generateWithFallback(prompt, { responseMimeType: "application/json" });
  return cleanAndParseJSON(text);
}

/**
 * 4. Real-time Scoring
 */
export async function scoreDraft(
  title: string,
  partA: string,
  partB: string,
  partC: string,
  domain: string
): Promise<ScoreDashboardData> {
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

  const { text } = await generateWithFallback(prompt, { responseMimeType: "application/json" });
  return cleanAndParseJSON(text);
}

/**
 * 5. Improve Section Text
 */
export async function improveSection(
  sectionName: string,
  sectionText: string,
  instructions?: string
): Promise<{ improvedText: string; reasons: string[] }> {
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

  const { text } = await generateWithFallback(prompt, { responseMimeType: "application/json" });
  return cleanAndParseJSON(text);
}

/**
 * 6. Quick Plagiarism & Quality Compliance Check
 */
export async function qualityChecker(title: string, content: string): Promise<any> {
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

  const { text } = await generateWithFallback(prompt, { responseMimeType: "application/json" });
  return cleanAndParseJSON(text);
}

/**
 * 7. AI Chat Box for Each Section
 */
export async function chatSection(
  sectionName: string,
  teacherName: string,
  title: string,
  message: string,
  currentText: string,
  history: any[]
): Promise<{ responseMessage: string }> {
  const prompt = `Bạn là một Chuyên gia Giáo dục & Đào tạo chuyên thẩm định và hỗ trợ viết sáng kiến kinh nghiệm sư phạm, cải cách dạy học và quản lý trường học bậc cao tại Việt Nam.
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

  const { text } = await generateWithFallback(prompt);
  return { responseMessage: text };
}

/**
 * 8. Suggest Evidence
 */
export async function suggestEvidence(
  sectionName: string,
  title: string,
  content: string,
  teacherName: string
): Promise<{ recommendations: any[] }> {
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

  const { text } = await generateWithFallback(prompt, { responseMimeType: "application/json" });
  return cleanAndParseJSON(text);
}

/**
 * 9. AI Auto-write Full Initiative
 */
export async function writeFullInitiative(
  title: string,
  teacherName: string,
  domain: string,
  grade: string,
  subject: string
): Promise<{ partA: string; partB: string; partC: string }> {
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
}`;

  const { text } = await generateWithFallback(prompt, { responseMimeType: "application/json" });
  return cleanAndParseJSON(text);
}

/**
 * 10. AI Suggest Chart & Table Data
 */
export async function suggestChartData(
  title: string,
  domain: string,
  grade: string,
  subject: string
): Promise<any> {
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
}`;

  const { text } = await generateWithFallback(prompt, { responseMimeType: "application/json" });
  return cleanAndParseJSON(text);
}
