/**
 * EduAssistAI — Database Migration Script
 * Safe, idempotent migration runner for MySQL.
 */

const path = require('path');
const fs = require('fs');

// Try loading dotenv from server directory
const serverEnvPath = path.join(__dirname, '..', 'server', '.env');
if (fs.existsSync(serverEnvPath)) {
  require(path.join(__dirname, '..', 'server', 'node_modules', 'dotenv')).config({ path: serverEnvPath });
}

// Load mysql2 from server node_modules
const mysql = require(path.join(__dirname, '..', 'server', 'node_modules', 'mysql2', 'promise'));

const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  multipleStatements: true,
};

const DB_NAME = process.env.DB_NAME || 'eduassist_db';

async function runMigration() {
  console.log('==================================================');
  console.log('EduAssistAI — MySQL Migration');
  console.log('==================================================');
  
  let connection;
  try {
    // 1. Connect to MySQL Server (without database selection first)
    connection = await mysql.createConnection(DB_CONFIG);
    console.log('Database connection successful.');

    // 2. Ensure Database Exists and Select It
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    await connection.changeUser({ database: DB_NAME });
    console.log(`Checking existing schema in ${DB_NAME}...`);

    const [existingTables] = await connection.query('SHOW TABLES;');
    const tableNames = existingTables.map(row => Object.values(row)[0]);
    if (tableNames.length > 0) {
      console.log(`Found ${tableNames.length} existing tables: ${tableNames.join(', ')}`);
    } else {
      console.log('No prior tables detected. Preparing fresh installation...');
    }

    // 3. Read and execute schema.sql
    console.log('Creating missing tables and verifying schema constraints...');
    const schemaPath = path.join(__dirname, 'schema.sql');
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found at: ${schemaPath}`);
    }

    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    await connection.query(schemaSql);

    // 4. Verify Tables and apply incremental schema extensions
    const [finalTables] = await connection.query('SHOW TABLES;');
    const finalNames = finalTables.map(row => Object.values(row)[0]);
    console.log('Updating required indexes and foreign key references...');

    // Phase 9 incremental extension: extend study_plan_tasks columns safely
    if (finalNames.includes('study_plan_tasks')) {
      await connection.query(`
        ALTER TABLE study_plan_tasks 
        MODIFY COLUMN priority ENUM('URGENT', 'HIGH', 'MEDIUM', 'LOW') DEFAULT 'MEDIUM'
      `);

      const [colCourse] = await connection.query(`
        SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'study_plan_tasks' AND COLUMN_NAME = 'course_code'
      `, [DB_NAME]);
      if (colCourse.length === 0) {
        await connection.query(`ALTER TABLE study_plan_tasks ADD COLUMN course_code VARCHAR(50) DEFAULT NULL AFTER title`);
        console.log('  ✓ Added course_code column to study_plan_tasks');
      }

      const [colMins] = await connection.query(`
        SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'study_plan_tasks' AND COLUMN_NAME = 'estimated_minutes'
      `, [DB_NAME]);
      if (colMins.length === 0) {
        await connection.query(`ALTER TABLE study_plan_tasks ADD COLUMN estimated_minutes INT DEFAULT 60 AFTER deadline`);
        console.log('  ✓ Added estimated_minutes column to study_plan_tasks');
      }
    }

    // Phase 10 incremental extension: career_path_skills reference table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS career_path_skills (
        id INT AUTO_INCREMENT PRIMARY KEY,
        career_path_id INT NOT NULL,
        skill_name VARCHAR(100) NOT NULL,
        required_level INT NOT NULL DEFAULT 3,
        importance ENUM('HIGH', 'MEDIUM', 'LOW') NOT NULL DEFAULT 'HIGH',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (career_path_id) REFERENCES career_paths(id) ON DELETE CASCADE,
        UNIQUE KEY uq_career_skill (career_path_id, skill_name),
        INDEX idx_cps_career (career_path_id),
        INDEX idx_cps_skill (skill_name)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    const [cpsRows] = await connection.query('SELECT COUNT(*) as count FROM career_path_skills');
    if (cpsRows[0].count === 0) {
      console.log('Populating default career_path_skills reference matrix...');
      await connection.query(`
        INSERT IGNORE INTO career_path_skills (career_path_id, skill_name, required_level, importance) VALUES
        (1, 'Core Programming (Java/Python)', 4, 'HIGH'),
        (1, 'Relational Databases (SQL)', 4, 'HIGH'),
        (1, 'Backend (Node.js/Express)', 4, 'HIGH'),
        (1, 'Frontend (React/CSS)', 3, 'MEDIUM'),
        (1, 'Git & Version Control', 4, 'HIGH'),
        (1, 'REST APIs & System Design', 3, 'HIGH'),
        (1, 'Cloud Deployment (AWS)', 2, 'MEDIUM'),
        (2, 'Relational Databases (SQL)', 4, 'HIGH'),
        (2, 'Python for Data Analysis', 4, 'HIGH'),
        (2, 'Business Intelligence (PowerBI/Tableau)', 3, 'HIGH'),
        (2, 'Excel & Data Cleaning', 4, 'MEDIUM'),
        (2, 'Statistics & Probability', 3, 'HIGH'),
        (3, 'Python & Machine Learning', 5, 'HIGH'),
        (3, 'Statistics & Linear Algebra', 4, 'HIGH'),
        (3, 'Relational Databases (SQL)', 4, 'HIGH'),
        (3, 'Deep Learning', 3, 'MEDIUM'),
        (3, 'Data Visualization', 3, 'MEDIUM'),
        (4, 'Figma & Prototyping', 5, 'HIGH'),
        (4, 'User Research & Testing', 4, 'HIGH'),
        (4, 'Design Systems & Wireframing', 4, 'HIGH'),
        (4, 'HTML/CSS Fundamentals', 3, 'MEDIUM'),
        (4, 'Accessibility (WCAG)', 3, 'MEDIUM'),
        (5, 'Network Security', 4, 'HIGH'),
        (5, 'Linux Administration', 4, 'HIGH'),
        (5, 'Penetration Testing & Ethical Hacking', 3, 'HIGH'),
        (5, 'Cryptography & Standards', 3, 'MEDIUM'),
        (5, 'Incident Response', 3, 'MEDIUM'),
        (6, 'Cloud Infrastructure (AWS/Azure)', 4, 'HIGH'),
        (6, 'Docker & Kubernetes', 4, 'HIGH'),
        (6, 'CI/CD Pipelines', 3, 'HIGH'),
        (6, 'Linux Administration', 4, 'HIGH'),
        (6, 'Infrastructure as Code (Terraform)', 3, 'MEDIUM'),
        (7, 'Relational Databases (SQL)', 5, 'HIGH'),
        (7, 'Query Optimization & Indexing', 5, 'HIGH'),
        (7, 'Database Replication & Clustering', 4, 'HIGH'),
        (7, 'Backup & Disaster Recovery', 4, 'HIGH'),
        (7, 'Linux Administration', 3, 'MEDIUM'),
        (8, 'Product Strategy & Roadmapping', 5, 'HIGH'),
        (8, 'Agile & Scrum Methodology', 4, 'HIGH'),
        (8, 'Data Analytics & A/B Testing', 3, 'HIGH'),
        (8, 'User Stories & Backlog Grooming', 4, 'HIGH'),
        (8, 'Stakeholder Communication', 4, 'HIGH');
      `);
      console.log('  ✓ Populated 40 reference career path skills across 8 career tracks.');
    }

    // Phase 11 incremental extension: submission_text in assignment_submissions
    const [colSubText] = await connection.query(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'assignment_submissions' AND COLUMN_NAME = 'submission_text'
    `, [DB_NAME]);
    if (colSubText.length === 0) {
      await connection.query(`ALTER TABLE assignment_submissions ADD COLUMN submission_text TEXT DEFAULT NULL AFTER submission_file`);
      console.log('  ✓ Added submission_text column to assignment_submissions');
    }

    const [refreshedTables] = await connection.query('SHOW TABLES;');
    const verifiedTableNames = refreshedTables.map(row => Object.values(row)[0]);

    console.log(`Schema verified with ${verifiedTableNames.length} active tables:`);
    verifiedTableNames.forEach(name => console.log(`  ✓ ${name}`));

    // 5. Optional Seeding if flag provided
    if (process.argv.includes('--seed')) {
      console.log('\nSeed flag detected (--seed). Applying seed data...');
      const seedPath = path.join(__dirname, 'seed.sql');
      if (fs.existsSync(seedPath)) {
        const seedSql = fs.readFileSync(seedPath, 'utf8');
        await connection.query(seedSql);
        console.log('✓ Seed data populated successfully.');
      } else {
        console.warn(`Warning: seed.sql not found at ${seedPath}`);
      }
    }

    console.log('==================================================');
    console.log('Migration completed successfully.');
    console.log('==================================================');
  } catch (error) {
    console.error('\n❌ Migration Failed:', error.message);
    process.exitCode = 1;
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed.');
    }
  }
}

runMigration();
