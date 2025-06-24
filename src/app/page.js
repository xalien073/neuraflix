'use client';

import { useEffect, useState } from 'react';
import { Modal, Button, Form, Card, Container, Row, Col } from 'react-bootstrap';

export default function Home() {
  const [showModal, setShowModal] = useState(false);
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

  const handleWatch = async (movieId) => {
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
        alert(`Marked as watched: ${movieId}`);
        fetchRecommendations(loggedInUser);
      } else {
        const err = await res.json();
        alert(`Failed to mark as watched: ${err.error}`);
      }
    } catch (err) {
      console.error('Error marking as watched:', err);
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
                  onClick={() => handleWatch(movie.id)}
                >
                  Watch
                </Button>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

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
    </Container>
  );
}


// // app/page.js
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
//     fetchRecommendations(); // fetch generic movies if not logged in
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
//     // setMovies([]);
//     // fetchRecommendations(); // fallback to default/generic movies
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

//   if (!isClient) return null;

//   return (
//     <Container className="mt-4">
//       {/* Header section with title and auth controls */}
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

//       {/* Movies display */}
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
//               </Card.Body>
//             </Card>
//           </Col>
//         ))}
//       </Row>

//       {/* Login Modal */}
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


