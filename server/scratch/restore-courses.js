const pool = require('../src/db/connection');

async function run() {
  await pool.query("UPDATE courses SET lecturer_id = 2 WHERE code IN ('CSC202S2', 'CSC203S2', 'CSC206S2')");
  console.log('Restored courses lecturer_id to 2 successfully!');
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
