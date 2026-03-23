import pandas as pd
import joblib
import os


from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder
from sklearn.impute import SimpleImputer
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, roc_auc_score

BASE_DIR = os.path.dirname(__file__)
DATA_PATH = os.path.join(BASE_DIR, "patient_claims_dataset.csv")

df = pd.read_csv(DATA_PATH)

df = df.rename(columns={
    "payerName": "payer_name",
    "cptCode": "cpt_code",
    "placeOfService": "place_of_service",
    "billedAmount": "billed_amount",
    "patientAge": "patient_age",
    "providerNpi": "provider_npi",
    "priorAuthObtained": "prior_auth_obtained",
    "insuranceActive": "insurance_active",
    "documentationComplete": "documentation_complete"
})

yes_no_map = {"Yes": 1, "No": 0}

df["prior_auth_obtained"] = df["prior_auth_obtained"].map(yes_no_map)
df["insurance_active"] = df["insurance_active"].map(yes_no_map)
df["documentation_complete"] = df["documentation_complete"].map(yes_no_map)

df["provider_npi_valid"] = df["provider_npi"].astype(str).str.fullmatch(r"\d{10}").astype(int)
df["icd10_count"] = df["icd10Codes"].fillna("").apply(
    lambda x: len([code.strip() for code in str(x).split(",") if code.strip()])
)

df["denied"] = (
    (df["prior_auth_obtained"] == 0) |
    (df["insurance_active"] == 0) |
    (df["documentation_complete"] == 0) |
    (df["billed_amount"] > 1000)
).astype(int)

feature_columns = [
    "payer_name",
    "cpt_code",
    "place_of_service",
    "billed_amount",
    "patient_age",
    "icd10_count",
    "prior_auth_obtained",
    "insurance_active",
    "documentation_complete",
    "provider_npi_valid"
]

X = df[feature_columns]
y = df["denied"]

categorical_features = ["payer_name", "cpt_code", "place_of_service"]
numeric_features = [
    "billed_amount",
    "patient_age",
    "icd10_count",
    "prior_auth_obtained",
    "insurance_active",
    "documentation_complete",
    "provider_npi_valid"
]

categorical_transformer = Pipeline(steps=[
    ("imputer", SimpleImputer(strategy="most_frequent")),
    ("onehot", OneHotEncoder(handle_unknown="ignore"))
])

numeric_transformer = Pipeline(steps=[
    ("imputer", SimpleImputer(strategy="median"))
])

preprocessor = ColumnTransformer(
    transformers=[
        ("cat", categorical_transformer, categorical_features),
        ("num", numeric_transformer, numeric_features)
    ]
)

model = Pipeline(steps=[
    ("preprocessor", preprocessor),
    ("classifier", RandomForestClassifier(
        n_estimators=150,
        max_depth=8,
        random_state=42
    ))
])

X_train, X_test, y_train, y_test = train_test_split(
    X, y,
    test_size=0.2,
    random_state=42,
    stratify=y
)

model.fit(X_train, y_train)

pred_probs = model.predict_proba(X_test)[:, 1]
preds = model.predict(X_test)

print("Columns used:", feature_columns)
print(classification_report(y_test, preds, zero_division=0))
print("ROC-AUC:", roc_auc_score(y_test, pred_probs))

joblib.dump(model, "denial_model.pkl")
print("Model saved as denial_model.pkl")