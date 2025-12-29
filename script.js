// *** สำคัญ: ตรวจสอบ URL นี้ให้เป็น URL ล่าสุดจากการ Deploy (New Version) ของคุณครูนะครับ ***
const API_URL = "https://script.google.com/macros/s/AKfycbwlbRf6XVXIukD4rOlOBjddG9Kb4srzJ0r_f-g_j2RGj1B4AHYYM8fNIf9xd3VnP9ZYXw/exec";

// เกณฑ์สอบผ่าน (12 คะแนน)
const EXAM_PASS_SCORE = 12; 

function animateCounter(id, target, suffix = "") {
    const obj = document.getElementById(id);
    if (!obj) return;
    if (isNaN(parseFloat(target))) { obj.innerText = target; return; }
    
    const duration = 1500;
    const start = performance.now();
    const targetNum = parseFloat(target);

    function update(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const isGrade = id === 'grade';
        const numValue = isGrade ? (progress * targetNum).toFixed(2) : Math.floor(progress * targetNum);
        obj.innerText = numValue + suffix;
        if (progress < 1) requestAnimationFrame(update);
        else obj.innerText = (isGrade ? targetNum.toFixed(2) : Math.round(targetNum)) + suffix;
    }
    requestAnimationFrame(update);
}

// --- ฟังก์ชัน Login ---
async function fetchScore() {
    const studentId = document.getElementById("studentId").value.trim();
    const password = document.getElementById("password").value.trim();
    const selectedClass = document.getElementById("classSelect").value;
    
    if (!studentId || !password) { 
        Swal.fire({ icon: 'warning', title: 'กรุณากรอกข้อมูล', text: 'ต้องใส่รหัสประจำตัวและรหัสผ่าน' });
        return; 
    }
    
    document.getElementById("loadingOverlay").classList.remove("hidden");
    document.getElementById("login-section").classList.add("hidden");

    try {
        const res = await fetch(API_URL, {
            method: "POST",
            body: JSON.stringify({ 
                action: "studentLogin", 
                studentId: studentId, 
                password: password,
                sheetName: selectedClass 
            })
        });
        const data = await res.json();
        document.getElementById("loadingOverlay").classList.add("hidden");

        if (data.result === "error" || data.error) { 
            Swal.fire({ icon: 'error', title: 'ผิดพลาด', text: data.message || 'ข้อมูลไม่ถูกต้อง กรุณาลองใหม่' });
            document.getElementById("login-section").classList.remove("hidden");
            return; 
        }
        
        displayResult(data);

        // *** ส่วนที่ผมทำหายไป: นำกลับมาใส่คืนให้แล้วครับ ***
        // ถ้าใช้รหัส 1234 ให้แจ้งเตือนและบังคับเปลี่ยนทันที
        if (password === "1234") {
            Swal.fire({
                icon: 'warning',
                title: 'แจ้งเตือนความปลอดภัย',
                text: 'คุณยังใช้รหัสผ่านเริ่มต้น (1234) กรุณาตั้งรหัสผ่านใหม่เพื่อความเป็นส่วนตัว',
                allowOutsideClick: false,
                confirmButtonText: 'เปลี่ยนรหัสผ่านเดี๋ยวนี้',
                confirmButtonColor: '#d97706'
            }).then((result) => {
                if (result.isConfirmed) {
                    openChangePassModal(true); // เปิด Modal แบบบังคับ (ซ่อนปุ่มยกเลิก)
                }
            });
        }

    } catch (error) {
        document.getElementById("loadingOverlay").classList.add("hidden");
        document.getElementById("login-section").classList.remove("hidden");
        Swal.fire('Error', 'ไม่สามารถเชื่อมต่อฐานข้อมูลได้', 'error');
    }
}

