from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import pandas as pd
import joblib
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(__file__)
MODEL_PATH = os.path.join(BASE_DIR, "denial_model.pkl")

model = joblib.load(MODEL_PATH)


class ClaimInput(BaseModel):
    patientName: str
    patientId: str
    payerName: str
    cptCode: str
    icd10Codes: List[str]
    billedAmount: float
    patientAge: int
    providerNpi: str
    placeOfService: str
    priorAuthObtained: bool
    insuranceActive: bool
    documentationComplete: bool
    dischargeSummary: bool = True
    investigationReports: bool = True
    billBreakup: bool = True
    prescriptionAttached: bool = True
    networkHospital: bool = True


class BatchClaimInput(BaseModel):
    claims: List[ClaimInput]


@app.get("/")
def root():
    return {"message": "API working"}


def transform_claim_for_model(claim: ClaimInput) -> pd.DataFrame:
    provider_npi_valid = 1 if str(claim.providerNpi).isdigit() and len(str(claim.providerNpi)) == 10 else 0

    documentation_complete = (
        claim.documentationComplete
        and claim.dischargeSummary
        and claim.investigationReports
        and claim.billBreakup
        and claim.prescriptionAttached
    )

    row = {
        "payer_name": claim.payerName,
        "cpt_code": claim.cptCode,
        "place_of_service": claim.placeOfService,
        "billed_amount": claim.billedAmount,
        "patient_age": claim.patientAge,
        "icd10_count": len(claim.icd10Codes),
        "prior_auth_obtained": 1 if claim.priorAuthObtained else 0,
        "insurance_active": 1 if claim.insuranceActive else 0,
        "documentation_complete": 1 if documentation_complete else 0,
        "provider_npi_valid": provider_npi_valid,
    }

    return pd.DataFrame([row])


def build_risk_factors(claim: ClaimInput) -> list[str]:
    reasons = []

    if not claim.insuranceActive:
        reasons.append("Insurance inactive")
    if not claim.priorAuthObtained:
        reasons.append("Prior authorization missing")
    if not claim.documentationComplete:
        reasons.append("Core documentation incomplete")
    if not claim.dischargeSummary:
        reasons.append("Discharge summary missing")
    if not claim.investigationReports:
        reasons.append("Investigation reports missing")
    if not claim.billBreakup:
        reasons.append("Bill breakup missing")
    if not claim.prescriptionAttached:
        reasons.append("Prescription not attached")
    if not claim.networkHospital:
        reasons.append("Hospital may be out of network")
    if not str(claim.providerNpi).isdigit() or len(str(claim.providerNpi)) != 10:
        reasons.append("Provider NPI invalid")
    if claim.billedAmount > 1000:
        reasons.append("High billed amount")

    return reasons


@app.post("/predict")
def predict_claim(claim: ClaimInput):
    df = transform_claim_for_model(claim)
    probability = float(model.predict_proba(df)[0][1])
    prediction = int(model.predict(df)[0])

    return {
        "denial_probability": round(probability, 4),
        "prediction": prediction,
        "status": "Denied" if prediction == 1 else "Approved",
        "risk_factors": build_risk_factors(claim)
    }


@app.post("/predict-batch")
def predict_batch(batch: BatchClaimInput):
    results = []

    for claim in batch.claims:
        df = transform_claim_for_model(claim)
        probability = float(model.predict_proba(df)[0][1])
        prediction = int(model.predict(df)[0])

        results.append({
            "patientName": claim.patientName,
            "patientId": claim.patientId,
            "payerName": claim.payerName,
            "denial_probability": round(probability, 4),
            "prediction": prediction,
            "status": "Denied" if prediction == 1 else "Approved",
            "risk_factors": build_risk_factors(claim)
        })

    return {
        "count": len(results),
        "results": results
    }