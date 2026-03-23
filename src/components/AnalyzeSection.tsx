import {
  Brain,
  Download,
  FileSpreadsheet,
  FileText,
  Clipboard,
  RefreshCw,
  Zap
} from "lucide-react";
import {
  ClayButton,
  ClayCard,
  ClayInput,
  ClaySelect,
  ClayToggle,
  FileUploadZone
} from "./ClayCard";
import type { ClaimData } from "../types/claim";
import {
  PAYER_NAMES,
  PLACE_OF_SERVICE_CODES,
  COMMON_CPT_CODES,
  COMMON_ICD10_CODES
} from "../types/claim";

type Props = {
  inputMode: "manual" | "excel" | "pdf";
  setInputMode: (mode: "manual" | "excel" | "pdf") => void;
  claim: ClaimData;
  updateClaim: (field: keyof ClaimData, value: unknown) => void;
  icd10Input: string;
  setIcd10Input: (value: string) => void;
  addIcd10Code: () => void;
  removeIcd10Code: (code: string) => void;
  handleManualAnalyze: () => void;
  handleFileUpload: (file: File) => void;
  downloadTemplate: () => void;
  resetForm: () => void;
  loadSampleData: () => void;
  isProcessing: boolean;
};

export default function AnalyzeSection({
  inputMode,
  setInputMode,
  claim,
  updateClaim,
  icd10Input,
  setIcd10Input,
  addIcd10Code,
  removeIcd10Code,
  handleManualAnalyze,
  handleFileUpload,
  downloadTemplate,
  resetForm,
  loadSampleData,
  isProcessing
}: Props) {
  const canAnalyze =
    claim.patientName.trim() !== "" &&
    claim.patientId.trim() !== "" &&
    claim.payerName.trim() !== "" &&
    claim.cptCode.trim() !== "" &&
    claim.providerNpi.trim() !== "" &&
    claim.placeOfService.trim() !== "" &&
    claim.icd10Codes.length > 0 &&
    claim.billedAmount > 0 &&
    claim.patientAge >= 0;

  const handleSafeAnalyze = () => {
    if (!canAnalyze || isProcessing) return;
    handleManualAnalyze();
  };

  const handleAddIcd = () => {
    if (!icd10Input.trim()) return;
    addIcd10Code();
  };

  return (
    <div className="space-y-6">
      <ClayCard>
        <h3 className="text-lg font-semibold mb-4 section-title">Select Input Method</h3>

        <div className="flex flex-wrap gap-3">
          <ClayButton
            variant={inputMode === "manual" ? "primary" : "ghost"}
            onClick={() => setInputMode("manual")}
            className={inputMode === "manual" ? "solid-brand-btn" : ""}
          >
            <Clipboard size={18} />
            Manual Entry
          </ClayButton>

          <ClayButton
            variant={inputMode === "excel" ? "primary" : "ghost"}
            onClick={() => setInputMode("excel")}
            className={inputMode === "excel" ? "solid-brand-btn" : ""}
          >
            <FileSpreadsheet size={18} />
            Upload Claim Batch
          </ClayButton>

          <ClayButton
            variant={inputMode === "pdf" ? "primary" : "ghost"}
            onClick={() => setInputMode("pdf")}
            className={inputMode === "pdf" ? "solid-brand-btn" : ""}
          >
            <FileText size={18} />
            PDF Upload
          </ClayButton>
        </div>
      </ClayCard>

      {inputMode === "manual" && (
        <ClayCard>
          <div className="mb-6">
            <h3 className="text-lg font-semibold section-title">Claim Information</h3>
            <p className="mt-2 section-subtitle">
              Enter claim details manually to run a pre-submission risk review.
            </p>
          </div>

          <div className="form-grid-clean">
            <ClayInput
              label="Patient Name"
              placeholder="John Smith"
              value={claim.patientName}
              onChange={(v) => updateClaim("patientName", v)}
              required
              maxLength={200}
            />

            <ClayInput
              label="Patient ID"
              placeholder="P001234"
              value={claim.patientId}
              onChange={(v) => updateClaim("patientId", v)}
              required
              maxLength={50}
            />

            <ClayInput
              label="Patient Age"
              placeholder="45"
              type="number"
              value={String(claim.patientAge)}
              onChange={(v) => updateClaim("patientAge", Number(v) || 0)}
            />

            <ClaySelect
              label="Payer / Insurance"
              value={claim.payerName}
              onChange={(v) => updateClaim("payerName", v)}
              options={[
                { value: "", label: "Select Payer..." },
                ...PAYER_NAMES.map((payer) => ({ value: payer, label: payer }))
              ]}
              required
            />

            <ClayInput
              label="Provider NPI"
              placeholder="1234567890"
              value={claim.providerNpi}
              onChange={(v) => updateClaim("providerNpi", v.replace(/\D/g, "").slice(0, 10))}
              required
              maxLength={10}
            />

            <ClaySelect
              label="Place of Service"
              value={claim.placeOfService}
              onChange={(v) => updateClaim("placeOfService", v)}
              options={[
                { value: "", label: "Select POS..." },
                ...Object.entries(PLACE_OF_SERVICE_CODES).map(([code, name]) => ({
                  value: code,
                  label: `${code} - ${name}`
                }))
              ]}
            />

            <ClaySelect
              label="CPT Code"
              value={claim.cptCode}
              onChange={(v) => updateClaim("cptCode", v)}
              options={[
                { value: "", label: "Select CPT Code..." },
                ...COMMON_CPT_CODES.map((code) => ({ value: code, label: code }))
              ]}
              required
            />

            <ClayInput
              label="Billed Amount (₹)"
              placeholder="1500.00"
              type="number"
              value={String(claim.billedAmount)}
              onChange={(v) => updateClaim("billedAmount", Number(v) || 0)}
            />

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-main)" }}>
                ICD-10 Codes
                <span style={{ color: "var(--risk-high)", marginLeft: 4 }}>*</span>
              </label>

              <div className="flex gap-2 mb-2">
                <select
                  className="clay-select flex-1"
                  value={icd10Input}
                  onChange={(e) => setIcd10Input(e.target.value)}
                >
                  <option value="">Select or type...</option>
                  {COMMON_ICD10_CODES.map((code) => (
                    <option key={code} value={code}>
                      {code}
                    </option>
                  ))}
                </select>

                <ClayButton
                  size="sm"
                  onClick={handleAddIcd}
                  className="solid-brand-btn"
                  disabled={!icd10Input.trim()}
                >
                  Add
                </ClayButton>
              </div>

              <div className="flex flex-wrap gap-2">
                {claim.icd10Codes.map((code) => (
                  <span key={code} className="data-chip">
                    {code}
                    <button
                      onClick={() => removeIcd10Code(code)}
                      type="button"
                      style={{ color: "var(--brand)", fontWeight: 700 }}
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="toggle-grid-clean">
            <ClayToggle
              label="Prior Authorization Obtained"
              checked={claim.priorAuthObtained}
              onChange={(v) => updateClaim("priorAuthObtained", v)}
            />

            <ClayToggle
              label="Insurance Active"
              checked={claim.insuranceActive}
              onChange={(v) => updateClaim("insuranceActive", v)}
            />

            <ClayToggle
              label="Documentation Complete"
              checked={claim.documentationComplete}
              onChange={(v) => updateClaim("documentationComplete", v)}
            />

            <ClayToggle
              label="Discharge Summary Available"
              checked={claim.dischargeSummary}
              onChange={(v) => updateClaim("dischargeSummary", v)}
            />

            <ClayToggle
              label="Investigation Reports Attached"
              checked={claim.investigationReports}
              onChange={(v) => updateClaim("investigationReports", v)}
            />

            <ClayToggle
              label="Detailed Bill Breakup Available"
              checked={claim.billBreakup}
              onChange={(v) => updateClaim("billBreakup", v)}
            />

            <ClayToggle
              label="Prescription Attached"
              checked={claim.prescriptionAttached}
              onChange={(v) => updateClaim("prescriptionAttached", v)}
            />

            <ClayToggle
              label="Network Hospital"
              checked={claim.networkHospital}
              onChange={(v) => updateClaim("networkHospital", v)}
            />
          </div>

          <div className="action-row-clean">
            <ClayButton
              onClick={handleSafeAnalyze}
              disabled={isProcessing || !canAnalyze}
              className="solid-brand-btn"
            >
              {isProcessing ? (
                <>
                  <RefreshCw size={18} className="animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Brain size={18} />
                  Run Smart Analysis
                </>
              )}
            </ClayButton>

            <ClayButton variant="ghost" onClick={resetForm} disabled={isProcessing}>
              <RefreshCw size={18} />
              Reset
            </ClayButton>

            <ClayButton variant="secondary" onClick={loadSampleData} disabled={isProcessing}>
              <Zap size={18} />
              Load Sample Data
            </ClayButton>
          </div>
        </ClayCard>
      )}

      {inputMode === "excel" && (
        <ClayCard>
          <h3 className="text-lg font-semibold mb-4 section-title">Upload Excel or CSV File</h3>

          <FileUploadZone
            onFileSelect={handleFileUpload}
            accept=".xlsx,.xls,.csv"
            label="Upload a claim file to start batch risk detection"
            sublabel="Supports .xlsx, .xls, and .csv formats"
            loading={isProcessing}
          />

          <div className="mt-4">
            <ClayButton variant="ghost" size="sm" onClick={downloadTemplate}>
              <Download size={16} />
              Download Sample Template
            </ClayButton>
          </div>
        </ClayCard>
      )}

      {inputMode === "pdf" && (
        <ClayCard>
          <h3 className="text-lg font-semibold mb-4 section-title">Upload PDF Document</h3>

          <FileUploadZone
            onFileSelect={handleFileUpload}
            accept=".pdf"
            label="Drop your PDF document here"
            sublabel="Supports text-based PDF documents"
            loading={isProcessing}
          />

          <p className="mt-4 text-sm section-subtitle">
            Note: The system will extract claim information from the PDF. Please review the extracted data.
          </p>
        </ClayCard>
      )}
    </div>
  );
}