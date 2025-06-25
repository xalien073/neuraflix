// app/movie/[movieId]/page.js
'use client';
import { useSearchParams, useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button, Spinner, Card } from 'react-bootstrap';

export default function MoviePage() {
  const { movieId } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const movieTitle = searchParams.get('movieTitle');
  const movieGenre = searchParams.get('movieGenre');
  const movieYear = searchParams.get('movieYear');
  const movieThumbnail = searchParams.get('movieThumbnail');

  const [edgesData, setEdgesData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchEdgesData = async () => {
    try {
      const res = await fetch(`/api/movie-edges?movieId=${movieId}`);
      const data = await res.json();
      setEdgesData(data);
    } catch (error) {
      console.error(error);
      alert('Error fetching movie data!');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchEdgesData();
  }, [movieId]);

  return (
    <div className="p-4">
      <Button variant="secondary" onClick={() => router.back()} className="mb-3">
        ← Back
      </Button>

      <h1 className="text-center">{movieTitle}</h1>
      <img
        src={movieThumbnail}
        alt={movieTitle}
        style={{
          width: '100%',
          maxHeight: '400px',
          objectFit: 'cover',
          borderRadius: '12px',
        }}
      />

      <Card className="mt-3 p-3">
        <h3>Details</h3>
        <p><strong>Genre:</strong> {movieGenre}</p>
        <p><strong>Year:</strong> {movieYear}</p>
      </Card>

      {loading && <div className="text-center mt-4"><Spinner animation="border" /></div>}

      {!loading && edgesData && (
        <div className="mt-4 space-y-4">
          
          <Card className="p-3">
            <h3>Directors</h3>
            <ul>{edgesData.directors?.map((d) => <li key={d}>{d}</li>)}</ul>
          </Card>

          <Card className="p-3">
            <h3>Actors</h3>
            <ul>{edgesData.actors?.map((a) => <li key={a}>{a}</li>)}</ul>
          </Card>

          <Card className="p-3">
            <h3>Reviews</h3>
            <ul>
              {edgesData.reviews?.map((r, i) => (
                <li key={i}>
                  <strong>{r.user}</strong>: {r.rating}/5 ({r.reviewDate})
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-3">
            <h3>Watched By</h3>
            <ul>{edgesData.watched?.map((w) => <li key={w}>{w}</li>)}</ul>
          </Card>
          
        </div>
      )}
    </div>
  );
}
