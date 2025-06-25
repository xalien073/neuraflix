// api/watched/route.js
import { client } from '@/lib/gremlin-client';

export async function POST(req) {
  try {
    const body = await req.json();
    const userId = body.user.replace(/\s+/g, '_');
    const movieId = body.movie.replace(/\s+/g, '_');
    const watchDate = new Date().toISOString().split('T')[0];
    console.log(`Watch Date: ${watchDate}`);

    await client.open();

    // STEP 1: Check if the edge already exists
    const edgeCheckQuery = `
      g.V().has('user','id','${userId}')
        .outE('Watched')
        .where(inV().has('id','${movieId}'))
    `;
    const edgeCheckResult = await client.submit(edgeCheckQuery);
    const existingEdges = edgeCheckResult?.toArray?.() || [];
    const edge = existingEdges?.[0];

    if (edge) {
      // Edge EXISTS -> Increment watchCount
      const currentWatchCount = edge?.properties?.watchCount?.[0]?.value || 1;

      const updateQuery = `
        g.E('${edge.id}')
          .property('watchCount', ${currentWatchCount + 1})
      `;
      await client.submit(updateQuery);
    } else {
      // Edge DOES NOT EXIST -> Create new edge
      const createQuery = `
        g.V().has('user','id','${userId}')
            .addE('Watched')
            .to(g.V().has('movie','id','${movieId}'))
            .property('watchDate','${watchDate}')
            .property('watchCount',1)
      `;
      await client.submit(createQuery);
    }

    return new Response(
      JSON.stringify({ message: 'Watched edge created or updated.' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Error creating or updating Watched edge:', err);
    return new Response(
      JSON.stringify({ error: 'Failed to mark as watched' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  } finally {
    await client.close();
  }
}


// // api/watched/route.js

// import { client } from '@/lib/gremlin-client';

// export async function POST(req) {
//   try {
//     const body = await req.json();
//     const userId = body.user.replace(/\s+/g, '_');
//     const movieId = body.movie.replace(/\s+/g, '_');
//     // const watchDate = new Date().toISOString();
//     const watchDate = new Date().toISOString().split('T')[0];
//     console.log(watchDate);


//     await client.open();

//     const query = `
//       g.V().has('user', 'id', '${userId}')
//         .addE('Watched')
//         .to(g.V().has('movie', 'id', '${movieId}'))
//         .property('watchDate', '${watchDate}')
//     `;

//     await client.submit(query);

//     return new Response(JSON.stringify({ message: 'Watched edge created' }), {
//       status: 200,
//       headers: { 'Content-Type': 'application/json' }
//     });
//   } catch (err) {
//     console.error('Error creating Watched edge:', err);
//     return new Response(JSON.stringify({ error: 'Failed to mark as watched' }), {
//       status: 500,
//       headers: { 'Content-Type': 'application/json' }
//     });
//   } finally {
//     await client.close();
//   }
// }
