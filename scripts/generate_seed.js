const fs = require('fs');
const path = require('path');

const deptCourses = {
  1: ['Data Structures & Algorithms', 'Database Systems', 'Computer Networks', 'Discrete Mathematics'],
  2: ['Machine Learning Foundations', 'Statistical Inference', 'Python for AI', 'Linear Algebra'],
  3: ['Signals & Systems', 'Digital Logic Design', 'Microprocessors', 'Circuit Theory'],
  4: ['Thermodynamics', 'Fluid Mechanics', 'Strength of Materials', 'Kinematics'],
  5: ['Financial Accounting', 'Management Information Systems', 'Business Analytics', 'Project Management']
};

const firstNames = ['Aarav','Ananya','Rohan','Priya','Kavya','Aditya','Sneha','Vikram','Neha','Rahul','Ishaan','Diya','Arjun','Meera','Tanvi','Siddharth','Pooja','Karan','Rhea','Naveen','Tara','Varun','Shreya','Manish','Divya','Harsh','Anushka','Kunal','Simran','Akash','Maya','Dev','Isha','Pranav','Ritu','Sameer','Nisha','Gaurav','Payal','Yash','Sonia','Abhishek','Swati','Tarun','Anjali','Karthik','Bhavna','Deepak','Preeti','Vivek'];
const lastNames = ['Sharma','Verma','Patel','Iyer','Reddy','Nair','Gupta','Singh','Chopra','Rao','Joshi','Mehta','Kulkarni','Deshmukh','Menon','Bose','Chatterjee','Pandey','Saxena','Pillai'];

const studentProfiles = [];
for (let i = 1; i <= 50; i++) {
  const fName = firstNames[(i - 1) % firstNames.length];
  const lName = lastNames[(i * 3) % lastNames.length];
  const deptId = ((i - 1) % 5) + 1;
  const year = ((i - 1) % 4) + 1;
  let category = i <= 15 ? 'normal' : i <= 25 ? 'declining' : i <= 33 ? 'recovering' : i <= 45 ? 'at_risk' : 'unclear';
  studentProfiles.push({ id: i, name: `${fName} ${lName}`, email: `${fName.toLowerCase()}.${lName.toLowerCase()}${i}@college.edu`, deptId, year, enrollmentDate: `202${4 - year + 1}-08-15`, category });
}

const startDate = new Date('2026-01-19');
const schoolDays = [];
for (let w = 0; w < 8; w++) for (let d = 0; d < 5; d++) {
  const cur = new Date(startDate);
  cur.setDate(startDate.getDate() + (w * 7) + d);
  schoolDays.push({ week: w + 1, day: d + 1, dateStr: cur.toISOString().split('T')[0] });
}

const sqlStr = (s) => `'${s.replace(/'/g, "''")}'`;

let sql = `-- SYNTHETIC SEED: 50 STUDENTS, ESS\n\nINSERT INTO departments (id, name, code) VALUES\n  (1,'Computer Science & Engineering','CSE'),\n  (2,'Data Science & Artificial Intelligence','DSAI'),\n  (3,'Electronics & Communication Engineering','ECE'),\n  (4,'Mechanical Engineering','MECH'),\n  (5,'Business Information Systems','BIS')\nON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, code = EXCLUDED.code;\n\nINSERT INTO students (id, name, email, department_id, year, enrollment_date) VALUES\n`;
sql += studentProfiles.map(s => `  (${s.id},${sqlStr(s.name)},${sqlStr(s.email)},${s.deptId},${s.year},'${s.enrollmentDate}')`).join(',\n') + '\nON CONFLICT (id) DO NOTHING;\n\n';

sql += 'INSERT INTO attendance (id, student_id, date, status, subject) VALUES\n';
let aId = 1; const aRows = [];
studentProfiles.forEach(s => {
  const courses = deptCourses[s.deptId];
  schoolDays.forEach(sd => {
    const subject = courses[(sd.day - 1) % courses.length];
    const rand = Math.random(); let status;
    if (s.category === 'normal') status = rand < 0.95 ? 'present' : rand < 0.98 ? 'late' : 'absent';
    else if (s.category === 'declining') { const p = 0.92 - ((sd.week-1)/7*0.55); status = rand < p ? 'present' : rand < p+0.15 ? 'late' : 'absent'; }
    else if (s.category === 'recovering') { const p = 0.45 + ((sd.week-1)/7*0.45); status = rand < p ? 'present' : rand < p+0.15 ? 'late' : 'absent'; }
    else if (s.category === 'at_risk') status = rand < 0.48 ? 'present' : rand < 0.65 ? 'late' : 'absent';
    else { const p = sd.week%2===1 ? 0.90 : 0.40; status = rand < p ? 'present' : rand < p+0.20 ? 'late' : 'absent'; }
    aRows.push(`  (${aId++},${s.id},'${sd.dateStr}','${status}',${sqlStr(subject)})`);
  });
});
sql += aRows.join(',\n') + '\nON CONFLICT (id) DO NOTHING;\n\n';

