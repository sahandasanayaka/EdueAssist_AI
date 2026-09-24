const pool = require('./src/db/connection');

async function updateData() {
  try {
    // 1. Update Student profiles to Sri Lankan names
    await pool.query("UPDATE students SET full_name = 'Kaveen Senanayake', email = 'kaveen.s@univ.ac.lk' WHERE user_id = 4");
    await pool.query("UPDATE students SET full_name = 'Kavinda Fernando', email = 'kavinda.f@univ.ac.lk' WHERE user_id = 5");
    await pool.query("UPDATE students SET full_name = 'Nimal Bandara', email = 'nimal.b@univ.ac.lk' WHERE user_id = 6");
    await pool.query("UPDATE students SET full_name = 'Sanduni Jayawardena', email = 'sanduni.j@univ.ac.lk' WHERE user_id = 7");
    await pool.query("UPDATE students SET full_name = 'Kasun Wijesinghe', email = 'kasun.w@univ.ac.lk' WHERE user_id = 8");
    await pool.query("UPDATE students SET full_name = 'Dilani Alwis', email = 'dilani.a@univ.ac.lk' WHERE user_id = 9");

    // 2. Update Lecturers
    await pool.query("UPDATE lecturers SET full_name = 'Dr. Sanath Jayasuriya', email = 'sanath.j@univ.ac.lk', department = 'Computer Science & AI' WHERE user_id = 2");
    await pool.query("UPDATE lecturers SET full_name = 'Prof. Amanda Silva', email = 'amanda.s@univ.ac.lk', department = 'Software Engineering' WHERE user_id = 3");

    console.log('✅ MySQL database records updated with authentic Sri Lankan student & lecturer details!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error updating database:', err);
    process.exit(1);
  }
}

updateData();
