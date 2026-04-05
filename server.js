const express = require('express');
const { Client } = require('pg');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = 3000;
const connectionString = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_lCRm2rPF8fnO@ep-sparkling-boat-a14sogn2-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const pool = new Pool({ connectionString });

app.use(express.json());

app.get('/', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Server is healthy' });
});

app.get('/api/health', (req, res) => {
    res.status(200).json({ ok: true });
});

// API used by the React frontend in Docker mode.
app.get('/api/profiles', async (req, res) => {
    const client = new Client({ connectionString });
    const profileId = req.query.id;
    try {
        await client.connect();
        const result = profileId
            ? await client.query(
                'SELECT id, email, firstname, lastname, address, isactive, phone FROM account WHERE id = $1',
                [Number(profileId)]
            )
            : await client.query(
                'SELECT id, email, firstname, lastname, address, isactive, phone FROM account ORDER BY id DESC'
            );

        res.status(200).json({ profiles: result.rows });
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ message: err.message || 'Failed to load profiles', profiles: [] });
    } finally {
        await client.end();
    }
});

app.post('/api/profiles', async (req, res) => {
    const { email, firstname, lastname, address, isactive, phone } = req.body ?? {};
    const client = new Client({ connectionString });

    try {
        await client.connect();
        const result = await client.query(
            'INSERT INTO account (email, firstname, lastname, address, isactive, phone) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, email, firstname, lastname, address, isactive, phone',
            [email || '', firstname || '', lastname || '', address || '', Boolean(isactive), phone || '']
        );

        res.status(201).json({ profile: result.rows[0] });
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ message: err.message || 'Failed to create profile' });
    } finally {
        await client.end();
    }
});

app.put('/api/profiles/:id', async (req, res) => {
    const profileId = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(profileId)) {
        return res.status(400).json({ message: 'Invalid profile id' });
    }

    const { email, firstname, lastname, address, isactive, phone } = req.body ?? {};
    const client = new Client({ connectionString });

    try {
        await client.connect();
        const result = await client.query(
            'UPDATE account SET email = $1, firstname = $2, lastname = $3, address = $4, isactive = $5, phone = $6 WHERE id = $7 RETURNING id, email, firstname, lastname, address, isactive, phone',
            [email || '', firstname || '', lastname || '', address || '', Boolean(isactive), phone || '', profileId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Profile not found' });
        }

        res.status(200).json({ profile: result.rows[0] });
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ message: err.message || 'Failed to update profile' });
    } finally {
        await client.end();
    }
});

app.delete('/api/profiles/:id', async (req, res) => {
    const profileId = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(profileId)) {
        return res.status(400).json({ message: 'Invalid profile id' });
    }

    const client = new Client({ connectionString });
    try {
        await client.connect();
        //สำรองเผื่ออยาก delete ออกจาก database// const result = await client.query('DELETE FROM account WHERE id = $1 RETURNING id', [profileId]);
        const result = await client.query(
            'UPDATE account SET isactive = false WHERE id = $1 RETURNING id, email, firstname, lastname, address, isactive, phone',
            [profileId]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Profile not found' });
        }

        res.status(200).json({ profile: result.rows[0] });
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ message: err.message || 'Failed to delete profile' });
    } finally {
        await client.end();
    }
});

// GET all accounts // get : http://localhost:3000/accounts1
app.get('/accounts1', async (req, res) => {
    const client = new Client({ connectionString });
    try {
        await client.connect();
        const result = await client.query('SELECT * FROM account');
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ error: err.message });
    } finally {
        await client.end();
    }
});

// // GET account by ID // get : http://localhost:3000/accounts
app.get('/accounts', async (req, res) => {
    const a = 1
    console.log("1");
    
    const client = new Client({ connectionString });
    try {
        await client.connect();
        const result = await client.query('SELECT * FROM account WHERE id = $1', [req.query.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Account not found' });
        }
        res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ error: err.message });
    } finally {
        await client.end();
    }
});

// // CREATE new account // post : body -> raw
app.post('/accounts', async (req, res) => {
    const { firstname, lastname, email, address, isactive, phone } = req.body
    const client = new Client({ connectionString });

    console.log("กำลังบันทึกข้อมูลของ:", firstname);
    

    try {
        await client.connect();
        
        const result = await client.query(
            'INSERT INTO account (firstname, lastname, email, address, isactive, phone) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [firstname, lastname, email, address, isactive, phone] 
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        await client.end();
    }
});

// DELETE account // delete : http://localhost:3000/accounts
app.delete('/accounts', async (req, res) => {
    const client = new Client({ connectionString });
    try {
        await client.connect();
        const id = req.body.id;
        const result = await client.query('UPDATE account SET isactive = false WHERE id = $1 RETURNING *', [id]);
        // const result = await client.query('DELETE FROM account WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'ไม่พบ ID นี้ในระบบ' });
        }
        res.status(200).json({ message: 'Account deleted', data: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        await client.end();
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});