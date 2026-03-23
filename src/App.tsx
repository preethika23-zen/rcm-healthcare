import { useState, useCallback, useEffect } from "react";
import { Brain, FileSpreadsheet, FileText, BarChart3 } from "lucide-react";

import { ClayTabs } from "./components/ClayCard";

import type { ClaimData, ClaimAnalysisResult, BatchResult } from "./types/claim";
import { parseExcelOrCSV, generateSampleTemplate } from "./parsers/excelParser";
import { parsePDF } from "./parsers/pdfParser";
import { checkEligibility } from "./engines/eligibilityEngine";
import { getRiskBreakdown } from "./engines/denialRiskEngine";
import { generatePreventionActions } from "./engines/preventionEngine";
import {
  generateSecureId,
  sanitizeString,
  checkRateLimit,
  getClientIdentifier
} from "./utils/security";
import { generateSampleClaim, generateSampleBatch } from "./utils/sampleData";

import AppHeader from "./components/AppHeader";
import ErrorAlert from "./components/ErrorAlert";
import DashboardSection from "./components/DashboardSection";
import AnalyzeSection from "./components/AnalyzeSection";
import ResultsSection from "./components/ResultsSection";
import BatchSection from "./components/BatchSection";

const API_BASE_URL = "";

const initialClaim: ClaimData = {
  patientName: "",
  patientId: "",
  payerName: "",
  cptCode: "",
  icd10Codes: [],
  billedAmount: 0,
  patientAge: 0,
  providerNpi: "",
  placeOfService: "11",
  priorAuthObtained: false,
  insuranceActive: true,
  documentationComplete: false,
  dischargeSummary: false,
  investigationReports: false,
  billBreakup: false,
  prescriptionAttached: false,
  networkHospital: false
};

