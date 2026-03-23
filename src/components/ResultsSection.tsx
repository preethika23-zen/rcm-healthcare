import {
  AlertTriangle,
  Download,
  FileText,
  Shield,
  Upload,
  XCircle
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import { ClayButton, ClayCard, ClayProgress, RiskBadge } from "./ClayCard";
import type { ClaimAnalysisResult } from "../types/claim";

type BreakdownItem = {
  category: string;
  score: number;
  maxScore: number;
};

type Props = {
  analysisResult: ClaimAnalysisResult | null;
  riskBreakdown: BreakdownItem[];
  onAnalyzeAnother: () => void;
};

export default function ResultsSection({
  analysisResult,
  riskBreakdown,
  onAnalyzeAnother
}: Props) {
  if (!analysisResult) {
    return (
      <ClayCard className="text-center py-12">
        <FileText size={48} className="mx-auto mb-4" style={{ color: "var(--text-faint)" }} />
        <h3 className="text-xl font-semibold mb-2" style={{ color: "var(--text-main)" }}>
          No Analysis Results
        </h3>
        <p className="mb-6" style={{ color: "var(--text-soft)" }}>
          Submit a claim for analysis to see results here.
        </p>
        <ClayButton className="solid-brand-btn" onClick={onAnalyzeAnother}>
          <Upload size={18} />
          Run Smart Analysis
        </ClayButton>
      </ClayCard>
    );
  }

  return (
    <div className="space-y-6">
      <div className="results-top-grid">
        <ClayCard className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold" style={{ color: "var(--text-main)" }}>
              Risk Assessment
            </h3>
            <RiskBadge
              level={analysisResult.riskPrediction.riskLevel}
              score={analysisResult.riskPrediction.riskScore}
            />
          </div>

          <div
            className="mb-5 rounded-xl px-4 py-3"
            style={{
              background: "var(--surface-soft)",
              boxShadow: "var(--shadow-inset)",
              color: "var(--text-soft)"
            }}
          >
            This claim shows denial risk mainly due to eligibility gaps, payer validation issues,
            and missing pre-submission checks.
          </div>

          <div className="mb-6">
            <ClayProgress
              value={analysisResult.riskPrediction.riskScore}
              variant={analysisResult.riskPrediction.riskLevel}
              label="Denial Risk Score"
            />
          </div>

          <div className="mini-stat-grid">
            <div className="result-stat-box">
              <p className="text-sm" style={{ color: "var(--text-soft)" }}>
                Confidence Score
              </p>
              <p className="text-2xl font-bold" style={{ color: "var(--text-main)" }}>
                {analysisResult.riskPrediction.confidenceScore}%
              </p>
            </div>

            <div className="result-stat-box">
              <p className="text-sm" style={{ color: "var(--text-soft)" }}>
                Eligibility Status
              </p>
              <p
                className="text-2xl font-bold"
                style={{
                  color: analysisResult.eligibility.eligible ? "var(--risk-low)" : "var(--risk-high)"
                }}
              >
                {analysisResult.eligibility.eligible ? "Eligible" : "Issues Found"}
              </p>
            </div>
          </div>
        </ClayCard>

        <ClayCard>
          <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--text-main)" }}>
            Claim Summary
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between gap-3">
              <span style={{ color: "var(--text-soft)" }}>Patient:</span>
              <span className="font-medium text-right" style={{ color: "var(--text-main)" }}>
                {analysisResult.claim.patientName}
              </span>
            </div>
            <div className="flex justify-between gap-3">
              <span style={{ color: "var(--text-soft)" }}>Payer:</span>
              <span className="font-medium text-right" style={{ color: "var(--text-main)" }}>
                {analysisResult.claim.payerName}
              </span>
            </div>
            <div className="flex justify-between gap-3">
              <span style={{ color: "var(--text-soft)" }}>CPT Code:</span>
              <span className="font-medium text-right" style={{ color: "var(--text-main)" }}>
                {analysisResult.claim.cptCode}
              </span>
            </div>
            <div className="flex justify-between gap-3">
              <span style={{ color: "var(--text-soft)" }}>Amount:</span>
              <span className="font-medium text-right" style={{ color: "var(--text-main)" }}>
                ₹{analysisResult.claim.billedAmount.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between gap-3">
              <span style={{ color: "var(--text-soft)" }}>Potential Savings:</span>
              <span className="font-medium text-right" style={{ color: "var(--risk-low)" }}>
                ₹{analysisResult.prevention.potentialSavings.toFixed(2)}
              </span>
            </div>
          </div>
        </ClayCard>
      </div>

      <ClayCard>
        <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--text-main)" }}>
          Risk Breakdown by Category
        </h3>
        <div className="chart-area">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={riskBreakdown.map((b) => ({
                category: b.category,
                score: b.score,
                maxScore: b.maxScore - b.score
              }))}
              margin={{ top: 20, right: 20, left: 10, bottom: 5 }}
            >
              <XAxis dataKey="category" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="score" name="Risk Score" stackId="a" fill="#d95d39" radius={[4, 4, 0, 0]} />
              <Bar dataKey="maxScore" name="Remaining" stackId="a" fill="#cfd8e3" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ClayCard>

      <div className="results-bottom-grid">
        <ClayCard>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--text-main)" }}>
            <AlertTriangle size={20} style={{ color: "var(--risk-medium)" }} />
            Risk Factors Identified
          </h3>

          {analysisResult.riskPrediction.reasons.length > 0 ? (
            <ul className="space-y-3">
              {analysisResult.riskPrediction.reasons.map((reason, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <span
                    className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                    style={{
                      background: "rgba(217,93,57,0.12)",
                      color: "var(--risk-high)"
                    }}
                  >
                    {i + 1}
                  </span>
                  <span style={{ color: "var(--text-main)" }}>{reason}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm" style={{ color: "var(--text-soft)" }}>
              No significant risk factors identified.
            </p>
          )}
        </ClayCard>

        <ClayCard>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--text-main)" }}>
            <Shield size={20} style={{ color: "var(--risk-low)" }} />
            Prevention Recommendations
          </h3>

          <ul className="space-y-3">
            {analysisResult.prevention.preventionActions.slice(0, 5).map((action, i) => (
              <li key={action.id} className="flex items-start gap-3 text-sm">
                <span
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                  style={{
                    background:
                      action.priority === "high"
                        ? "rgba(217,93,57,0.12)"
                        : action.priority === "medium"
                        ? "rgba(217,147,47,0.12)"
                        : "rgba(148,163,184,0.14)",
                    color:
                      action.priority === "high"
                        ? "var(--risk-high)"
                        : action.priority === "medium"
                        ? "var(--risk-medium)"
                        : "var(--text-soft)"
                  }}
                >
                  {i + 1}
                </span>

                <div>
                  <span style={{ color: "var(--text-main)" }}>{action.action}</span>
                  <span className="block text-xs mt-1" style={{ color: "var(--text-faint)" }}>
                    Impact: {action.estimatedImpact}% risk reduction
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </ClayCard>
      </div>

      {!analysisResult.eligibility.eligible && (
        <ClayCard>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--text-main)" }}>
            <AlertTriangle size={20} style={{ color: "var(--risk-medium)" }} />
            Eligibility Issues
          </h3>

          <ul className="space-y-2">
            {analysisResult.eligibility.eligibilityIssues.map((issue, i) => (
              <li key={i} className="flex items-center gap-2 text-sm" style={{ color: "var(--risk-medium)" }}>
                <XCircle size={16} />
                {issue}
              </li>
            ))}
          </ul>
        </ClayCard>
      )}

      <div className="flex flex-wrap gap-4">
        <ClayButton className="solid-brand-btn" onClick={onAnalyzeAnother}>
          <Upload size={18} />
          Analyze Another Claim
        </ClayButton>

        <ClayButton variant="ghost">
          <Download size={18} />
          Export Report
        </ClayButton>
      </div>
    </div>
  );
}