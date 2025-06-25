// app/api/review/route.js
import { client } from '@/lib/gremlin-client';

export async function POST(req) {
  try {
    const body = await req.json();
    const userId = body.user.replace(/\s+/g, '_');
    const movieId = body.movie.replace(/\s+/g, '_');
    const reviewDate = body.reviewDate;
    const rating = body.rating;
    console.log(userId, movieId, reviewDate, rating);

    await client.open();

    const query = `
      g.V().has('user', 'id', '${userId}')
        .addE('Reviewed')
        .to(g.V().has('movie', 'id', '${movieId}'))
        .property('rating', ${rating})
        .property('reviewDate', '${reviewDate}')
    `;

    await client.submit(query);

    return new Response(
      JSON.stringify({ message: 'Review edge created' }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (err) {
    console.error('Error creating Reviewed edge:', err);
    return new Response(
      JSON.stringify({ error: 'Failed to add review' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } finally {
    await client.close();
  }
}
