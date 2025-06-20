// src/app/api/recommend/route.js
import { client } from '@/lib/gremlin-client';

export async function GET(req) {
  try {
    await client.open();

    const { searchParams } = new URL(req.url);
    const user = searchParams.get('user');

    // 11. Get all movies
    const allResult = await client.submit(`g.V().hasLabel('movie').valueMap(true)`);
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

    // If no user, return all movies
    if (!user) {
      return new Response(JSON.stringify(allMovies), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 2️. Get watched movies by user
    const userWatchedQuery = `
      g.V().has('user', 'id', '${user}')
        .out('Watched')
        .id()
    `;
    const watchedResult = await client.submit(userWatchedQuery);
    const watchedIDs = new Set(watchedResult._items);

    // 3️. Get movies watched by user's friends
    const friendMoviesQuery = `
      g.V().has('user', 'id', '${user}')
        .out('Friends')
        .out('Watched')
        .dedup()
        .valueMap(true)
    `;
    const friendResult = await client.submit(friendMoviesQuery);
    const friendMovies = friendResult._items.map(item => {
      const obj = typeof item === 'object' && item !== null ? item : {};
      return {
        id: obj.id || null,
        title: Array.isArray(obj.title) ? obj.title[0] : null,
        genre: Array.isArray(obj.genre) ? obj.genre[0] : null,
        year: Array.isArray(obj.year) ? obj.year[0] : null,
        thumbnail: Array.isArray(obj.thumbnail) ? obj.thumbnail[0] : null,
      };
    });
    const recommendations = friendMovies.filter(m => !watchedIDs.has(m.id));

    // 4️. Trace content lineage:
    // Get movies directed by directors who worked with actors
    // of the user's recently watched movies
    const lineageQuery = `
      g.V().has('user','id','${user}')
        .out('Watched')
        .as('watchedMovie')
        .in('ActedIn')
        .out('ActedIn')
        .in('Directed')
        .dedup()
        .valueMap(true)
    `;
    const lineageResult = await client.submit(lineageQuery);
    const lineageRecommendations = lineageResult._items.map(item => {
      const obj = typeof item === 'object' && item !== null ? item : {};
      return {
        id: obj.id || null,
        title: Array.isArray(obj.title) ? obj.title[0] : null,
        genre: Array.isArray(obj.genre) ? obj.genre[0] : null,
        year: Array.isArray(obj.year) ? obj.year[0] : null,
        thumbnail: Array.isArray(obj.thumbnail) ? obj.thumbnail[0] : null,
      };
    });
    console.log('[LINEAGE RECOMMENDATION MOVIES]', lineageRecommendations);

    // 5️. Final merge:
    // Order: Lineage -> Friends' recommendations -> All Movies (without duplication)

    const finalList = [];
    const seenIDs = new Set();

    for (const movie of lineageRecommendations) {
      if (!watchedIDs.has(movie.id) && !seenIDs.has(movie.id)) {
        finalList.push(movie);
        seenIDs.add(movie.id);
      }
    }

    for (const movie of recommendations) {
      if (!watchedIDs.has(movie.id) && !seenIDs.has(movie.id)) {
        finalList.push(movie);
        seenIDs.add(movie.id);
      }
    }

    for (const movie of allMovies) {
      if (!seenIDs.has(movie.id)) {
        finalList.push(movie);
        seenIDs.add(movie.id);
      }
    }

    return new Response(JSON.stringify(finalList), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Gremlin query error:', err);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch recommendations' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } finally {
    await client.close();
  }
}


// // src/app/api/recommend/route.js

// import { client } from '@/lib/gremlin-client';

// export async function GET(req) {
//   try {
//     await client.open();

//     const { searchParams } = new URL(req.url);
//     const user = searchParams.get('user');

//     // Fetch all movies — this is the full catalog, no filtering here!
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

//     // If no user provided, return all movies
//     if (!user) {
//       return new Response(JSON.stringify(allMovies), {
//         status: 200,
//         headers: { 'Content-Type': 'application/json' },
//       });
//     }

//     // Get watched movies by the user (to filter from recommendations only)
//     const userWatchedQuery = `
//       g.V().has('user', 'id', '${user}')
//         .out('Watched')
//         .id()
//     `;
//     const watchedResult = await client.submit(userWatchedQuery);
//     const watchedIDs = new Set(watchedResult._items);

//     // Get movies watched by user's friends
//     const friendMoviesQuery = `
//       g.V().has('user', 'id', '${user}')
//         .out('Friends')
//         .out('Watched')
//         .dedup()
//         .valueMap(true)
//     `;
//     const friendResult = await client.submit(friendMoviesQuery);
//     const friendMovies = friendResult._items.map(item => {
//       const obj = typeof item === 'object' && item !== null ? item : {};
//       return {
//         id: obj.id || null,
//         title: Array.isArray(obj.title) ? obj.title[0] : null,
//         genre: Array.isArray(obj.genre) ? obj.genre[0] : null,
//         year: Array.isArray(obj.year) ? obj.year[0] : null,
//         thumbnail: Array.isArray(obj.thumbnail) ? obj.thumbnail[0] : null,
//       };
//     });

//     // Final recommendations: from friends' watched, excluding user's watched
//     const recommendations = friendMovies.filter(m => !watchedIDs.has(m.id));

//     // Output: recommended first, followed by rest of catalog
//     const recommendedIDs = new Set(recommendations.map(m => m.id));
//     const remainingMovies = allMovies.filter(m => !recommendedIDs.has(m.id));
//     console.log(recommendedIDs);
//     const finalList = [...recommendations, ...remainingMovies];

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

