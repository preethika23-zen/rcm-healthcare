RCM Denial Prediction & Prevention Engine
This system uses machine learning to manage healthcare revenue cycles. It predicts insurance claim denials before submission. This helps reduce rejection rates, rework, and delays in reimbursement.

Overview
Healthcare claim denials increase administrative work and slow down the revenue cycle. This project aims to identify potential claim denials early using machine learning. It also provides a workflow that allows billing teams to check claims before submitting them.

Key Features
- Predicts the chance of claim denial before submission
- User interface for entering claim details
- FastAPI backend for delivering model predictions
- Scikit-learn based machine learning model
- Real-time API integration between the frontend and backend
- Simple workflow for healthcare revenue cycle management use cases

Development Contribution
This project mainly came together through manual development, which included:

- Designing the complete UI/UX and page flow
- Implementing the frontend
- Developing the backend API
- Training and integrating the model
- Structuring the workflow and planning features

AI tools were used in a few cases for small code snippets and quick fixes. Most design decisions, core structure, and integrations were done manually.

Tech Stack

Frontend
- React
- TypeScript
- Vite

Backend
- FastAPI
- Python

Machine Learning
- Scikit-learn
- Pandas
- Joblib

System Workflow
Claim Data Input → API Request → ML Model Prediction → Denial Risk Output → Preventive Insight

Project Structure
backend    API and model serving
frontend   User interface
model      Training scripts and datasets
assets     Screenshots and diagrams

for a better File Directory ,follow this for bettter management

RCMv2
│
├── node_modules
│
├── src
│   ├── components
│   │   ├── AnalyzeSection.tsx
│   │   ├── AppHeader.tsx
│   │   ├── BatchSection.tsx
│   │   ├── ClayCard.tsx
│   │   ├── DashboardSection.tsx
│   │   ├── ErrorAlert.tsx
│   │   ├── index.ts
│   │   └── ResultsSection.tsx
│   │
│   ├── engines
│   │   ├── denialRiskEngine.ts
│   │   ├── eligibilityEngine.ts
│   │   └── preventionEngine.ts
│   │
│   ├── ml
│   │   ├── __pycache__
│   │   ├── api.py
│   │   ├── claims_training_data.xlsx
│   │   ├── denial_model.pkl
│   │   ├── patient_claims_data.xlsx
│   │   └── train_model.py
│   │
│   ├── parsers
│   │   ├── excelParser.ts
│   │   └── pdfParser.ts
│   │
│   ├── types
│   │   └── claim.ts
│   │
│   ├── utils
│   │   ├── cn.ts
│   │   ├── fieldMapper.ts
│   │   ├── sampleData.ts
│   │   └── security.ts
│   │
│   ├── validators
│   │
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
│
├── denial_model.pkl
├── index.html
├── package-lock.json
├── package.json
├── tsconfig.json
└── vite.config.ts
