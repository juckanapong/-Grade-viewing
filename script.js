const API_URL = "https://script.google.com/macros/s/AKfycbzo14ntBx5GoJG6grpPFO5NJGNMj6JydjtyNVFbdcTQAUMVqkfoL_YVv6mYDRO-nVjRTQ/exec";

async function fetchScore() {
  const studentId = document.getElementById("studentId").value.trim();
  
  if (!studentId) {
    alert("กรุณากรอกรหัสนักเรียน");
    return;
  }

  // แสดง loading และซ่อน error/result
  showLoading();
  hideError();
  hideResult();

  try {
    const res = await fetch(`${API_URL}?studentId=${studentId}`);
    const data = await res.text();

    hideLoading();

    // ตรวจสอบว่าได้ข้อมูลหรือไม่
    if (data === "NOT_FOUND" || data.includes("NOT_FOUND")) {
      showError();
      return;
    }

    // Parse JSON
    let studentData;
    try {
      studentData = JSON.parse(data);
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError);
      showError();
      return;
    }
    
    // ตรวจสอบว่ามี error ในข้อมูลหรือไม่
    if (studentData.error || !studentData.studentId) {
      showError();
      return;
    }

    displayResult(studentData);

  } catch (error) {
    console.error("Error:", error);
    hideLoading();
    showError();
  }
}

function displayResult(studentData) {
  // ใส่ข้อมูลพื้นฐาน
  document.getElementById("number").innerText = studentData.number;
  document.getElementById("displayStudentId").innerText = studentData.studentId;
  document.getElementById("fullName").innerText = studentData.fullName;
  document.getElementById("classroom").innerText = studentData.classroom;

  // ฟังก์ชันช่วยสร้างแถวในตาราง
  const createRows = (scoresObj) => {
    return Object.entries(scoresObj).map(([key, value]) => `
      <tr>
        <td>${key}</td>
        <td style="text-align: center; font-weight: bold;">${value}</td>
      </tr>
    `).join('');
  };

  // แสดงคะแนนในตาราง
  document.getElementById("midtermTable").querySelector("tbody").innerHTML = createRows(studentData.midtermScores);
  document.getElementById("finalTable").querySelector("tbody").innerHTML = createRows(studentData.finalScores);

  // สรุปผล
  const totalElem = document.getElementById("total");
  const gradeElem = document.getElementById("grade");

  totalElem.innerText = studentData.totalScore;
  gradeElem.innerText = studentData.grade;

  // เปลี่ยนสีเกรด (เรียกใช้ฟังก์ชันที่คุณครูมีอยู่แล้ว)
  gradeElem.className = "final-grade " + getGradeClass(studentData.grade.toString());

  showResult();
}

function addScoreRow(tbody, subject, score) {
  const row = document.createElement("tr");
  const subjectCell = document.createElement("td");
  const scoreCell = document.createElement("td");

  subjectCell.textContent = subject;
  scoreCell.innerHTML = `<span class="score-value ${getScoreClass(score)}">${score}</span>`;
  scoreCell.style.textAlign = "center";

  row.appendChild(subjectCell);
  row.appendChild(scoreCell);
  tbody.appendChild(row);
}

// ฟังก์ชันสำรองกรณีไม่มีข้อมูลแยกกลุ่ม
function populateScoresByKeywords(scores, midtermBody, finalBody) {
  const midtermKeywords = ["กลางภาค", "ใบงานที่ 1", "ชิ้นงานที่"];
  const finalKeywords = ["ปลายภาค", "ใบงานที่ 2", "ใบงานที่ 3", "infographic", "เทคโนโลยี"];
  const excludeItems = ["คะแนนรวมทั้งหมด", "ผลการเรียน"];

  for (const [subject, score] of Object.entries(scores)) {
    if (excludeItems.includes(subject)) continue;
    if (score === null || score === undefined || score === "" || score === 0) continue;

    const isMidterm = midtermKeywords.some(keyword => subject.includes(keyword));
    const isFinal = finalKeywords.some(keyword => subject.includes(keyword));

    if (isMidterm) {
      addScoreRow(midtermBody, subject, score);
    } else if (isFinal) {
      addScoreRow(finalBody, subject, score);
    } else {
      // ถ้าไม่แน่ใจ ใส่ไว้ในกลางภาค
      addScoreRow(midtermBody, subject, score);
    }
  }
}

function getScoreClass(score) {
  const numScore = parseFloat(score);
  if (isNaN(numScore)) return "score-average";
  if (numScore >= 80) return "score-excellent";
  if (numScore >= 70) return "score-good";
  if (numScore >= 60) return "score-average";
  return "score-poor";
}

function getGradeClass(grade) {
  if (!grade) return "";
  const g = grade.toString().toUpperCase();
  if (g.includes("4") || g.includes("A")) return "grade-a";
  if (g.includes("3") || g.includes("B")) return "grade-b";
  if (g.includes("2") || g.includes("C")) return "grade-c";
  return "grade-d";
}

function showLoading() {
  const overlay = document.getElementById("loadingOverlay");
  if (overlay) {
    overlay.classList.remove("hidden");
  }
}

function hideLoading() {
  const overlay = document.getElementById("loadingOverlay");
  if (overlay) {
    overlay.classList.add("hidden");
  }
}

function showError() {
  const errorElement = document.getElementById("error");
  if (errorElement) {
    errorElement.classList.remove("hidden");
    errorElement.classList.add("shake");
    setTimeout(() => errorElement.classList.remove("shake"), 600);
  }
}

function hideError() {
  const errorElement = document.getElementById("error");
  if (errorElement) {
    errorElement.classList.add("hidden");
    errorElement.classList.remove("shake");
  }
}

function showResult() {
  const result = document.getElementById("result");
  result.classList.remove("hidden");
  result.classList.add("fadeIn");
}

function hideResult() {
  const result = document.getElementById("result");
  result.classList.add("hidden");
  result.classList.remove("fadeIn");
}

// กด Enter เพื่อค้นหา
document.addEventListener("DOMContentLoaded", function() {
  const studentIdInput = document.getElementById("studentId");
  if (studentIdInput) {
    studentIdInput.addEventListener("keypress", function(e) {
      if (e.key === "Enter") {
        fetchScore();
      }
    });
  }
});