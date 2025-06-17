// src/app/api/recommend/route.js
import gremlin from 'gremlin';

const endpoint = process.env.GREMLIN_ENDPOINT;
const primaryKey = process.env.GREMLIN_PK;
const database = 'AirTrafficDB';
const collection = 'netflix';

const authenticator = new gremlin.driver.auth.PlainTextSaslAuthenticator(
  `/dbs/${database}/colls/${collection}`,
  primaryKey
);

const client = new gremlin.driver.Client(endpoint, {
  authenticator,
  traversalsource: 'g',
  rejectUnauthorized: true,
  mimeType: 'application/vnd.gremlin-v2.0+json',
});

export async function GET(req) {
  try {
    await client.open();

    const { searchParams } = new URL(req.url);
    const user = searchParams.get('user') || 'Neha_Singh';

    const query = `
      g.V().has('user', 'id', '${user}')
        .out('Friends')
        .out('Watched')
        .dedup()
        .valueMap(true)
    `;

    const result = await client.submit(query);

    const data = result._items.map((item) => {
      const obj = typeof item === 'object' && item !== null ? item : {};
      return {
        id: obj.id || null,
        title: Array.isArray(obj.title) ? obj.title[0] : null,
        genre: Array.isArray(obj.genre) ? obj.genre[0] : null,
        year: Array.isArray(obj.year) ? obj.year[0] : null,
      };
    });

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Gremlin query error:', err);
    return new Response(JSON.stringify({ error: 'Failed to fetch recommendations' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  } finally {
    await client.close();
  }
}

