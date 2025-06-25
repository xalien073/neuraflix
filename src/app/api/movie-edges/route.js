// api/movie-edges/route.js
import { NextResponse } from 'next/server';
import { client } from '@/lib/gremlin-client';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const movieId = searchParams.get('movieId');

  if (!movieId) {
    return NextResponse.json({ error: 'Missing movieId' }, { status: 400 });
  }

  try {
    await client.open();

    // Directors
    const directorQuery = `
      g.V().has('movie','id','${movieId}')
        .inE('Directed')
        .outV()
        .values('name')
    `;
    const directorResult = await client.submit(directorQuery);
    console.log('Director Result', directorResult._items);
    // Actors
    const actorQuery = `
    g.V().has('movie','id','${movieId}')           // 1. Find the specific movie
      .out('ActedIn')                              // 2. Traverse the 'ActedIn' edge to get connected actor vertices
      .values("name")                             // 3. Retrieve all their properties
    `;
    const actorResult = await client.submit(actorQuery);
    console.log('Actor Result', actorResult._items);
    // Reviews
    const reviewQuery = `
    g.V().has('movie','id','${movieId}')           // 1. Find the movie node
    .inE('Reviewed')                             // 2. Get all 'Reviewed' edges coming into it
    .project('user','rating','reviewDate')       // 3. Create an object with these three fields
    .by(outV().values('name'))                // user name
    .by(values('rating'))                     // rating
    .by(values('reviewDate'))                // review date
    `;
    const reviewResult = await client.submit(reviewQuery);
    console.log('Review Result', reviewResult._items);
    // Watched
    const watchedQuery = `
      g.V().has('movie','id','${movieId}')
        .inE('Watched')
        .outV()
        .values('name')
    `;
    const watchedResult = await client.submit(watchedQuery);
    console.log('Watched Result', watchedResult._items);
    return NextResponse.json({
      directors: directorResult._items,
      actors: actorResult._items,
      reviews: reviewResult._items,
      watched: watchedResult._items,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error fetching movie edges' }, { status: 500 });
  } finally {
    await client.close();
  }
}
