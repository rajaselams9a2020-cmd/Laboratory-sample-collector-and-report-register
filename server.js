const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware (Idhu romba mukkiyam! JSON data vaanga idhu thevai)
app.use(express.json()); 
app.use(express.static(path.join(__dirname, 'lab-register')));

// 1. Database Connection (Routes-kku mela irukkanum)
const db = new sqlite3.Database('./database.db', (err) => {
    if (err) {
        console.error("❌ Database Connection Error:", err.message);
    } else {
        console.log('✅ Connected to the SQLite database.');
    }
});

// 2. Data-va frontend-ku anuppa API Route (With 'Days Waiting' calculation)
app.get('/api/samples', (req, res) => {
    db.all("SELECT * FROM samples", [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        // Days Waiting Calculate pandrom
        const today = new Date('2026-07-24'); 
        const processedRows = rows.map(row => {
            let daysWaiting = 0;
            if (row.status !== 'Reported' && row.status !== 'Lost') {
                const collected = new Date(row.collected_date);
                const diffTime = Math.abs(today - collected);
                daysWaiting = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
            }
            return { ...row, days_waiting: daysWaiting };
        });
        
        res.json(processedRows);
    });
});

// 3. ADD New Record (POST)
app.post('/api/samples', (req, res) => {
    const { sample_id, patient_name, test_type, collected_date, status, collected_by } = req.body;
    
    if (!sample_id || !patient_name || !test_type || !collected_date || !status) {
        return res.status(400).json({ error: "Missing required fields! ID, Name, Test, Date, and Status are mandatory." });
    }

    const sql = `INSERT INTO samples (sample_id, patient_name, test_type, collected_date, status, collected_by) VALUES (?, ?, ?, ?, ?, ?)`;
                 
    db.run(sql, [sample_id, patient_name, test_type, collected_date, status, collected_by], function(err) {
        if (err) return res.status(400).json({ error: "Could not save. Sample ID might already exist!" });
        res.json({ message: "Record added successfully" });
    });
});

// 4. UPDATE Existing Record (PUT)
app.put('/api/samples/:id', (req, res) => {
    const { patient_name, test_type, collected_date, status, collected_by } = req.body;
    const sample_id = req.params.id;

    if (!patient_name || !test_type || !collected_date || !status) {
        return res.status(400).json({ error: "Missing required fields for update!" });
    }

    const sql = `UPDATE samples SET patient_name=?, test_type=?, collected_date=?, status=?, processed_date=NULL, collected_by=? WHERE sample_id=?`;
    
    db.run(sql, [patient_name, test_type, collected_date, status, collected_by, sample_id], function(err) {
        if (err) return res.status(400).json({ error: "Update failed." });
        res.json({ message: "Record updated successfully" });
    });
});

// 5. Table Creation & Data Insertion
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS samples (
        sample_id TEXT PRIMARY KEY,
        patient_name TEXT,
        test_type TEXT,
        collected_date TEXT,
        status TEXT,
        processed_date TEXT,
        report_issued_date TEXT,
        collected_by TEXT
    )`, (err) => {
        if (err) console.error("❌ Error creating table:", err.message);
    });

    db.get("SELECT COUNT(*) AS count FROM samples", (err, row) => {
        if (err) return console.error("❌ Error checking table data:", err.message);

        if (row.count === 0) {
            const stmt = db.prepare("INSERT INTO samples VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
            
            const seedData = [
                ['S001', 'Arun Kumar', 'Blood Sugar', '2026-07-24', 'Pending', null, null, 'Tech A'],
                ['S002', 'Priya Singh', 'CBC', '2026-07-23', 'Processed', '2026-07-24', null, 'Tech B'],
                ['S003', 'Rahul Dravid', 'Lipid Profile', '2026-07-20', 'Reported', '2026-07-21', '2026-07-22', 'Tech A'],
                ['S004', 'Anita Roy', 'Thyroid', '2026-07-24', 'Pending', null, null, 'Tech C'],
                ['S005', 'Vikram Seth', 'Urine Routine', '2026-07-23', 'Processed', '2026-07-24', null, 'Tech A'],
                ['S006', 'Meera Bai', 'Liver Function', '2026-07-22', 'Reported', '2026-07-23', '2026-07-24', 'Tech B'],
                ['S007', 'Suresh Raina', 'Blood Sugar', '2026-07-24', 'Pending', null, null, 'Tech C'],
                ['S008', 'Karthik', 'CBC', '2026-07-21', 'Reported', '2026-07-22', '2026-07-23', 'Tech A'],
                ['S009', 'Lata M', 'Lipid Profile', '2026-07-24', 'Pending', null, null, 'Tech B'],
                ['S010', 'Dhoni MS', 'Thyroid', '2026-07-23', 'Processed', '2026-07-24', null, 'Tech C'],
                ['S011', 'Virat K', 'Urine Routine', '2026-07-24', 'Pending', null, null, 'Tech A'],
                ['S012', 'Rohit S', 'CBC', '2026-07-22', 'Reported', '2026-07-23', '2026-07-24', 'Tech B'],
                ['S013', 'Ashwin R', 'Blood Sugar', '2026-07-23', 'Processed', '2026-07-24', null, 'Tech C'],
                ['S014', 'Jadeja', 'Liver Function', '2026-07-24', 'Pending', null, null, 'Tech A'],
                ['S015', 'Bumrah', 'Lipid Profile', '2026-07-21', 'Reported', '2026-07-22', '2026-07-23', 'Tech B'],
                ['S016', '', 'Thyroid', '2026-07-24', 'Pending', null, null, 'Tech C'],
                ['S017', 'Arun Kumar', 'Urine Routine', '2026-07-24', 'Pending', null, null, 'Tech A'],
                ['S018', 'Old Man', 'Liver Function', '2022-01-15', 'Pending', null, null, 'Tech A'],
                ['S019', 'Ghost Patient', 'Unknown Test', '2026-07-24', 'Lost', null, null, 'Tech C'],
                ['S020', 'Null Test', 'CBC', '2026-07-24', 'Processed', null, null, 'Tech B']
            ];

            seedData.forEach(data => {
                stmt.run(data, (err) => {
                    if (err) console.error(`❌ Error inserting sample ${data[0]}:`, err.message);
                });
            });
            stmt.finalize();
            console.log("✅ Database seeded successfully with 20 records.");
        } else {
            console.log(`ℹ️ Records already exist (${row.count} rows). No new data added.`);
        }
    });
});

app.listen(PORT, (err) => {
    if (err) console.error("❌ Server failed to start:", err);
    else console.log(`✅ Server is running on http://localhost:${PORT}`);
});