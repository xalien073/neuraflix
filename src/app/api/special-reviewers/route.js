// src/app/api/special-reviewers/route.js

import { client } from '@/lib/gremlin-client';

export async function GET(req) {
  try {
    await client.open();

    // 1. Get all 5-star reviews with genre and date
    const reviewQuery = `
      g.E().hasLabel('Reviewed').has('rating', 5)
        .project('user', 'movie', 'reviewDate', 'genre')
          .by(outV().values('id'))
          .by(inV().values('id'))
          .by(values('reviewDate'))
          .by(inV().values('genre'))
    `;
    const reviewResult = await client.submit(reviewQuery);
    const fiveStarReviews = reviewResult._items;

    // 2. Get all watched events
    const watchQuery = `
      g.E().hasLabel('Watched')
        .project('user', 'movie', 'watchDate', 'genre')
          .by(outV().values('id'))
          .by(inV().values('id'))
          .by(values('watchDate'))
          .by(inV().values('genre'))
    `;
    const watchResult = await client.submit(watchQuery);
    const watchEvents = watchResult._items;

    // 3. Filter: users who watched another movie of same genre within 7 days
    const matches = [];

    for (const review of fiveStarReviews) {
      const {
        user,
        movie: reviewedMovie,
        genre,
        reviewDate
      } = review;
      if (!user || !reviewedMovie || !genre || !reviewDate) continue;

      const reviewDateObj = new Date(reviewDate);
      const matchingWatch = watchEvents.find(watch => {
        if (
          watch.user !== user ||
          watch.movie === reviewedMovie || // must be different movie
          watch.genre !== genre
        ) return false;

        const watchDateObj = new Date(watch.watchDate);
        const diffDays = Math.abs((watchDateObj - reviewDateObj) / (1000 * 60 * 60 * 24));
        return diffDays <= 7;
      });

      if (matchingWatch) {
        matches.push({
          user,
          reviewedMovie,
          reviewDate,
          reviewedGenre: genre,
          watchedMovie: matchingWatch.movie,
          watchDate: matchingWatch.watchDate
        });
      }
    }
    console.log(matches);
    return new Response(JSON.stringify(matches), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error('Gremlin query error:', err);
    return new Response(JSON.stringify({ error: 'Failed to fetch special reviewers' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  } finally {
    await client.close();
  }
}
