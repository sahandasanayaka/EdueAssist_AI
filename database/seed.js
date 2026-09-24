/**
 * EduAssistAI — Database Seeder Script
 * Populates realistic university academic, coursework, career, and AI data.
 */

const path = require('path');
const fs = require('fs');

const serverEnvPath = path.join(__dirname, '..', 'server', '.env');
if (fs.existsSync(serverEnvPath)) {
  require(path.join(__dirname, '..', 'server', 'node_modules', 'dotenv')).config({ path: serverEnvPath });
}

const mysql = require(path.join(__dirname, '..', 'server', 'node_modules', 'mysql2', 'promise'));

const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'eduassist_db',
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  multipleStatements: true,
};

async function runSeed() {
  console.log('==================================================');
  console.log('EduAssistAI — Database Seeder');
  console.log('==================================================');

  let connection;
  try {
    connection = await mysql.createConnection(DB_CONFIG);
    console.log(`Connected to database "${DB_CONFIG.database}".`);

    const seedPath = path.join(__dirname, 'seed.sql');
    if (!fs.existsSync(seedPath)) {
      throw new Error(`Seed file not found at: ${seedPath}`);
    }

    console.log('Reading and executing seed dataset...');
    const seedSql = fs.readFileSync(seedPath, 'utf8');
    await connection.query(seedSql);

    console.log('Verifying inserted table records:');
    const tables = [
      'users', 'students', 'lecturers', 'courses', 'enrollments',
      'attendance_summary', 'exam_results', 'assignments',
      'assignment_submissions', 'career_paths', 'career_path_skills', 'student_skills',
      'career_goals', 'course_materials', 'study_plan_tasks', 'ai_chat_history'
    ];

    for (const table of tables) {
      const [rows] = await connection.query(`SELECT COUNT(*) as count FROM \`${table}\`;`);
      console.log(`  ✓ ${table.padEnd(25)} : ${rows[0].count} records`);
    }

    console.log('==================================================');
    console.log('Seed completed successfully.');
    console.log('==================================================');
  } catch (error) {
    console.error('\n❌ Seed Failed:', error.message);
    process.exitCode = 1;
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed.');
    }
  }
}

runSeed();
