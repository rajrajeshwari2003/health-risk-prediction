# health-risk-predictor-ai
📌 Project Overview

This project focuses on predicting the risk of major health diseases such as Heart Disease, Diabetes, and Kidney Disease using Machine Learning techniques. It combines data preprocessing, exploratory data analysis (EDA), and classification models to identify health risks based on patient medical records. The goal is to support early diagnosis and improve healthcare decision-making by building predictive models that can classify whether a patient is at risk of a disease or not.

📊 Dataset

The project uses healthcare datasets containing patient medical records with multiple health-related features.

Includes:
Age
Blood Pressure
Glucose Level
BMI
Insulin
Cholesterol
Heart Rate
Creatinine
Smoking Habit
Family Medical History
Disease Outcome (Target Variable)

The dataset contains both numerical and categorical data, making it suitable for real-world medical analysis and prediction tasks.

⚙️ Project Workflow
Data Preprocessing
Handled missing values using suitable imputation techniques
Removed duplicate records
Converted data into proper numerical format
Standardized and normalized features where required
Performed feature selection for better model accuracy
Exploratory Data Analysis (EDA)
Statistical analysis (mean, median, standard deviation)
Correlation heatmaps
Histograms and distribution plots
Boxplots for outlier detection
Scatter plots and comparison graphs
Disease-wise data visualization

📌 Key Insight: Strong relationships were found between major health indicators such as glucose level, BMI, blood pressure, and disease outcomes.

🤖 Machine Learning Models
🔹 Models Used:
Logistic Regression
Random Forest Classifier
🔹 Features:

Input: Medical health parameters such as age, glucose, BMI, blood pressure, cholesterol, etc.

Output: Disease Risk Prediction (At Risk / Not At Risk)

🔹 Data Split:
Training: 80%
Testing: 20%
🔹 Logistic Regression

Used for binary classification and helps in understanding the probability of disease occurrence.

🔹 Random Forest Classifier

Used for higher prediction accuracy by combining multiple decision trees and reducing overfitting.

📌 Observation: Random Forest performed better due to its ability to handle complex healthcare datasets more effectively.

📈 Results
Strong correlation between health parameters and disease outcomes
Random Forest showed better accuracy than Logistic Regression
Improved prediction performance using feature selection and preprocessing
Confirms that disease risks can be predicted effectively using Machine Learning models
🧠 Technologies Used
Python
Jupyter Notebook
Pandas
NumPy
Matplotlib
Seaborn
Scikit-learn
Machine Learning Algorithms
🎯 Key Learnings
Importance of data cleaning and preprocessing in healthcare datasets
Real-world application of EDA techniques
Understanding relationships between medical features
Building classification models for disease prediction
Comparing model performance using evaluation metrics
🚀 Future Improvements
Add more disease prediction modules
Use advanced models like XGBoost and Deep Learning
Deploy the project using Flask or Streamlit
Build a real-time health prediction web application
Integrate personalized health recommendations
Connect with hospital management systems for practical implementation
🙏 Acknowledgment

This project was developed as part of academic work at Lovely Professional University, with guidance from faculty and support from open-source healthcare datasets and machine learning resources. It helped in understanding how Artificial Intelligence can be applied in the healthcare industry for smarter and faster disease prediction.
