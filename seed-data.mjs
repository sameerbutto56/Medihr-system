/**
 * Seed Script — Populates Firestore with dummy data for testing
 * Run: node seed-data.mjs
 */

import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, query, where } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCS0Z2cuO3kmd2BbUeGHwECPTRjMmZ5ccM",
  authDomain: "terteeb.firebaseapp.com",
  projectId: "terteeb",
  storageBucket: "terteeb.firebasestorage.app",
  messagingSenderId: "98850227972",
  appId: "1:98850227972:web:67f918a642361b9e95f251",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function seed() {
  console.log("🌱 Starting seed...");

  // 1. Get the first branch (should already exist)
  const branchSnap = await getDocs(collection(db, "branches"));
  if (branchSnap.empty) {
    console.log("❌ No branches found. Login to the app first so branches get auto-created.");
    process.exit(1);
  }
  const branchId = branchSnap.docs[0].id;
  const branchName = branchSnap.docs[0].data().name;
  console.log(`📍 Using branch: "${branchName}" (${branchId})`);

  // 2. Create Departments
  console.log("\n📂 Creating Departments...");
  const departments = [
    { name: "Physiotherapy", description: "Physical rehabilitation and movement therapy" },
    { name: "Occupational Therapy", description: "Daily living skills and recovery" },
    { name: "Speech Therapy", description: "Communication and swallowing disorders" },
    { name: "Nursing", description: "General patient care and monitoring" },
    { name: "Administration", description: "Office management and coordination" },
  ];

  const deptIds = {};
  for (const dept of departments) {
    const ref = await addDoc(collection(db, "departments"), { ...dept, branchId });
    deptIds[dept.name] = ref.id;
    console.log(`  ✅ ${dept.name} (${ref.id})`);
  }

  // 3. Create Employees
  console.log("\n👥 Creating Employees...");
  const employees = [
    { name: "Dr. Ahmed Khan", phone: "0300-1234567", cnic: "42101-1234567-1", department: "Physiotherapy", role: "Senior Physiotherapist", compensationType: "salary", salary: 180000, hrsPerDay: 8, daysPerWeek: 6, status: "active", joined: "2024-01-15", employeeId: "TRB-0001", isManager: true, managedDepartmentId: deptIds["Physiotherapy"] },
    { name: "Dr. Fatima Noor", phone: "0301-2345678", cnic: "42101-2345678-2", department: "Speech Therapy", role: "Speech Pathologist", compensationType: "salary", salary: 150000, hrsPerDay: 8, daysPerWeek: 5, status: "active", joined: "2024-03-01", employeeId: "TRB-0002", isManager: true, managedDepartmentId: deptIds["Speech Therapy"] },
    { name: "Nurse Ayesha Siddiq", phone: "0312-3456789", cnic: "42101-3456789-3", department: "Nursing", role: "Head Nurse", compensationType: "salary", salary: 90000, hrsPerDay: 8, daysPerWeek: 6, status: "active", joined: "2024-02-10", employeeId: "TRB-0003" },
    { name: "Ali Raza", phone: "0333-4567890", cnic: "42101-4567890-4", department: "Physiotherapy", role: "Junior Physiotherapist", compensationType: "salary", salary: 75000, hrsPerDay: 8, daysPerWeek: 6, status: "active", joined: "2024-06-01", employeeId: "TRB-0004" },
    { name: "Sana Malik", phone: "0334-5678901", cnic: "42101-5678901-5", department: "Occupational Therapy", role: "OT Specialist", compensationType: "salary", salary: 120000, hrsPerDay: 8, daysPerWeek: 5, status: "active", joined: "2024-04-15", employeeId: "TRB-0005" },
    { name: "Bilal Hassan", phone: "0345-6789012", cnic: "42101-6789012-6", department: "Administration", role: "Admin Coordinator", compensationType: "salary", salary: 60000, hrsPerDay: 8, daysPerWeek: 6, status: "active", joined: "2024-05-20", employeeId: "TRB-0006" },
    { name: "Zainab Iqbal", phone: "0321-7890123", cnic: "42101-7890123-7", department: "Nursing", role: "Staff Nurse", compensationType: "dailyRate", dailyRate: 3000, hrsPerDay: 8, daysPerWeek: 6, status: "active", joined: "2024-07-01", employeeId: "TRB-0007" },
    { name: "Usman Tariq", phone: "0315-8901234", cnic: "42101-8901234-8", department: "Physiotherapy", role: "Physiotherapy Aide", compensationType: "salary", salary: 50000, hrsPerDay: 8, daysPerWeek: 6, status: "active", joined: "2024-08-15", employeeId: "TRB-0008" },
    { name: "Dr. Hina Shah", phone: "0302-9012345", cnic: "42101-9012345-9", department: "Speech Therapy", role: "Junior Speech Therapist", compensationType: "salary", salary: 100000, hrsPerDay: 8, daysPerWeek: 5, status: "active", joined: "2024-09-01", employeeId: "TRB-0009" },
    { name: "Kashif Mehmood", phone: "0346-0123456", cnic: "42101-0123456-0", department: "Administration", role: "Receptionist", compensationType: "salary", salary: 45000, hrsPerDay: 8, daysPerWeek: 6, status: "inactive", joined: "2024-01-01", employeeId: "TRB-0010" },
  ];

  const empIds = {};
  for (const emp of employees) {
    const ref = await addDoc(collection(db, "employees"), { ...emp, branchId });
    empIds[emp.name] = ref.id;
    const tag = emp.isManager ? " 🏷️ MANAGER" : "";
    console.log(`  ✅ ${emp.name} — ${emp.role}${tag}`);
  }

  // 4. Assign team members to managers
  console.log("\n🔗 Assigning team members...");
  // Ali Raza & Usman Tariq → Dr. Ahmed Khan's team (Physio)
  const { updateDoc, doc } = await import("firebase/firestore");
  await updateDoc(doc(db, "employees", empIds["Ali Raza"]), { managerId: "ahmed-khan-uid" });
  await updateDoc(doc(db, "employees", empIds["Usman Tariq"]), { managerId: "ahmed-khan-uid" });
  console.log("  ✅ Ali Raza & Usman Tariq → Dr. Ahmed Khan's team");

  // Dr. Hina Shah → Dr. Fatima Noor's team (Speech)
  await updateDoc(doc(db, "employees", empIds["Dr. Hina Shah"]), { managerId: "fatima-noor-uid" });
  console.log("  ✅ Dr. Hina Shah → Dr. Fatima Noor's team");

  // 5. Create Tasks
  console.log("\n📋 Creating Tasks...");
  const tasks = [
    { title: "Weekly Patient Report", description: "Compile and submit weekly progress reports for all assigned patients.", assignedTo: "ahmed-khan-uid", assignedBy: "ahmed-khan-uid", dueDate: "2026-04-25", status: "pending" },
    { title: "Equipment Inventory Check", description: "Audit all therapy equipment in the physiotherapy wing and report damages.", assignedTo: "ahmed-khan-uid", assignedBy: "ahmed-khan-uid", dueDate: "2026-04-22", status: "completed" },
    { title: "Staff Training Session", description: "Prepare materials for the monthly training session on new therapy techniques.", assignedTo: "fatima-noor-uid", assignedBy: "fatima-noor-uid", dueDate: "2026-04-28", status: "pending" },
    { title: "Patient Discharge Summary", description: "Complete discharge summaries for patients leaving this week.", assignedTo: "ahmed-khan-uid", assignedBy: "ahmed-khan-uid", dueDate: "2026-04-23", status: "pending" },
    { title: "Update Treatment Plans", description: "Review and update treatment plans for all active speech therapy patients.", assignedTo: "fatima-noor-uid", assignedBy: "fatima-noor-uid", dueDate: "2026-04-30", status: "pending" },
  ];

  for (const task of tasks) {
    await addDoc(collection(db, "tasks"), { ...task, branchId, createdAt: new Date().toISOString() });
    console.log(`  ✅ "${task.title}" — ${task.status}`);
  }

  // 6. Create Patients
  console.log("\n🏥 Creating Patients...");
  const patients = [
    { name: "Muhammad Aslam", age: 65, gender: "Male", phone: "0300-1111111", patientId: "PAT-0001", condition: "Stroke Rehabilitation", status: "active", registeredAt: "2026-04-01" },
    { name: "Saima Bibi", age: 45, gender: "Female", phone: "0301-2222222", patientId: "PAT-0002", condition: "Post-Surgery Recovery", status: "active", registeredAt: "2026-04-05" },
    { name: "Hamza Ali", age: 12, gender: "Male", phone: "0312-3333333", patientId: "PAT-0003", condition: "Speech Delay", status: "active", registeredAt: "2026-04-10" },
    { name: "Khadija Noor", age: 30, gender: "Female", phone: "0333-4444444", patientId: "PAT-0004", condition: "Chronic Back Pain", status: "active", registeredAt: "2026-04-12" },
    { name: "Imran Hussain", age: 55, gender: "Male", phone: "0345-5555555", patientId: "PAT-0005", condition: "Spinal Cord Injury", status: "discharged", registeredAt: "2026-03-15" },
  ];

  for (const p of patients) {
    await addDoc(collection(db, "patients"), { ...p, branchId });
    console.log(`  ✅ ${p.name} — ${p.condition}`);
  }

  // 7. Create Attendance records (last 7 days)
  console.log("\n📅 Creating Attendance Records...");
  const today = new Date();
  let attCount = 0;
  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const d = new Date(today);
    d.setDate(d.getDate() - dayOffset);
    const dateStr = d.toISOString().split("T")[0];
    
    // Skip weekends
    if (d.getDay() === 0) continue; // Sunday

    for (const [name, id] of Object.entries(empIds)) {
      if (name === "Kashif Mehmood") continue; // inactive
      const statuses = ["present", "present", "present", "present", "late", "absent"];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      await addDoc(collection(db, "attendance"), {
        employeeId: id,
        branchId,
        date: dateStr,
        checkIn: status !== "absent" ? `0${8 + Math.floor(Math.random() * 2)}:${String(Math.floor(Math.random() * 60)).padStart(2, "0")}` : null,
        checkOut: status !== "absent" ? `${16 + Math.floor(Math.random() * 2)}:${String(Math.floor(Math.random() * 60)).padStart(2, "0")}` : null,
        status,
      });
      attCount++;
    }
  }
  console.log(`  ✅ Created ${attCount} attendance records`);

  // 8. Create Payroll records
  console.log("\n💰 Creating Payroll Records...");
  const months = ["2026-01", "2026-02", "2026-03"];
  let payCount = 0;
  for (const month of months) {
    for (const [name, id] of Object.entries(empIds)) {
      const emp = employees.find(e => e.name === name);
      if (!emp || emp.status === "inactive") continue;
      const base = emp.salary || (emp.dailyRate ? emp.dailyRate * 26 : 50000);
      const deductions = Math.round(base * 0.05);
      const net = base - deductions;
      await addDoc(collection(db, "payroll"), {
        employeeId: id,
        employeeName: name,
        branchId,
        month,
        base,
        deductions,
        net,
        status: month === "2026-03" ? "pending" : "paid",
      });
      payCount++;
    }
  }
  console.log(`  ✅ Created ${payCount} payroll records`);

  // 9. Create Appointments
  console.log("\n📆 Creating Appointments...");
  const appointments = [
    { patientName: "Muhammad Aslam", therapist: "Dr. Ahmed Khan", date: "2026-04-22", time: "10:00", type: "Physiotherapy", status: "scheduled", notes: "Follow-up session for stroke rehab" },
    { patientName: "Saima Bibi", therapist: "Dr. Ahmed Khan", date: "2026-04-22", time: "11:30", type: "Physiotherapy", status: "scheduled", notes: "Post-surgery mobility assessment" },
    { patientName: "Hamza Ali", therapist: "Dr. Fatima Noor", date: "2026-04-23", time: "09:00", type: "Speech Therapy", status: "scheduled", notes: "Speech delay evaluation" },
    { patientName: "Khadija Noor", therapist: "Sana Malik", date: "2026-04-23", time: "14:00", type: "Occupational Therapy", status: "scheduled", notes: "Ergonomic and posture correction" },
    { patientName: "Muhammad Aslam", therapist: "Dr. Ahmed Khan", date: "2026-04-21", time: "10:00", type: "Physiotherapy", status: "completed", notes: "Good progress observed" },
  ];

  for (const appt of appointments) {
    await addDoc(collection(db, "appointments"), { ...appt, branchId });
    console.log(`  ✅ ${appt.patientName} → ${appt.therapist} (${appt.date})`);
  }

  console.log("\n🎉 Seed complete! Refresh your browser to see the data.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
