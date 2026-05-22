import joblib
import os

directory = r"c:\Users\LENOVO\Downloads\finalpythonproject"

models = [
    "diabetes_model.pkl", "diabetes_rf_model.pkl", "diabetes_scaler.pkl",
    "heart_model.pkl", "heart_rf_model.pkl", "heart_scaler.pkl",
    "kidney_model.pkl", "kidney_rf_model.pkl", "kidney_scaler.pkl"
]

for model_name in models:
    path = os.path.join(directory, model_name)
    if os.path.exists(path):
        with open(path, "rb") as f:
            obj = joblib.load(f)
            print(f"--- {model_name} ---")
            print(f"Type: {type(obj)}")
            if hasattr(obj, "n_features_in_"):
                print(f"Num Features: {obj.n_features_in_}")
            if hasattr(obj, "feature_names_in_"):
                print(f"Feature Names: {list(obj.feature_names_in_)}")
            print()