sql += 'INSERT INTO academic_records (id, student_id, course, score, date) VALUES\n';
let acId = 1; const acRows = [];
studentProfiles.forEach(s => {
  const courses = deptCourses[s.deptId];
  [2,4,6,8].forEach((w, wi) => {
    courses.forEach(c => {
      const n = (Math.random()*8)-4; let score;
      if (s.category === 'normal') score = 85+Math.random()*12;
      else if (s.category === 'declining') score = Math.max(38, 84-(wi*11)+n);
      else if (s.category === 'recovering') score = Math.min(88, 48+(wi*11)+n);
      else if (s.category === 'at_risk') score = 35+Math.random()*22;
      else score = c.includes('Data')||c.includes('Linear') ? 88+n : 46+n;
      const d = schoolDays.find(sd => sd.week===w && sd.day===5).dateStr;
      acRows.push(`  (${acId++},${s.id},${sqlStr(c)},${score.toFixed(2)},'${d}')`);
    });
  });
});
sql += acRows.join(',\n') + '\nON CONFLICT (id) DO NOTHING;\n\n';

sql += 'INSERT INTO engagement (id, student_id, lms_logins, assignments_submitted, time_on_task, date) VALUES\n';
let eId = 1; const eRows = [];
studentProfiles.forEach(s => {
  for (let w=1; w<=8; w++) {
    const d = schoolDays.find(sd => sd.week===w && sd.day===5).dateStr;
    let logins, assignments, time;
    if (s.category==='normal') { logins=Math.floor(9+Math.random()*6); assignments=3+(Math.random()>0.4?1:0); time=Math.floor(190+Math.random()*90); }
    else if (s.category==='declining') { const drop=(w-1)/7; logins=Math.max(1,Math.floor(12-drop*10)); assignments=Math.max(0,Math.floor(4-drop*3.5)); time=Math.max(25,Math.floor(220-drop*180)); }
    else if (s.category==='recovering') { const boost=(w-1)/7; logins=Math.min(13,Math.floor(3+boost*8)); assignments=Math.min(4,Math.floor(1+boost*3)); time=Math.min(240,Math.floor(45+boost*160)); }
    else if (s.category==='at_risk') { logins=Math.floor(1+Math.random()*2); assignments=Math.floor(Math.random()*2); time=Math.floor(20+Math.random()*40); }
    else { logins=w%2===0?11:2; assignments=w%2===0?4:1; time=w%2===0?210:35; }
    eRows.push(`  (${eId++},${s.id},${logins},${assignments},${time},'${d}')`);
  }
});
sql += eRows.join(',\n') + '\nON CONFLICT (id) DO NOTHING;\n\n';

sql += 'INSERT INTO risk_assessments (id, student_id, risk_score, tier, trajectory, created_at) VALUES\n';
let rId = 1; const rRows = [];
studentProfiles.forEach(s => {
  let score, tier, trajectory;
  if (s.category==='normal') { score=+(0.05+Math.random()*0.15).toFixed(2); tier='GREEN'; trajectory=Math.random()>0.5?'stable':'improving'; }
  else if (s.category==='declining') { score=+(0.62+Math.random()*0.22).toFixed(2); tier=score>0.75?'RED':'AMBER'; trajectory='deteriorating'; }
  else if (s.category==='recovering') { score=+(0.32+Math.random()*0.18).toFixed(2); tier=score>0.40?'AMBER':'GREEN'; trajectory='improving'; }
  else if (s.category==='at_risk') { score=+(0.78+Math.random()*0.21).toFixed(2); tier=score>0.88?'CRITICAL':'RED'; trajectory=Math.random()>0.4?'deteriorating':'stable'; }
  else { score=+(0.48+Math.random()*0.15).toFixed(2); tier='AMBER'; trajectory='stable'; }
  rRows.push(`  (${rId++},${s.id},${score},'${tier}','${trajectory}',NOW()-INTERVAL '${Math.floor(Math.random()*3)} days')`);
});
sql += rRows.join(',\n') + '\nON CONFLICT (id) DO NOTHING;\n';

fs.writeFileSync(path.join(__dirname,'..','supabase','seed.sql'), sql, 'utf8');
console.log('Seed SQL generated.');
