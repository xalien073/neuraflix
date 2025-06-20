// src/app/api/top-coactors/route.js
import { client } from '@/lib/gremlin-client';

export async function GET(req) {
  try {
    await client.open();

    const actorsResult = await client.submit(`g.V().hasLabel("actor").values("name")`);
    const actorNames = actorsResult._items;

    console.log(`[INFO] Actor Names: ${JSON.stringify(actorNames)}`);

    const topCoActorsByActor = {};
    for (const actor of actorNames) {
      console.log(`[PROCESSING] Actor: ${actor}`);
      const coQuery = `
        g.V().has("actor", "name", "${actor}").as("a")
            .inE("ActedIn")                           // Get edges coming into this actor
            .outV().as("m")                           // Get movies
            .outE("ActedIn")                          // Get all acted_in edges from movies
            .inV().where(neq("a"))                    // Get other actors
            .values("name").groupCount()
      `;
      const coResult = await client.submit(coQuery);
      const counts = coResult._items[0] || {};
      console.log(`[CO-ACTORS for ${actor}]: ${JSON.stringify(counts)}`);

      const topCoActors = Object.entries(counts)
        .sort((a, b) => b[1] - a[1]) // sort by shared movie count
        .slice(0, 3)                // pick top 3
        .map(([name, sharedMovies]) => ({ name, sharedMovies }));

      topCoActorsByActor[actor] = topCoActors;
    }

    console.log(`[FINAL RESULTS]: ${JSON.stringify(topCoActorsByActor, null, 2)}`);

    return new Response(JSON.stringify(topCoActorsByActor), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[Gremlin Query Error]', err);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch top co-actors for all actors' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } finally {
    await client.close();
  }
}


