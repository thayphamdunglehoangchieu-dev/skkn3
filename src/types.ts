export interface InitiativeDraft {
  title: string;
  teacherName: string;
  domain: string; // Lĩnh vực áp dụng
  grade: string; // Lớp học
  subject: string; // Môn học
  partA: string; // Đặt vấn đề
  partB: string; // Giải quyết vấn đề
  partC: string; // Hiệu quả & Minh chứng
  calcRows: CalcRow[];
}

export interface CalcRow {
  id: string;
  label: string;
  costBefore: number;
  costAfter: number;
  laborHoursSaved: number;
  laborRatePerHour: number;
}

export interface ScoreDashboardData {
  format: number;
  effectiveness: number;
  replicability: number;
  sustainability: number;
  overallVerdict: string;
  formatAdvice: string[];
  effectivenessAdvice: string[];
  replicabilityAdvice: string[];
  sustainabilityAdvice: string[];
  swotAI?: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  };
}

export interface TitleRecommendation {
  title: string;
  explanation: string;
}

export interface GapAnalysisResult {
  gaps: string;
  barriers: string[];
  kpis: string[];
}

export interface LogicBuilderResult {
  logicScore: number;
  assessment: string;
  missingLinks: string[];
  suggestions: string[];
}

export interface QualityCheckResult {
  plagiarismRisk: string;
  riskScorePercentage: number;
  duplicatedKeywordsAnalysis: string;
  complianceViolations: string[];
  recommendations: string[];
}

export interface AppTemplate {
  name: string;
  domain: string;
  title: string;
  partA: string;
  partB: string;
  partC: string;
}
