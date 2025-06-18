// src/app/api/recommend/route.js

import { client } from '@/lib/gremlin-client';

export async function GET(req) {
  try {
    await client.open();

    const { searchParams } = new URL(req.url);
    const user = searchParams.get('user');

    const allMoviesQuery = `g.V().hasLabel('movie').valueMap(true)`;
    const allResult = await client.submit(allMoviesQuery);
    const allMovies = allResult._items.map(item => {
      const obj = typeof item === 'object' && item !== null ? item : {};
      return {
        id: obj.id || null,
        title: Array.isArray(obj.title) ? obj.title[0] : null,
        genre: Array.isArray(obj.genre) ? obj.genre[0] : null,
        year: Array.isArray(obj.year) ? obj.year[0] : null,
        thumbnail: Array.isArray(obj.thumbnail) ? obj.thumbnail[0] : null,
      };
    });

    // If no user provided, return all movies
    if (!user) {
      return new Response(JSON.stringify(allMovies), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Step 1: Get friend-based recommendations
    const recommendationQuery = `
      g.V().has('user', 'id', '${user}')
        .out('Friends')
        .out('Watched')
        .dedup()
        .valueMap(true)
    `;
    const recommendedResult = await client.submit(recommendationQuery);

    const recommendedMovies = recommendedResult._items.map(item => {
      const obj = typeof item === 'object' && item !== null ? item : {};
      return {
        id: obj.id || null,
        title: Array.isArray(obj.title) ? obj.title[0] : null,
        genre: Array.isArray(obj.genre) ? obj.genre[0] : null,
        year: Array.isArray(obj.year) ? obj.year[0] : null,
        thumbnail: Array.isArray(obj.thumbnail) ? obj.thumbnail[0] : null,
      };
    });

    const recommendedIDs = new Set(recommendedMovies.map(m => m.id));
    const remainingMovies = allMovies.filter(m => !recommendedIDs.has(m.id));
    const finalList = [...recommendedMovies, ...remainingMovies];

    return new Response(JSON.stringify(finalList), {
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


// // src/app/api/recommend/route.js
// import gremlin from 'gremlin';

// const endpoint = process.env.GREMLIN_ENDPOINT;
// const primaryKey = process.env.GREMLIN_PK;
// const database = 'AirTrafficDB';
// const collection = 'netflix';

// const authenticator = new gremlin.driver.auth.PlainTextSaslAuthenticator(
//   `/dbs/${database}/colls/${collection}`,
//   primaryKey
// );

// const client = new gremlin.driver.Client(endpoint, {
//   authenticator,
//   traversalsource: 'g',
//   rejectUnauthorized: true,
//   mimeType: 'application/vnd.gremlin-v2.0+json',
// });

// export async function GET(req) {
//   try {
//     await client.open();

//     const { searchParams } = new URL(req.url);
//     const user = searchParams.get('user');

//     // Step 1: Get recommended movie IDs via friends of user
//     const recommendationQuery = `
//       g.V().has('user', 'id', '${user}')
//         .out('Friends')
//         .out('Watched')
//         .dedup()
//         .valueMap(true)
//     `;
//     const recommendedResult = await client.submit(recommendationQuery);

//     const recommendedMovies = recommendedResult._items.map(item => {
//       const obj = typeof item === 'object' && item !== null ? item : {};
//       return {
//         id: obj.id || null,
//         title: Array.isArray(obj.title) ? obj.title[0] : null,
//         genre: Array.isArray(obj.genre) ? obj.genre[0] : null,
//         year: Array.isArray(obj.year) ? obj.year[0] : null,
//         thumbnail: Array.isArray(obj.thumbnail) ? obj.thumbnail[0] : null,
//       };
//     });

//     const recommendedIDs = new Set(recommendedMovies.map(m => m.id));

//     // Step 2: Get all movies
//     const allMoviesQuery = `g.V().hasLabel('movie').valueMap(true)`;
//     const allResult = await client.submit(allMoviesQuery);

//     const allMovies = allResult._items.map(item => {
//       const obj = typeof item === 'object' && item !== null ? item : {};
//       return {
//         id: obj.id || null,
//         title: Array.isArray(obj.title) ? obj.title[0] : null,
//         genre: Array.isArray(obj.genre) ? obj.genre[0] : null,
//         year: Array.isArray(obj.year) ? obj.year[0] : null,
//         thumbnail: Array.isArray(obj.thumbnail) ? obj.thumbnail[0] : null,
//       };
//     });

//     // Step 3: Merge: recommended first, rest later (excluding already added)
//     const remainingMovies = allMovies.filter(m => !recommendedIDs.has(m.id));
//     const finalList = [...recommendedMovies, ...remainingMovies];

//     return new Response(JSON.stringify(finalList), {
//       status: 200,
//       headers: { 'Content-Type': 'application/json' },
//     });
//   } catch (err) {
//     console.error('Gremlin query error:', err);
//     return new Response(JSON.stringify({ error: 'Failed to fetch recommendations' }), {
//       status: 500,
//       headers: { 'Content-Type': 'application/json' },
//     });
//   } finally {
//     await client.close();
//   }
// }