function displayResult(studentData) {
    document.getElementById("number").innerText = studentData.number;
    document.getElementById("displayStudentId").innerText = studentData.studentId;
    document.getElementById("fullName").innerText = studentData.fullName;
    document.getElementById("classroom").innerText = studentData.classroom;

    // --- คำนวณคะแนนรวมและเกรด ---
    let calculatedTotal = 0;
    const sumScores = (scoresObj) => {
        if (!scoresObj) return;
        Object.values(scoresObj).forEach(val => {
            if (val && !isNaN(val)) calculatedTotal += parseFloat(val);
        });
    };
    sumScores(studentData.midtermScores);
    sumScores(studentData.finalScores);

    let calculatedGrade = "0";
    if (calculatedTotal >= 80) calculatedGrade = "4";
    else if (calculatedTotal >= 75) calculatedGrade = "3.5";
    else if (calculatedTotal >= 70) calculatedGrade = "3";
    else if (calculatedTotal >= 65) calculatedGrade = "2.5";
    else if (calculatedTotal >= 60) calculatedGrade = "2";
    else if (calculatedTotal >= 55) calculatedGrade = "1.5";
    else if (calculatedTotal >= 50) calculatedGrade = "1";
    else calculatedGrade = "0";
    // ------------------------------------

    const createRows = (scoresObj) => {
        if (!scoresObj) return "";
        return Object.entries(scoresObj).map(([key, value]) => {
            if (!key || value === "" || value === null) return "";

            let displayValue = value;
            let pillClass = "bg-slate-100 text-slate-600"; 

            if (value === "MISSING") {
                displayValue = "ยังไม่ส่ง";
                pillClass = "bg-red-50 text-red-600 border border-red-100";
            } else if (!isNaN(value)) {
                let numVal = parseFloat(value);
                
                // 1. สีเขียวเป็นค่าเริ่มต้น
                if (numVal >= 0) pillClass = "bg-emerald-50 text-emerald-600 border border-emerald-100";
                
                // 2. เช็คเงื่อนไขพิเศษ: สอบกลางภาค < 12 เป็นสีแดง
                if (key.includes("สอบกลางภาค")) {
                    if (numVal < EXAM_PASS_SCORE) {
                        pillClass = "bg-red-50 text-red-600 border border-red-100 font-bold";
                        displayValue = `${value} (ไม่ผ่าน)`;
                    }
                }
            }

            return `<tr class="hover:bg-slate-50 transition-colors">
                <td class="p-4 text-sm font-medium text-slate-700">${key}</td>
                <td class="p-4 text-center">
                    <span class="px-3 py-1 rounded-md text-xs font-bold ${pillClass}">${displayValue}</span>
                </td>
            </tr>`;
        }).join('');
    };

    document.getElementById("midtermTable").querySelector("tbody").innerHTML = createRows(studentData.midtermScores);
    document.getElementById("finalTable").querySelector("tbody").innerHTML = createRows(studentData.finalScores);

    animateCounter("total", calculatedTotal);
    document.getElementById("grade").innerText = calculatedGrade;

    document.getElementById("result").classList.remove("hidden");
    
    const cards = document.querySelectorAll('.card-base');
    cards.forEach((card, index) => {
        setTimeout(() => card.classList.add('show'), index * 150);
    });

    updateDashboard(studentData);
}

function updateDashboard(studentData) {
    const allMid = studentData.midtermScores || {};
    const allFinal = studentData.finalScores || {};
    const allWorks = { ...allMid, ...allFinal };
    
    let totalItems = 0;
    let submitted = 0;

    for (const [key, val] of Object.entries(allWorks)) {
        if (key && val !== "") {
            // ไม่นับช่องสอบเป็นชิ้นงาน
            if (key.includes("สอบกลางภาค") || key.includes("สอบปลายภาค")) continue;
            totalItems++;
            if (val !== "MISSING") submitted++;
        }
    }

    const percent = totalItems === 0 ? 0 : Math.round((submitted / totalItems) * 100);
    const worksHeader = document.querySelector("#dashboard h4");
    if(worksHeader) worksHeader.innerText = "ความคืบหน้าการส่งงาน";

    setTimeout(() => {
        document.getElementById('progressBar').style.width = percent + "%";
        document.getElementById('workStats').innerText = `ส่งงานแล้ว ${submitted} จากทั้งหมด ${totalItems} ชิ้น`;
        animateCounter("progressText", percent, "%"); 
    }, 500);
}

// --- ส่วนจัดการรหัสผ่าน ---
function openChangePassModal(force = false) { 
    document.getElementById('changePassBox').classList.remove('hidden');
    const cancelBtn = document.getElementById('btnCancelPass');
    if (cancelBtn) {
        // ถ้า force=true (บังคับเปลี่ยน) ให้ซ่อนปุ่มยกเลิก
        if (force) cancelBtn.classList.add('hidden');
        else cancelBtn.classList.remove('hidden');
    }
}

async function submitChangePassword() {
    const studentId = document.getElementById("displayStudentId").innerText;
    const newPass = document.getElementById("newPass").value;
    const confirmPass = document.getElementById("confirmPass").value;
    const selectedClass = document.getElementById("classSelect").value; 

    if (!newPass || !confirmPass) { Swal.fire('คำเตือน', 'กรุณากรอกรหัสผ่าน', 'warning'); return; }
    if (newPass !== confirmPass) { Swal.fire('ผิดพลาด', 'รหัสผ่านไม่ตรงกัน', 'error'); return; }

    Swal.fire({
        title: 'ยืนยันการเปลี่ยนรหัสผ่าน?', showCancelButton: true, confirmButtonText: 'ยืนยัน'
    }).then(async (result) => {
        if (result.isConfirmed) {
            document.getElementById("loadingOverlay").classList.remove("hidden");
            try {
                const res = await fetch(API_URL, {
                    method: "POST",
                    body: JSON.stringify({ action: "changePassword", studentId, newPassword: newPass, sheetName: selectedClass })
                });
                const response = await res.json();
                document.getElementById("loadingOverlay").classList.add("hidden");
                
                if (response.result === "success") {
                    document.getElementById('changePassBox').classList.add('hidden');
                    Swal.fire('สำเร็จ', response.message, 'success').then(() => {
                        document.getElementById("password").value = newPass; 
                        const cancelBtn = document.getElementById('btnCancelPass');
                        if (cancelBtn) cancelBtn.classList.remove('hidden');
                    });
                } else {
                    Swal.fire('ผิดพลาด', response.message, 'error');
                }
            } catch (error) {
                document.getElementById("loadingOverlay").classList.add("hidden");
                Swal.fire('Error', 'เชื่อมต่อไม่ได้', 'error');
            }
        }
    });
}

document.getElementById('themeToggle').addEventListener('click', () => { document.body.classList.toggle('bg-slate-900'); });
