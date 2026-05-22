from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import joblib
import numpy as np
import os
from typing import List

app = FastAPI(title="Health Prediction API", description="API for Diabates, Heart, and Kidney Disease Prediction")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Relative paths since we will run from the root project folder
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Load models safely
def load_pkl(filename):
    path = os.path.join(BASE_DIR, filename)
    if os.path.exists(path):
        return joblib.load(path)
    print(f"Warning: {filename} not found.")
    return None

diabetes_lr = load_pkl("diabetes_model.pkl")
diabetes_rf = load_pkl("diabetes_rf_model.pkl")
diabetes_scaler = load_pkl("diabetes_scaler.pkl")

heart_lr = load_pkl("heart_model.pkl")
heart_rf = load_pkl("heart_rf_model.pkl")
heart_scaler = load_pkl("heart_scaler.pkl")

kidney_lr = load_pkl("kidney_model.pkl")
kidney_rf = load_pkl("kidney_rf_model.pkl")
kidney_scaler = load_pkl("kidney_scaler.pkl")


class DiabetesInput(BaseModel):
    glucose: float
    bmi: float
    age: float
    insulin: float

class HeartInput(BaseModel):
    age: float
    resting_blood_pressure: float
    cholestoral: float
    max_heart_rate: float
    oldpeak: float
    sex: str
    chest_pain_type: str
    fasting_blood_sugar: str
    rest_ecg: str
    exercise_induced_angina: str
    slope: str
    vessels_colored_by_flourosopy: str
    thalassemia: str

class KidneyInput(BaseModel):
    age: float
    bp: float
    bgr: float
    bu: float
    sc: float
    hemo: float


def get_prediction(lr_model, rf_model, scaler, feature_array):
    if lr_model is None or rf_model is None or scaler is None:
        raise HTTPException(status_code=500, detail="Models not loaded properly.")
    
    scaled_features = scaler.transform([feature_array])
    
    # get probabilities (assuming binary classification where index 1 is positive class)
    lr_prob = float(lr_model.predict_proba(scaled_features)[0][1])
    rf_prob = float(rf_model.predict_proba(scaled_features)[0][1])
    
    # ensemble is simple average
    ensemble_prob = (lr_prob + rf_prob) / 2
    prediction = int(ensemble_prob > 0.5)
    
    return {
        "prediction": prediction,
        "ensemble_probability": ensemble_prob,
        "lr_probability": lr_prob,
        "rf_probability": rf_prob
    }


@app.post("/predict/diabetes")
def predict_diabetes(data: DiabetesInput):
    features = [data.glucose, data.bmi, data.age, data.insulin]
    return get_prediction(diabetes_lr, diabetes_rf, diabetes_scaler, features)

@app.post("/predict/heart")
def predict_heart(data: HeartInput):
    # Mapping to 22 features
    # features: ['age', 'resting_blood_pressure', 'cholestoral', 'max_heart_rate', 'oldpeak', 
    # 'sex_Male', 'chest_pain_type_Atypical angina', 'chest_pain_type_Non-anginal pain', 
    # 'chest_pain_type_Typical angina', 'fasting_blood_sugar_Lower than 120 mg/ml', 
    # 'rest_ecg_Normal', 'rest_ecg_ST-T wave abnormality', 'exercise_induced_angina_Yes', 
    # 'slope_Flat', 'slope_Upsloping', 'vessels_colored_by_flourosopy_One', 
    # 'vessels_colored_by_flourosopy_Three', 'vessels_colored_by_flourosopy_Two', 
    # 'vessels_colored_by_flourosopy_Zero', 'thalassemia_No', 'thalassemia_Normal', 'thalassemia_Reversable Defect']
    
    f = [0.0] * 22
    f[0] = data.age
    f[1] = data.resting_blood_pressure
    f[2] = data.cholestoral
    f[3] = data.max_heart_rate
    f[4] = data.oldpeak
    
    if data.sex == "Male": f[5] = 1.0
    if data.chest_pain_type == "Atypical angina": f[6] = 1.0
    if data.chest_pain_type == "Non-anginal pain": f[7] = 1.0
    if data.chest_pain_type == "Typical angina": f[8] = 1.0
    if data.fasting_blood_sugar == "Lower than 120 mg/ml": f[9] = 1.0
    if data.rest_ecg == "Normal": f[10] = 1.0
    if data.rest_ecg == "ST-T wave abnormality": f[11] = 1.0
    if data.exercise_induced_angina == "Yes": f[12] = 1.0
    if data.slope == "Flat": f[13] = 1.0
    if data.slope == "Upsloping": f[14] = 1.0
    if data.vessels_colored_by_flourosopy == "One": f[15] = 1.0
    if data.vessels_colored_by_flourosopy == "Three": f[16] = 1.0
    if data.vessels_colored_by_flourosopy == "Two": f[17] = 1.0
    if data.vessels_colored_by_flourosopy == "Zero": f[18] = 1.0
    if data.thalassemia == "No": f[19] = 1.0
    if data.thalassemia == "Normal": f[20] = 1.0
    if data.thalassemia == "Reversable Defect": f[21] = 1.0
    
    return get_prediction(heart_lr, heart_rf, heart_scaler, f)


@app.post("/predict/kidney")
def predict_kidney(data: KidneyInput):
    features = [data.age, data.bp, data.bgr, data.bu, data.sc, data.hemo]
    return get_prediction(kidney_lr, kidney_rf, kidney_scaler, features)

frontend_path = os.path.join(BASE_DIR, "frontend_web")
if os.path.exists(frontend_path):
    app.mount("/", StaticFiles(directory=frontend_path, html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
