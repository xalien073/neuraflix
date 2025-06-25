'use client';

import { useEffect, useState } from 'react';
import { Modal, Button, Form, Card, Container, Row, Col } from 'react-bootstrap';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [rating, setRating] = useState(0);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [movies, setMovies] = useState([]);
  const [isClient, setIsClient] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState(null);

  useEffect(() => {
    setIsClient(true);
    const stored = localStorage.getItem('user');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.user) {
        setLoggedInUser(parsed.user);
        fetchRecommendations(parsed.user);
        return;
      }
    }
    fetchRecommendations();
  }, []);

  const handleLogin = () => {
    const user = username.trim().replace(/\s+/g, '_');
    localStorage.setItem('user', JSON.stringify({ user, password }));
    setLoggedInUser(user);
    setShowModal(false);
    fetchRecommendations(user);
  };
  
  const handleLogout = () => {
    localStorage.removeItem('user');
    setLoggedInUser(null);
  };
  
  const fetchRecommendations = async (user = '') => {
    try {
      const res = await fetch(`/api/recommend${user ? `?user=${user}` : ''}`);
      const data = await res.json();
      setMovies(data);
    } catch (err) {
      console.error('Failed to fetch recommendations:', err);
    }
  };
  
  const handleWatch = async (movieId, movieTitle, movieGenre, movieYear, movieThumbnail) => {
    if (!loggedInUser) {
      alert('Please login to Watch!');
      return;
    }
    try {
      const res = await fetch('/api/watched', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user: loggedInUser,
          movie: movieId
        })
      });
      if (res.ok) {
        alert(`Inserted an edge called Watched from ${loggedInUser} to ${movieId}`);
        fetchRecommendations(loggedInUser);
      } else {
        const err = await res.json();
        alert(`Failed to mark as watched: ${err.error}`);
      }
    } catch (err) {
      console.error('Error marking as watched:', err);
      alert(`Failed to mark as watched: ${err.error}`);
    } finally {
    // Append query parameters
    const query = new URLSearchParams({
      movieId,
      movieTitle,
      movieGenre,
      movieYear,
      movieThumbnail,
    }).toString();

    router.push(`/movies/${movieId}?${query}`);
    }
  };
  
  const openReviewModal = (movie) => {
    setSelectedMovie(movie);
    setRating(0);
    setShowReviewModal(true);
  };
  
  const handleReviewSubmit = async () => {
    if (!loggedInUser) {
      alert('Please login to review!');
      return;
    }
    try {
      const reviewDate = new Date().toISOString().split('T')[0];
      const res = await fetch('/api/review', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          user: loggedInUser,
          movie: selectedMovie.id,
          rating,
          reviewDate
        })
      });
      if (res.ok) {
        alert(`Review submitted for ${selectedMovie.id}!`);
        fetchRecommendations(loggedInUser);
      } else {
        const error = await res.json();
        alert(`Review failed: ${error.error}`);
      }
    } catch (error) {
      console.error(error);
      alert('Error submitting review');
    } finally {
      setShowReviewModal(false);
      
    }
  };
  
  if (!isClient) return null;

  return (
    <Container className="mt-4">
      <Row className="align-items-center mb-4">
        <Col>
          <h1 className="text-white">🎬 NeuraFlix</h1>
        </Col>
        <Col className="text-end">
          {loggedInUser ? (
            <>
              <span className="text-white me-3">Welcome, {loggedInUser}!</span>
              <Button variant="danger" onClick={handleLogout}>Logout</Button>
            </>
          ) : (
            <Button onClick={() => setShowModal(true)}>Login</Button>
          )}
        </Col>
      </Row>

      <Row xs={1} md={3} className="g-4">
        {movies.map((movie, index) => (
          <Col key={index}>
            <Card bg="dark" text="white" className="h-100">
              {movie.thumbnail && (
                <Card.Img
                  variant="top"
                  src={movie.thumbnail}
                  alt={`${movie.title} thumbnail`}
                  style={{ objectFit: 'cover', height: '300px' }}
                />
              )}
              <Card.Body>
                <Card.Title>{movie.title}</Card.Title>
                <Card.Text>{movie.genre}</Card.Text>
                <Card.Text><small>{movie.year}</small></Card.Text>
                <Button
                  variant="success"
                  className="mt-2 w-100"
                  onClick={() => handleWatch(movie.id, movie.title, movie.genre, movie.year, movie.thumbnail)}
                >
                  Watch
                </Button>
                {loggedInUser && (
                  <Button
                    variant="info"
                    className="mt-2 w-100"
                    onClick={() => openReviewModal(movie)}
                  >
                    Review
                  </Button>
                )}
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Login Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Login</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group>
              <Form.Label>Username</Form.Label>
              <Form.Control
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
              />
            </Form.Group>
            <Form.Group className="mt-3">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
              />
            </Form.Group>
            <Button className="mt-4 w-100" onClick={handleLogin}>
              Submit
            </Button>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Review Modal */}
      <Modal show={showReviewModal} onHide={() => setShowReviewModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Review: {selectedMovie?.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Rating (0–5)</Form.Label>
            <Form.Control
              type="number"
              min="0"
              max="5"
              value={rating}
              onChange={(e) => setRating(parseInt(e.target.value, 10))}
            />
          </Form.Group>
          <Button className="mt-3 w-100" onClick={handleReviewSubmit}>
            Submit Review
          </Button>
        </Modal.Body>
      </Modal>
    </Container>
  );
}

// 'use client';

// import { useEffect, useState } from 'react';
// import { Modal, Button, Form, Card, Container, Row, Col } from 'react-bootstrap';

// export default function Home() {
//   const [showModal, setShowModal] = useState(false);
//   const [username, setUsername] = useState('');
//   const [password, setPassword] = useState('');
//   const [movies, setMovies] = useState([]);
//   const [isClient, setIsClient] = useState(false);
//   const [loggedInUser, setLoggedInUser] = useState(null);

//   useEffect(() => {
//     setIsClient(true);
//     const stored = localStorage.getItem('user');
//     if (stored) {
//       const parsed = JSON.parse(stored);
//       if (parsed.user) {
//         setLoggedInUser(parsed.user);
//         fetchRecommendations(parsed.user);
//         return;
//       }
//     }
//     fetchRecommendations();
//   }, []);

//   const handleLogin = () => {
//     const user = username.trim().replace(/\s+/g, '_');
//     localStorage.setItem('user', JSON.stringify({ user, password }));
//     setLoggedInUser(user);
//     setShowModal(false);
//     fetchRecommendations(user);
//   };

//   const handleLogout = () => {
//     localStorage.removeItem('user');
//     setLoggedInUser(null);
//   };

//   const fetchRecommendations = async (user = '') => {
//     try {
//       const res = await fetch(`/api/recommend${user ? `?user=${user}` : ''}`);
//       const data = await res.json();
//       setMovies(data);
//     } catch (err) {
//       console.error('Failed to fetch recommendations:', err);
//     }
//   };

//   const handleWatch = async (movieId) => {
//     if (!loggedInUser) {
//       alert('Please login to Watch!');
//       return;
//     }
//     try {
//       const res = await fetch('/api/watched', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//           user: loggedInUser,
//           movie: movieId
//         })
//       });
//       if (res.ok) {
//         alert(`Marked as watched: ${movieId}`);
//         fetchRecommendations(loggedInUser);
//       } else {
//         const err = await res.json();
//         alert(`Failed to mark as watched: ${err.error}`);
//       }
//     } catch (err) {
//       console.error('Error marking as watched:', err);
//     }
//   };

//   if (!isClient) return null;

//   return (
//     <Container className="mt-4">
//       <Row className="align-items-center mb-4">
//         <Col>
//           <h1 className="text-white">🎬 NeuraFlix</h1>
//         </Col>
//         <Col className="text-end">
//           {loggedInUser ? (
//             <>
//               <span className="text-white me-3">Welcome, {loggedInUser}!</span>
//               <Button variant="danger" onClick={handleLogout}>Logout</Button>
//             </>
//           ) : (
//             <Button onClick={() => setShowModal(true)}>Login</Button>
//           )}
//         </Col>
//       </Row>

//       <Row xs={1} md={3} className="g-4">
//         {movies.map((movie, index) => (
//           <Col key={index}>
//             <Card bg="dark" text="white" className="h-100">
//               {movie.thumbnail && (
//                 <Card.Img
//                   variant="top"
//                   src={movie.thumbnail}
//                   alt={`${movie.title} thumbnail`}
//                   style={{ objectFit: 'cover', height: '300px' }}
//                 />
//               )}
//               <Card.Body>
//                 <Card.Title>{movie.title}</Card.Title>
//                 <Card.Text>{movie.genre}</Card.Text>
//                 <Card.Text><small>{movie.year}</small></Card.Text>
//                 <Button
//                   variant="success"
//                   className="mt-2 w-100"
//                   onClick={() => handleWatch(movie.id)}
//                 >
//                   Watch
//                 </Button>
//               </Card.Body>
//             </Card>
//           </Col>
//         ))}
//       </Row>

//       <Modal show={showModal} onHide={() => setShowModal(false)}>
//         <Modal.Header closeButton>
//           <Modal.Title>Login</Modal.Title>
//         </Modal.Header>
//         <Modal.Body>
//           <Form>
//             <Form.Group>
//               <Form.Label>Username</Form.Label>
//               <Form.Control
//                 onChange={(e) => setUsername(e.target.value)}
//                 placeholder="Enter username"
//               />
//             </Form.Group>
//             <Form.Group className="mt-3">
//               <Form.Label>Password</Form.Label>
//               <Form.Control
//                 type="password"
//                 onChange={(e) => setPassword(e.target.value)}
//                 placeholder="Enter password"
//               />
//             </Form.Group>
//             <Button className="mt-4 w-100" onClick={handleLogin}>
//               Submit
//             </Button>
//           </Form>
//         </Modal.Body>
//       </Modal>
//     </Container>
//   );
// }


// // // app/page.js
