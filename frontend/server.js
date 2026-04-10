const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { neon } = require('@neondatabase/serverless');

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;
const defaultDatabaseUrl = 'postgresql://neondb_owner:npg_lCRm2rPF8fnO@ep-sparkling-boat-a14sogn2-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

app.use(cors());
app.use(express.json());

app.use((error, _request, response, next) => {
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return response.status(400).json({
      message: 'Invalid JSON payload',
    });
  }

  return next(error);
});

app.get('/', (_request, response) => {
  response.json({
    ok: true,
    message: 'API server is running',
    endpoints: ['/api/health', '/api/profiles'],
  });
});

app.get('/api/health', (_request, response) => {
  response.json({ ok: true });
});

app.get('/api/profiles', async (_request, response) => {
  const databaseUrl = process.env.DATABASE_URL || defaultDatabaseUrl;
  const profileId = _request.query.id;

  try {
    const sql = neon(databaseUrl);
    const profiles = profileId
      ? await sql`
          SELECT id, email, firstname, lastname, address, isactive, phone
          FROM account
          WHERE id = ${Number(profileId)}
        `
      : await sql`
          SELECT id, email, firstname, lastname, address, isactive, phone
          FROM account
          ORDER BY id DESC
        `;

    response.json({ profiles });
  } catch (error) {
    response.status(500).json({
      message: error.message || 'Failed to load profiles from Neon',
      profiles: [],
    });
  }
});

app.post('/api/profiles', async (request, response) => {
  const databaseUrl = process.env.DATABASE_URL || defaultDatabaseUrl;

  const { email, firstname, lastname, address, isactive, phone } = request.body ?? {};

  try {
    const sql = neon(databaseUrl);
    const [createdProfile] = await sql`
      INSERT INTO account (email, firstname, lastname, address, isactive, phone)
      VALUES (${email || ''}, ${firstname || ''}, ${lastname || ''}, ${address || ''}, ${Boolean(isactive)}, ${phone || ''})
      RETURNING id, email, firstname, lastname, address, isactive, phone
    `;

    response.status(201).json({ profile: createdProfile });
  } catch (error) {
    response.status(500).json({
      message: error.message || 'Failed to create profile in Neon',
    });
  }
});

app.put('/api/profiles/:id', async (request, response) => {
  const databaseUrl = process.env.DATABASE_URL || defaultDatabaseUrl;
  const profileId = Number.parseInt(request.params.id, 10);

  if (Number.isNaN(profileId)) {
    return response.status(400).json({
      message: 'Invalid profile id',
    });
  }

  const { email, firstname, lastname, address, isactive, phone } = request.body ?? {};

  try {
    const sql = neon(databaseUrl);
    const [updatedProfile] = await sql`
      UPDATE account
      SET email = ${email || ''},
          firstname = ${firstname || ''},
          lastname = ${lastname || ''},
          address = ${address || ''},
          isactive = ${Boolean(isactive)},
          phone = ${phone || ''}
      WHERE id = ${profileId}
      RETURNING id, email, firstname, lastname, address, isactive, phone
    `;

    if (!updatedProfile) {
      return response.status(404).json({
        message: 'Profile not found',
      });
    }

    response.json({ profile: updatedProfile });
  } catch (error) {
    response.status(500).json({
      message: error.message || 'Failed to update profile in Neon',
    });
  }
});

app.delete('/api/profiles/:id', async (request, response) => {
  const databaseUrl = process.env.DATABASE_URL || defaultDatabaseUrl;
  const profileId = Number.parseInt(request.params.id, 10);

  if (Number.isNaN(profileId)) {
    return response.status(400).json({
      message: 'Invalid profile id',
    });
  }

  try {
    const sql = neon(databaseUrl);
    const [inactivatedProfile] = await sql`
      UPDATE account
      SET isactive = false
      WHERE id = ${profileId}
      RETURNING id, email, firstname, lastname, address, isactive, phone
    `;

    if (!inactivatedProfile) {
      return response.status(404).json({
        message: 'Profile not found',
      });
    }

    response.json({ profile: inactivatedProfile });
  } catch (error) {
    response.status(500).json({
      message: error.message || 'Failed to set profile inactive in Neon',
    });
  }
});

app.use((error, _request, response, _next) => {
  console.error('Unhandled API error:', error);

  if (response.headersSent) {
    return;
  }

  response.status(error?.status || 500).json({
    message: error?.message || 'Internal server error',
  });
});

app.listen(port, () => {
  console.log(`API server listening on http://localhost:${port}`);
});