// src/app/api/recommend/route.js
import { client } from "@/lib/gremlin-client";

export async function GET(req) {
  try {
    await client.open();
    const { searchParams } = new URL(req.url);
    const user = searchParams.get("user");

    // 1️⃣ All Movies
    const allResult = await client.submit(`g.V().hasLabel('movie').valueMap(true)`);
    const allMovies = allResult._items.map(parseItem);

    if (!user) {
      return jsonResponse(allMovies);
    }

    // 2️⃣ Watched Movies
    const watchedResult = await client.submit(
      `g.V().has('user','id','${user}').out('Watched').id()`
    );
    const watchedIDs = new Set(watchedResult._items);
    console.log('Watched movies', watchedIDs);
    // 3️⃣ Friends' Watched Movies
    const friendResult = await client.submit(
      `g.V().has('user','id','${user}')`
      + `.out('Friends')`
      + `.out('Watched')`
      + `.dedup().valueMap(true)`
    );
    const friendMovies = friendResult._items.map(parseItem);
    console.log("Friends' watched movies", friendMovies);
    const recommendations = friendMovies.filter((m) => !watchedIDs.has(m.id));
    console.log("Recommendations from friends' watched", recommendations);
    // ---- LINEAGE STARTS ----
    // A. Get the Actors from the Movies the User Watched
    const actorResult = await client.submit(
      `g.V().has('user','id','${user}')`
      + `.out('Watched')`
      + `.in('ActedIn')`
      + `.dedup().id()`
    );
    const actorIDs = actorResult._items;
    console.log('actorIDs', actorIDs);
    // B. Get All Movies Those Actors Acted In
    const moviesFromActorsResult = await client.submit(
      `g.V(${actorIDs.map((a) => `'${a}'`).join(',')}).out('ActedIn').dedup().id()`
    );
    const moviesFromActorsIDs = moviesFromActorsResult._items;
    console.log('moviesFromActorsIDs', moviesFromActorsIDs);
    // C. Get Directors of These Movies
    const directorResult = await client.submit(
      `g.V(${moviesFromActorsIDs.map((m) => `'${m}'`).join(',')}).in('Directed').dedup().id()`
    );
    const directorIDs = directorResult._items;
    console.log('directorIDs', directorIDs);
    // D. Get All Movies These Directors Directed
    const moviesByDirectorResult = await client.submit(
      `g.V(${directorIDs.map((d) => `'${d}'`).join(',')}).out('Directed').dedup().valueMap(true)`
    );
    const lineageRecommendations = moviesByDirectorResult._items.map(parseItem);
    console.log("[LINEAGE RECOMMENDATION MOVIES]", lineageRecommendations);
    // ---- LINEAGE ENDS ----

    // 4️⃣ Final List
    const finalList = [];
    const seenIDs = new Set();

    // a) Lineage movies first
    for (const movie of lineageRecommendations) {
      if (!watchedIDs.has(movie.id) && !seenIDs.has(movie.id)) {
        finalList.push(movie);
        seenIDs.add(movie.id);
      }
    }

    // b) Friends’ recommendations
    for (const movie of recommendations) {
      if (!watchedIDs.has(movie.id) && !seenIDs.has(movie.id)) {
        finalList.push(movie);
        seenIDs.add(movie.id);
      }
    }

    // c) All movies
    for (const movie of allMovies) {
      if (!seenIDs.has(movie.id)) {
        finalList.push(movie);
        seenIDs.add(movie.id);
      }
    }

    return jsonResponse(finalList);
  } catch (err) {
    console.error("Gremlin query error:", err);
    return jsonResponse({ error: "Failed to fetch recommendations" }, 500);
  } finally {
    await client.close();
  }
}

// ✅ Helpers
function parseItem(item) {
  const obj = item && typeof item === "object" ? item : {};
  return {
    id: obj.id || null,
    title: Array.isArray(obj.title) ? obj.title[0] : null,
    genre: Array.isArray(obj.genre) ? obj.genre[0] : null,
    year: Array.isArray(obj.year) ? obj.year[0] : null,
    thumbnail: Array.isArray(obj.thumbnail) ? obj.thumbnail[0] : null,
  };
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}


