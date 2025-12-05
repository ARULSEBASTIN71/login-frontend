import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./dashboard.css"; // create this file next to Dashboard.jsx

// Helper functions
function calcBMR({ sex, weightKg, heightCm, age }) {
  // Mifflin-St Jeor
  if (sex === "female") {
    return Math.round(10 * weightKg + 6.25 * heightCm - 5 * age - 161);
  }
  // default male
  return Math.round(10 * weightKg + 6.25 * heightCm - 5 * age + 5);
}

function activityMultiplier(level) {
  // returns multiplier for TDEE
  switch (level) {
    case "sedentary":
      return 1.2;
    case "light":
      return 1.375;
    case "moderate":
      return 1.55;
    case "active":
      return 1.725;
    case "very":
      return 1.9;
    default:
      return 1.375;
  }
}

export default function Dashboard() {
  const navigate = useNavigate();

  // auth & user info shown (read-only)
  const [userEmail, setUserEmail] = useState("");
  useEffect(() => {
    // try to read stored user info (you may have stored name/email somewhere)
    const savedEmail = localStorage.getItem("userEmail") || "";
    setUserEmail(savedEmail);
  }, []);

  // Calorie tracker state
  const [sex, setSex] = useState("male");
  const [age, setAge] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [activity, setActivity] = useState("moderate");
  const [goal, setGoal] = useState("maintain"); // maintain / cut / bulk
  const [result, setResult] = useState(null);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    // if user previously calculated, load it
    const saved = localStorage.getItem("calorieTracker");
    if (saved) {
      const parsed = JSON.parse(saved);
      setResult(parsed.result || null);
      setSex(parsed.sex || "male");
      setAge(parsed.age || "");
      setWeightKg(parsed.weightKg || "");
      setHeightCm(parsed.heightCm || "");
      setActivity(parsed.activity || "moderate");
      setGoal(parsed.goal || "maintain");
    }
  }, []);

  function handleCalculate(e) {
    e.preventDefault();
    // basic validation
    const ageN = Number(age);
    const weightN = Number(weightKg);
    const heightN = Number(heightCm);
    if (!ageN || !weightN || !heightN) {
      setNotes("Please enter valid numeric Age, Weight (kg) and Height (cm).");
      return;
    }
    setNotes("");

    const bmr = calcBMR({ sex, weightKg: weightN, heightCm: heightN, age: ageN });
    const tdee = Math.round(bmr * activityMultiplier(activity));

    let suggested;
    if (goal === "maintain") {
      suggested = tdee;
    } else if (goal === "cut") {
      // common ranges: -15% to -25%
      suggested = Math.round(tdee * 0.8); // 20% deficit
    } else {
      // bulk
      suggested = Math.round(tdee * 1.15); // 15% surplus
    }

    // macros simple breakdown (protein 2g/kg, fat 25% calories, rest carbs)
    const proteinGrams = Math.round(2 * weightN); // g per day
    const proteinCals = proteinGrams * 4;
    const fatCals = Math.round(suggested * 0.25);
    const fatGrams = Math.round(fatCals / 9);
    const carbsCals = suggested - (proteinCals + fatCals);
    const carbsGrams = Math.round(carbsCals / 4);

    const res = {
      bmr,
      tdee,
      suggested,
      proteinGrams,
      fatGrams,
      carbsGrams,
      goal,
      activity,
    };

    setResult(res);
    // persist
    localStorage.setItem("calorieTracker", JSON.stringify({ result: res, sex, age, weightKg, heightCm, activity, goal }));
  }

  function handleLogout() {
    // remove auth token and redirect to login (match your storage key)
    localStorage.removeItem("authToken");
    // optional: remove other stored items you want to clear
    // localStorage.removeItem("userEmail");
    navigate("/login");
  }

  function handleClear() {
    localStorage.removeItem("calorieTracker");
    setResult(null);
    setNotes("Saved calorie data cleared.");
  }

  return (
    <div className="dash-wrap">
      <header className="dash-header">
        <div>
          <h1 className="dash-title">Welcome to your Dashboard</h1>
          <p className="dash-sub">This is a placeholder protected page. Token → localStorage.authToken</p>
        </div>

        <div className="header-actions">
          {userEmail && <div className="user-badge">Signed in as <strong>{userEmail}</strong></div>}
          <button className="btn-logout" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      <main className="dash-main">
        <section className="card calorie-card">
          <h2>Calorie Tracker</h2>
          <p className="muted">Enter your details to get daily calories and simple macro split for Maintain / Cut / Bulk.</p>

          <form className="calorie-form" onSubmit={handleCalculate}>
            <div className="row">
              <label>Sex</label>
              <select value={sex} onChange={(e) => setSex(e.target.value)}>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>

            <div className="row triple">
              <div>
                <label>Age (years)</label>
                <input type="number" value={age} onChange={(e) => setAge(e.target.value)} min="10" />
              </div>
              <div>
                <label>Weight (kg)</label>
                <input type="number" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} step="0.1" />
              </div>
              <div>
                <label>Height (cm)</label>
                <input type="number" value={heightCm} onChange={(e) => setHeightCm(e.target.value)} />
              </div>
            </div>

            <div className="row">
              <label>Activity level</label>
              <select value={activity} onChange={(e) => setActivity(e.target.value)}>
                <option value="sedentary">Sedentary (little/no exercise)</option>
                <option value="light">Light (1–3 days/week)</option>
                <option value="moderate">Moderate (3–5 days/week)</option>
                <option value="active">Active (6–7 days/week)</option>
                <option value="very">Very active (hard exercise / job)</option>
              </select>
            </div>

            <div className="row">
              <label>Goal</label>
              <div className="radio-row">
                <label><input type="radio" name="goal" value="maintain" checked={goal === "maintain"} onChange={(e) => setGoal(e.target.value)} /> Maintain</label>
                <label><input type="radio" name="goal" value="cut" checked={goal === "cut"} onChange={(e) => setGoal(e.target.value)} /> Cutting (-20%)</label>
                <label><input type="radio" name="goal" value="bulk" checked={goal === "bulk"} onChange={(e) => setGoal(e.target.value)} /> Bulking (+15%)</label>
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary">Calculate</button>
              <button type="button" className="btn-secondary" onClick={handleClear}>Clear saved</button>
            </div>

            {notes && <p className="notes">{notes}</p>}
          </form>

          {result && (
            <div className="result">
              <h3>Results</h3>
              <div className="result-grid">
                <div><strong>BMR</strong><div>{result.bmr} kcal</div></div>
                <div><strong>TDEE</strong><div>{result.tdee} kcal</div></div>
                <div><strong>Suggested</strong><div>{result.suggested} kcal / day ({result.goal})</div></div>
                <div><strong>Protein</strong><div>{result.proteinGrams} g</div></div>
                <div><strong>Fat</strong><div>{result.fatGrams} g</div></div>
                <div><strong>Carbs</strong><div>{result.carbsGrams} g</div></div>
              </div>

              <div className="result-note">
                <small>Tip: Use Cutting for fat loss, Bulking for lean mass gain. Adjust rates and monitor weekly.</small>
              </div>
            </div>
          )}
        </section>

        <aside className="card info-card">
          <h3>Quick Actions</h3>
          <ul>
            <li>Logout will clear token and redirect to login.</li>
            <li>Calorie results are saved in localStorage for convenience.</li>
            <li>Use these numbers as starting point — track weight & adjust every 1–2 weeks.</li>
          </ul>
        </aside>
      </main>
    </div>
  );
}
