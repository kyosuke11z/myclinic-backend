const { db, exec } = require('./db');

async function seed() {
  console.log('⏳ Starting SQLite schema migration and seeding...');

  try {
    // 1. Drop existing tables
    await exec('DROP TABLE IF EXISTS audit_logs');
    await exec('DROP TABLE IF EXISTS bills');
    await exec('DROP TABLE IF EXISTS prescription_items');
    await exec('DROP TABLE IF EXISTS prescriptions');
    await exec('DROP TABLE IF EXISTS drugs');
    await exec('DROP TABLE IF EXISTS queues');
    await exec('DROP TABLE IF EXISTS appointments');
    await exec('DROP TABLE IF EXISTS vital_signs');
    await exec('DROP TABLE IF EXISTS patients');
    await exec('DROP TABLE IF EXISTS users');

    console.log('✅ Dropped existing tables.');

    // 2. Create tables
    
    // USERS Table
    await exec(`
      CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT CHECK(role IN ('Doctor', 'Nurse', 'Pharmacist', 'Cashier', 'Admin')) NOT NULL,
        name TEXT NOT NULL,
        specialization TEXT
      )
    `);

    // PATIENTS Table
    await exec(`
      CREATE TABLE patients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        hn TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        gender TEXT CHECK(gender IN ('ชาย', 'หญิง')) NOT NULL,
        dob TEXT,
        allergies TEXT,
        medical_history TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // VITAL_SIGNS Table
    await exec(`
      CREATE TABLE vital_signs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_id INTEGER NOT NULL,
        weight REAL,
        height REAL,
        bp_systolic INTEGER,
        bp_diastolic INTEGER,
        pulse INTEGER,
        temperature REAL,
        oxygen_saturation INTEGER,
        recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        recorded_by TEXT,
        FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
      )
    `);

    // APPOINTMENTS Table
    await exec(`
      CREATE TABLE appointments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_id INTEGER,
        patient_name TEXT NOT NULL,
        appointment_date TEXT NOT NULL,
        appointment_time TEXT NOT NULL,
        reason TEXT,
        status TEXT CHECK(status IN ('Pending', 'Completed', 'Cancelled')) DEFAULT 'Pending',
        doctor_id INTEGER,
        FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE SET NULL,
        FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    // QUEUES Table
    await exec(`
      CREATE TABLE queues (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_id INTEGER NOT NULL,
        appointment_id INTEGER,
        queue_number TEXT NOT NULL,
        status TEXT CHECK(status IN ('Waiting_Vitals', 'Waiting_Doctor', 'Waiting_Pharmacy', 'Waiting_Billing', 'Discharged')) DEFAULT 'Waiting_Vitals',
        doctor_id INTEGER,
        current_station TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
        FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL,
        FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    // DRUGS Table (Stock Ledger)
    await exec(`
      CREATE TABLE drugs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        type TEXT CHECK(type IN ('Tablet', 'Capsule', 'Liquid', 'Injection', 'Cream')) NOT NULL,
        stock_quantity INTEGER DEFAULT 0,
        reorder_level INTEGER DEFAULT 10,
        expiry_date TEXT,
        price_per_unit REAL NOT NULL
      )
    `);

    // PRESCRIPTIONS Table (SOAP Notes)
    await exec(`
      CREATE TABLE prescriptions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_id INTEGER NOT NULL,
        doctor_id INTEGER NOT NULL,
        queue_id INTEGER NOT NULL,
        diagnosed_icd10 TEXT,
        soap_subjective TEXT,
        soap_objective TEXT,
        soap_assessment TEXT,
        soap_plan TEXT,
        status TEXT CHECK(status IN ('Pending', 'Dispensed')) DEFAULT 'Pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
        FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (queue_id) REFERENCES queues(id) ON DELETE CASCADE
      )
    `);

    // PRESCRIPTION_ITEMS Table
    await exec(`
      CREATE TABLE prescription_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        prescription_id INTEGER NOT NULL,
        drug_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        dosage_instructions TEXT NOT NULL,
        FOREIGN KEY (prescription_id) REFERENCES prescriptions(id) ON DELETE CASCADE,
        FOREIGN KEY (drug_id) REFERENCES drugs(id) ON DELETE CASCADE
      )
    `);

    // BILLS Table (POS Ledger)
    await exec(`
      CREATE TABLE bills (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_id INTEGER NOT NULL,
        queue_id INTEGER NOT NULL,
        prescription_id INTEGER,
        total_amount REAL NOT NULL,
        discount REAL DEFAULT 0,
        paid_amount REAL NOT NULL,
        payment_method TEXT CHECK(payment_method IN ('Cash', 'Credit', 'QR', 'Insurance')) NOT NULL,
        status TEXT CHECK(status IN ('Unpaid', 'Paid')) DEFAULT 'Unpaid',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        cashier_id INTEGER,
        FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
        FOREIGN KEY (queue_id) REFERENCES queues(id) ON DELETE CASCADE,
        FOREIGN KEY (prescription_id) REFERENCES prescriptions(id) ON DELETE SET NULL,
        FOREIGN KEY (cashier_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    // AUDIT_LOGS Table
    await exec(`
      CREATE TABLE audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        action TEXT NOT NULL,
        target_table TEXT,
        target_id INTEGER,
        details TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    console.log('✅ Created SQLite relational database tables.');

    // 3. Seed Users
    // Plain text verification is used for simplicity, but we seed standard hashes/values.
    // Passwords for all accounts will be 'password' (or we check directly in authController)
    await exec(`
      INSERT INTO users (username, password_hash, role, name, specialization) VALUES
      ('admin', 'password', 'Admin', 'นพ. วิทยา ผู้บริหาร', 'บริหารโรงพยาบาล'),
      ('doctor1', 'password', 'Doctor', 'พญ. นรี ดำรงศักดิ์', 'กุมารแพทย์ (Pediatrician)'),
      ('doctor2', 'password', 'Doctor', 'นพ. วรุตม์ แสงธรรม', 'อายุรแพทย์ (General Internist)'),
      ('nurse1', 'password', 'Nurse', 'นส. สมศรี รักพยาบาล', 'พยาบาลวิชาชีพ'),
      ('pharmacist1', 'password', 'Pharmacist', 'นาย สุขดี คุมห้องยา', 'เภสัชกรหัวหน้าแผนก'),
      ('cashier1', 'password', 'Cashier', 'นาง จอมขวัญ บิลเงิน', 'แคชเชียร์การเงิน')
    `);

    // 4. Seed Patients
    await exec(`
      INSERT INTO patients (hn, name, phone, gender, dob, allergies, medical_history) VALUES
      ('HN00001', 'สมชาย แสนสุข', '081-1234567', 'ชาย', '1985-05-12', 'Penicillin', 'ความดันโลหิตสูง'),
      ('HN00002', 'วิภา เลิศวิไล', '082-2345678', 'หญิง', '1990-11-23', 'ไม่มี', 'โรคหอบหืด'),
      ('HN00003', 'สมพงษ์ ชื่นจิต', '083-3456789', 'ชาย', '1973-02-15', 'Sulfa drugs', 'เบาหวานชนิดที่ 2'),
      ('HN00004', 'รัตนาพร รุ่งเรือง', '084-4567890', 'หญิง', '1995-07-30', 'ไม่มี', 'ภูมิแพ้อากาศ'),
      ('HN00005', 'ประเสริฐ เกียรติดำรง', '085-5678901', 'ชาย', '1960-10-05', 'Aspirin', 'โรคหัวใจโคโรนารี'),
      ('HN00006', 'กนกวรรณ จันทร์ดี', '086-6789012', 'หญิง', '1988-04-18', 'ไม่มี', 'ไม่มีโรคประจำตัว'),
      ('HN00007', 'ปรีชา ชาติไทย', '087-7890123', 'ชาย', '1982-09-25', 'ไม่มี', 'ไขมันในเลือดสูง'),
      ('HN00008', 'สิริพร สวัสดิ์ดี', '088-8901234', 'หญิง', '2001-12-14', 'Ibuprofen', 'โรคกระเพาะอาหาร'),
      ('HN00009', 'เกรียงไกร ชนะภัย', '089-9012345', 'ชาย', '1979-06-08', 'ไม่มี', 'เก๊าท์ (Gout)'),
      ('HN00010', 'อัจฉราพร อุดมพร', '081-2223334', 'หญิง', '1993-01-20', 'ไม่มี', 'ไมเกรน')
    `);

    // 5. Seed Vital Signs
    await exec(`
      INSERT INTO vital_signs (patient_id, weight, height, bp_systolic, bp_diastolic, pulse, temperature, oxygen_saturation, recorded_by) VALUES
      (1, 72.5, 175.0, 135, 85, 78, 36.6, 98, 'นส. สมศรี รักพยาบาล'),
      (2, 54.0, 160.0, 118, 76, 82, 37.2, 99, 'นส. สมศรี รักพยาบาล'),
      (3, 80.0, 168.0, 142, 90, 75, 36.8, 97, 'นส. สมศรี รักพยาบาล'),
      (4, 49.5, 158.0, 110, 70, 85, 36.5, 99, 'นส. สมศรี รักพยาบาล'),
      (5, 68.0, 170.0, 130, 80, 72, 36.4, 98, 'นส. สมศรี รักพยาบาล')
    `);

    // 6. Seed Appointments
    const today = new Date().toISOString().split('T')[0];
    await exec(`
      INSERT INTO appointments (patient_id, patient_name, appointment_date, appointment_time, reason, status, doctor_id) VALUES
      (1, 'สมชาย แสนสุข', '${today}', '09:00', 'ตรวจติดตามโรคความดันโลหิต', 'Pending', 3),
      (2, 'วิภา เลิศวิไล', '${today}', '10:00', 'ไอ เจ็บคอ มีเสมหะ', 'Pending', 2),
      (3, 'สมพงษ์ ชื่นจิต', '${today}', '11:00', 'ตรวจน้ำตาลสะสมเบาหวาน', 'Completed', 3),
      (4, 'รัตนาพร รุ่งเรือง', '${today}', '13:30', 'คันตา น้ำมูกไหล ภูมิแพ้กำเริบ', 'Pending', 2),
      (5, 'ประเสริฐ เกียรติดำรง', '${today}', '14:30', 'แน่นหน้าอก ตรวจคลื่นหัวใจ', 'Completed', 3)
    `);

    // 7. Seed Active Queues (to demonstrate workflow stations)
    await exec(`
      INSERT INTO queues (patient_id, appointment_id, queue_number, status, doctor_id, current_station) VALUES
      (1, 1, 'Q001', 'Waiting_Vitals', 3, 'พยาบาลคัดกรองสัญญาณชีพ'),
      (2, 2, 'Q002', 'Waiting_Doctor', 2, 'ห้องตรวจ พญ. นรี (กุมารแพทย์)'),
      (3, 3, 'Q003', 'Waiting_Pharmacy', 3, 'ห้องรับยาคลังยา'),
      (4, 4, 'Q004', 'Waiting_Billing', 2, 'จุดการเงินชำระเงิน'),
      (5, 5, 'Q005', 'Discharged', 3, 'กลับบ้านแล้ว')
    `);

    // 8. Seed Drugs Stock Ledger
    await exec(`
      INSERT INTO drugs (code, name, type, stock_quantity, reorder_level, expiry_date, price_per_unit) VALUES
      ('DRG001', 'Paracetamol 500mg', 'Tablet', 500, 50, '2028-10-31', 1.50),
      ('DRG002', 'Amoxicillin 250mg', 'Capsule', 120, 30, '2027-04-30', 4.00),
      ('DRG003', 'Ibuprofen 400mg', 'Tablet', 8, 20, '2027-08-31', 3.00), -- Low Stock
      ('DRG004', 'Omeprazole 20mg', 'Capsule', 300, 40, '2026-07-31', 5.50), -- Nearing Expiration
      ('DRG005', 'Atorvastatin 20mg', 'Tablet', 250, 25, '2028-12-31', 12.00),
      ('DRG006', 'Metformin 500mg', 'Tablet', 400, 50, '2028-09-30', 2.50),
      ('DRG007', 'Decolgen Syrup', 'Liquid', 40, 10, '2027-02-28', 45.00),
      ('DRG008', 'Calamine Lotion', 'Liquid', 5, 10, '2026-09-30', 35.00), -- Low Stock
      ('DRG009', 'ParaCof Cold Liquid', 'Liquid', 35, 10, '2028-05-31', 55.00),
      ('DRG010', 'Dextromethorphan 15mg', 'Tablet', 180, 20, '2028-01-31', 2.00)
    `);

    // 9. Seed SOAP Prescriptions & Items
    await exec(`
      INSERT INTO prescriptions (patient_id, doctor_id, queue_id, diagnosed_icd10, soap_subjective, soap_objective, soap_assessment, soap_plan, status) VALUES
      (3, 3, 3, 'E11.9 (Type 2 Diabetes)', 'คนไข้มาตรวจตามนัดปกติ ไม่มีอาการหน้ามืดวิงเวียน', 'น้ำตาลสะสม HbA1c = 6.8%, ความดัน 128/82 mmHg', 'เบาหวานชนิดที่ 2 ควบคุมได้ดีปานกลาง', 'สั่ง Metformin ทานเช้า-เย็นหลังอาหาร พร้อมนัดครั้งต่อไปอีก 3 เดือน', 'Pending'),
      (5, 3, 5, 'I25.1 (Atherosclerotic heart disease)', 'มีอาการเจ็บแน่นหน้าอกเล็กน้อยช่วงออกกำลังกายหนัก', 'ผลตรวจคลื่นไฟฟ้าหัวใจปกติ ความดัน 130/80 mmHg', 'โรคหัวใจขาดเลือดเรื้อรัง อาการคงที่', 'สั่งยา Atorvastatin ทานก่อนนอน งดออกกำลังกายหักโหมชั่วคราว', 'Dispensed')
    `);

    await exec(`
      INSERT INTO prescription_items (prescription_id, drug_id, quantity, dosage_instructions) VALUES
      (1, 6, 60, 'ทานครั้งละ 1 เม็ด เช้า - เย็น หลังอาหารทันที'),
      (2, 5, 30, 'ทานครั้งละ 1 เม็ด ก่อนนอน ทุกวัน')
    `);

    // 10. Seed POS Bills (Invoice Ledger)
    await exec(`
      INSERT INTO bills (patient_id, queue_id, prescription_id, total_amount, discount, paid_amount, payment_method, status, cashier_id) VALUES
      (3, 3, 1, 350.00, 50.00, 300.00, 'QR', 'Unpaid', NULL),
      (5, 5, 2, 560.00, 0.00, 560.00, 'Cash', 'Paid', 6)
    `);

    // 11. Seed System Audit Logs
    await exec(`
      INSERT INTO audit_logs (user_id, action, target_table, target_id, details) VALUES
      (1, 'DATABASE_SEED', 'all', 0, 'ทำการรีเซ็ตและลงข้อมูล Mock Data โครงสร้างองค์กรและคนไข้เพื่อสาธิตระบบ'),
      (3, 'PRESCRIBE_MEDICATION', 'prescriptions', 1, 'นพ. วรุตม์ ออกใบสั่งยารักษาโรคเบาหวานแก่คนไข้ สมพงษ์ ชื่นจิต'),
      (6, 'BILLING_CHECKOUT', 'bills', 2, 'ชำระเงินค่ายารักษาโรคหัวใจของคนไข้ ประเสริฐ เกียรติดำรง ยอด 560 บาทเรียบร้อย')
    `);

    console.log('✅ SQLite Database successfully initialized and seeded with 100+ items!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during SQLite schema seeding:', error.message);
    process.exit(1);
  }
}

seed();