function App() {
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const savedTheme = localStorage.getItem("rcm-theme");
    return savedTheme === "dark" ? "dark" : "light";
  });

  const [activeTab, setActiveTab] = useState("dashboard");
  const [inputMode, setInputMode] = useState<"manual" | "excel" | "pdf">("manual");
  const [claim, setClaim] = useState<ClaimData>(initialClaim);
  const [icd10Input, setIcd10Input] = useState("");
  const [analysisResult, setAnalysisResult] = useState<ClaimAnalysisResult | null>(null);
  const [batchResult, setBatchResult] = useState<BatchResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, setSelectedResultIndex] = useState<number | null>(null);

  const [stats] = useState({
    totalClaimsAnalyzed: 1247,
    denialsPrevented: 312,
    averageRiskScore: 34,
    potentialSavings: 487250
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("rcm-theme", theme);
  }, [theme]);

  const updateClaim = useCallback((field: keyof ClaimData, value: unknown) => {
    setClaim((prev) => {
      if (typeof value === "string") {
        return { ...prev, [field]: sanitizeString(value, 500) };
      }
      return { ...prev, [field]: value };
    });
  }, []);

  const addIcd10Code = useCallback(() => {
    if (!icd10Input.trim()) return;

    const codes = icd10Input
      .split(/[,;\s]+/)
      .map((code) => sanitizeString(code, 20).trim().toUpperCase())
      .filter(Boolean);

    setClaim((prev) => ({
      ...prev,
      icd10Codes: [...new Set([...prev.icd10Codes, ...codes])].slice(0, 25)
    }));

    setIcd10Input("");
  }, [icd10Input]);

  const removeIcd10Code = useCallback((code: string) => {
    setClaim((prev) => ({
      ...prev,
      icd10Codes: prev.icd10Codes.filter((c) => c !== code)
    }));
  }, []);

  const getRiskLevel = (probability: number): "low" | "medium" | "high" => {
    if (probability >= 0.75) return "high";
    if (probability >= 0.4) return "medium";
    return "low";
  };

  const buildAnalysisResult = useCallback(
    async (claimToAnalyze: ClaimData): Promise<ClaimAnalysisResult | null> => {
      const rateCheck = checkRateLimit(getClientIdentifier(), "CLAIM_ANALYSIS");
      console.log("Sending to API:", claimToAnalyze);
      console.log("URL:", `${API_BASE_URL}/predict`);

      if (!rateCheck.allowed) {
        setError(
          `Rate limit exceeded. Please try again in ${Math.ceil(
            (rateCheck.resetTime - Date.now()) / 1000
          )} seconds.`
        );
        
        return null;
      }

      try {console.log("Sending claim to API:", claimToAnalyze);
        console.log("API URL:", `${API_BASE_URL}/predict`);
        const response = await fetch(`${API_BASE_URL}/predict`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(claimToAnalyze)
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Prediction API failed with status ${response.status}: ${errorText}`);
        }

        const prediction = await response.json();

        const eligibility = checkEligibility(claimToAnalyze);
        const denialProbability = Number(prediction.denial_probability ?? 0);
        const riskLevel = getRiskLevel(denialProbability);

        const riskPrediction = {
          riskScore: Math.round(denialProbability * 100),
          riskLevel,
          confidenceScore: Math.max(60, Math.round(denialProbability * 100)),
          reasons: Array.isArray(prediction.risk_factors) ? prediction.risk_factors : [],
          triggeredFactors: Array.isArray(prediction.risk_factors) ? prediction.risk_factors : [],
          timestamp: new Date().toISOString()
        };

        const prevention = generatePreventionActions(
          claimToAnalyze,
          eligibility,
          riskPrediction
        );

        return {
          id: generateSecureId(),
          claim: claimToAnalyze,
          eligibility,
          riskPrediction,
          prevention,
          analyzedAt: new Date().toISOString()
        };
      } catch (err) {
        setError("Analysis failed: " + (err instanceof Error ? err.message : "Unknown error"));
        return null;
      }
    },
    []
  );

  const handleManualAnalyze = useCallback(async () => {
  console.log("Run Smart Analysis clicked");
  console.log("Current claim:", claim);

  setIsProcessing(true);
  setError(null);

  try {
    if (
      !claim.patientName.trim() ||
      !claim.patientId.trim() ||
      !claim.payerName.trim() ||
      !claim.cptCode.trim() ||
      !claim.providerNpi.trim() ||
      !claim.placeOfService.trim() ||
      claim.icd10Codes.length === 0
    ) {
      console.log("Validation blocked request");
      setError("Please complete all required claim fields before analysis");
      return;
    }

    console.log("Calling buildAnalysisResult");
    const result = await buildAnalysisResult(claim);
    console.log("buildAnalysisResult result:", result);

    if (result) {
      setAnalysisResult(result);
      setActiveTab("results");
    }
  } catch (err) {
    console.error("handleManualAnalyze error:", err);
    setError(err instanceof Error ? err.message : "Manual analysis failed");
  } finally {
    setIsProcessing(false);
  }
}, [claim, buildAnalysisResult]);

  const handleFileUpload = useCallback(
    async (file: File) => {
      setIsProcessing(true);
      setError(null);
      setBatchResult(null);

      const startTime = Date.now();

      try {
        const isPdf = file.name.toLowerCase().endsWith(".pdf");
        const parseResult = isPdf ? await parsePDF(file) : await parseExcelOrCSV(file);

        if (!parseResult.success) {
          setError(parseResult.errors.join(". "));
          return;
        }

        if (parseResult.claims.length === 0) {
          setError("No valid claims found in the file");
          return;
        }

        if (parseResult.claims.length === 1) {
          const claimData = parseResult.claims[0] as ClaimData;
          setClaim(claimData);

          const result = await buildAnalysisResult(claimData);
          if (result) {
            setAnalysisResult(result);
            setActiveTab("results");
          }
          return;
        }

        const results: ClaimAnalysisResult[] = [];
        let eligibleCount = 0;
        let highRiskCount = 0;
        let mediumRiskCount = 0;
        let lowRiskCount = 0;

        for (const parsedClaim of parseResult.claims) {
          const claimData = parsedClaim as ClaimData;
          const result = await buildAnalysisResult(claimData);

          if (result) {
            results.push(result);

            if (result.eligibility.eligible) eligibleCount++;

            if (result.riskPrediction.riskLevel === "high") highRiskCount++;
            else if (result.riskPrediction.riskLevel === "medium") mediumRiskCount++;
            else lowRiskCount++;
          }
        }

        const batch: BatchResult = {
          totalClaims: parseResult.claims.length,
          eligibleCount,
          ineligibleCount: parseResult.claims.length - eligibleCount,
          highRiskCount,
          mediumRiskCount,
          lowRiskCount,
          processedAt: new Date().toISOString(),
          processingTimeMs: Date.now() - startTime,
          results
        };

        setBatchResult(batch);
        setActiveTab("batch");
      } catch (err) {
        setError(
          "File processing failed: " + (err instanceof Error ? err.message : "Unknown error")
        );
      } finally {
        setIsProcessing(false);
      }
    },
    [buildAnalysisResult]
  );

  const downloadTemplate = useCallback(() => {
    const blob = generateSampleTemplate();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "claim_template.xlsx";
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const resetForm = useCallback(() => {
    setClaim(initialClaim);
    setIcd10Input("");
    setAnalysisResult(null);
    setError(null);
  }, []);

  const loadSampleData = useCallback((riskLevel?: "low" | "medium" | "high") => {
    const sampleClaim = generateSampleClaim({ riskLevel });
    setClaim(sampleClaim);
    setError(null);
  }, []);

  const runDemoBatch = useCallback(async () => {
    setIsProcessing(true);
    setError(null);

    const startTime = Date.now();

    try {
      const sampleClaims = generateSampleBatch(15);
      const results: ClaimAnalysisResult[] = [];
      let eligibleCount = 0;
      let highRiskCount = 0;
      let mediumRiskCount = 0;
      let lowRiskCount = 0;

      for (const claimData of sampleClaims) {
        const result = await buildAnalysisResult(claimData);
        if (result) {
          results.push(result);

          if (result.eligibility.eligible) eligibleCount++;

          if (result.riskPrediction.riskLevel === "high") highRiskCount++;
          else if (result.riskPrediction.riskLevel === "medium") mediumRiskCount++;
          else lowRiskCount++;
        }
      }

      const batch: BatchResult = {
        totalClaims: sampleClaims.length,
        eligibleCount,
        ineligibleCount: sampleClaims.length - eligibleCount,
        highRiskCount,
        mediumRiskCount,
        lowRiskCount,
        processedAt: new Date().toISOString(),
        processingTimeMs: Date.now() - startTime,
        results
      };

      setBatchResult(batch);
      setActiveTab("batch");
    } catch (err) {
      setError("Demo failed: " + (err instanceof Error ? err.message : "Unknown error"));
    } finally {
      setIsProcessing(false);
    }
  }, [buildAnalysisResult]);

  const riskBreakdown = analysisResult ? getRiskBreakdown(analysisResult.claim) : [];

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: <BarChart3 size={16} /> },
    { id: "analyze", label: "Analyze Claims", icon: <Brain size={16} /> },
    { id: "results", label: "Results", icon: <FileText size={16} /> },
    { id: "batch", label: "Batch Results", icon: <FileSpreadsheet size={16} /> }
  ];

  return (
    <div className="app-page">
      <div className="app-shell">
        <AppHeader
          theme={theme}
          onToggleTheme={() => setTheme((prev) => (prev === "light" ? "dark" : "light"))}
        />

        <ClayTabs
          tabs={tabs}
          activeTab={activeTab}
          onChange={setActiveTab}
          className="mb-6"
        />

        <ErrorAlert error={error} onClose={() => setError(null)} />

        {activeTab === "dashboard" && <DashboardSection stats={stats} />}

        {activeTab === "analyze" && (
          <AnalyzeSection
            inputMode={inputMode}
            setInputMode={setInputMode}
            claim={claim}
            updateClaim={updateClaim}
            icd10Input={icd10Input}
            setIcd10Input={setIcd10Input}
            addIcd10Code={addIcd10Code}
            removeIcd10Code={removeIcd10Code}
            handleManualAnalyze={handleManualAnalyze}
            handleFileUpload={handleFileUpload}
            downloadTemplate={downloadTemplate}
            resetForm={resetForm}
            loadSampleData={() => loadSampleData()}
            isProcessing={isProcessing}
          />
        )}

        {activeTab === "results" && (
          <ResultsSection
            analysisResult={analysisResult}
            riskBreakdown={riskBreakdown}
            onAnalyzeAnother={() => setActiveTab("analyze")}
          />
        )}

        {activeTab === "batch" && (
          <BatchSection
            batchResult={batchResult}
            onUploadAnother={() => {
              setInputMode("excel");
              setActiveTab("analyze");
            }}
            onViewDetails={(result: ClaimAnalysisResult, index: number) => {
              setAnalysisResult(result);
              setSelectedResultIndex(index);
              setActiveTab("results");
            }}
          />
        )}

        <div className="flex justify-center mt-6">
          <button
            type="button"
            onClick={runDemoBatch}
            className="text-sm"
            style={{ color: "var(--text-soft)" }}
          >
            Run demo batch
          </button>
        </div>

        <footer className="app-footer">
          <p>RCM Denial Prediction Engine • Predictive Claim Intelligence Platform</p>
          <p className="mt-1">Built with security-first principles following OWASP guidelines</p>
        </footer>
      </div>
    </div>
  );
}

export default App;