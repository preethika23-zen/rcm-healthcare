import {
  CheckCircle,
  Download,
  FileSpreadsheet,
  Upload,
  XCircle
} from "lucide-react";
import { ClayButton, ClayCard, RiskBadge, StatCard } from "./ClayCard";
import type { BatchResult, ClaimAnalysisResult } from "../types/claim";

type Props = {
  batchResult: BatchResult | null;
  onUploadAnother: () => void;
  onViewDetails: (result: ClaimAnalysisResult, index: number) => void;
};

export default function BatchSection({
  batchResult,
  onUploadAnother,
  onViewDetails
}: Props) {
  if (!batchResult) {
    return (
      <ClayCard className="text-center py-12">
        <FileSpreadsheet
          size={48}
          className="mx-auto mb-4"
          style={{ color: "var(--text-faint)" }}
        />
        <h3 className="text-xl font-semibold mb-2" style={{ color: "var(--text-main)" }}>
          No Batch Results
        </h3>
        <p className="mb-6" style={{ color: "var(--text-soft)" }}>
          Upload an Excel or CSV file to see batch analysis results.
        </p>
        <ClayButton className="solid-brand-btn" onClick={onUploadAnother}>
          <FileSpreadsheet size={18} />
          Upload Claim Batch
        </ClayButton>
      </ClayCard>
    );
  }

  return (
    <div className="space-y-6">
      <div className="batch-stats-grid">
        <StatCard title="Total Claims" value={String(batchResult.totalClaims)} variant="blue" />
        <StatCard title="Eligible" value={String(batchResult.eligibleCount)} variant="teal" />
        <StatCard title="Low Risk" value={String(batchResult.lowRiskCount)} variant="green" />
        <StatCard title="Medium Risk" value={String(batchResult.mediumRiskCount)} variant="amber" />
        <StatCard title="High Risk" value={String(batchResult.highRiskCount)} variant="red" />
        <StatCard
          title="Processing Time"
          value={`${(batchResult.processingTimeMs / 1000).toFixed(2)}s`}
          variant="purple"
        />
      </div>

      <ClayCard>
        <div className="mb-4">
          <h3 className="text-lg font-semibold" style={{ color: "var(--text-main)" }}>
            Batch Analysis Results
          </h3>
          <p className="text-sm mt-2" style={{ color: "var(--text-soft)" }}>
            Prioritized claims are grouped by denial probability and eligibility review outcome.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="clay-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Patient</th>
                <th>Payer</th>
                <th>CPT</th>
                <th>Amount</th>
                <th>Risk Level</th>
                <th>Score</th>
                <th>Eligible</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {batchResult.results.map((result, index) => {
                const riskLevel = result.riskPrediction.riskLevel;

                return (
                  <tr
                    key={result.id || `${result.claim.patientId}-${index}`}
                    className={
                      riskLevel === "high"
                        ? "batch-row risk-high-row"
                        : riskLevel === "medium"
                        ? "batch-row risk-medium-row"
                        : "batch-row risk-low-row"
                    }
                  >
                    <td className="font-medium">{index + 1}</td>
                    <td>{result.claim.patientName}</td>
                    <td>{result.claim.payerName}</td>
                    <td className="font-mono">{result.claim.cptCode}</td>
                    <td>₹{result.claim.billedAmount.toFixed(2)}</td>
                    <td>
                      <RiskBadge level={riskLevel} />
                    </td>
                    <td className="font-bold">{result.riskPrediction.riskScore}</td>
                    <td>
                      {result.eligibility.eligible ? (
                        <CheckCircle size={20} style={{ color: "var(--risk-low)" }} />
                      ) : (
                        <XCircle size={20} style={{ color: "var(--risk-high)" }} />
                      )}
                    </td>
                    <td>
                      <button
                        className="text-sm font-medium"
                        style={{ color: "var(--accent)" }}
                        onClick={() => onViewDetails(result, index)}
                        type="button"
                      >
                        Review Prediction
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </ClayCard>

      <div className="flex gap-4 flex-wrap">
        <ClayButton className="solid-brand-btn" onClick={onUploadAnother}>
          <Upload size={18} />
          Upload Another File
        </ClayButton>

        <ClayButton variant="ghost" type="button">
          <Download size={18} />
          Export All Results
        </ClayButton>
      </div>
    </div>
  );
}