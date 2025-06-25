'use client';

import { useState } from 'react';
import {
  Button, Modal, Form, Container, Row, Col, Spinner, Table,
} from 'react-bootstrap';
import axios from 'axios';

export default function AdminPanel() {
  const [showMovieModal, setShowMovieModal] = useState(false);
  const [movieData, setMovieData] = useState({ title: '', genre: '', year: '', directors: '', actors: '' });
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [log, setLog] = useState('');

  const [specialReviewers, setSpecialReviewers] = useState([]);
  const [loadingReviewers, setLoadingReviewers] = useState(false);

  const [coactors, setCoactors] = useState({});
  const [loadingCoactors, setLoadingCoactors] = useState(false);

  const handleMovieSubmit = async () => {
    setLoading(true);
    setLog('Uploading thumbnail and inserting movie...');
    try {
      const formData = new FormData();
      formData.append('file', thumbnailFile);
      formData.append('title', movieData.title);
      formData.append('genre', movieData.genre);
      formData.append('year', movieData.year);
      formData.append('directors', movieData.directors);
      formData.append('actors', movieData.actors);

      const res = await axios.post('/api/insertMovie', formData);
      setLog(res.data?.message || 'Movie inserted successfully!');
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.message || err.message;
      setLog(`Error: ${errMsg}`);
    } finally {
      setLoading(false);
    }
  };
  
  const handleModalOpen = () => {
    setShowMovieModal(true);
    setLog('');
    setMovieData({ title: '', genre: '', year: '', directors: '', actors: '' });
    setThumbnailFile(null);
  };
  
  const fetchSpecialReviewers = async () => {
    setLoadingReviewers(true);
    try {
      const res = await axios.get('/api/special-reviewers');
      setSpecialReviewers(res.data || []);
    } catch (err) {
      console.error(err);
      setSpecialReviewers([]);
    } finally {
      setLoadingReviewers(false);
    }
  };
  
  const fetchCoactors = async () => {
    setLoadingCoactors(true);
    try {
      const res = await axios.get('/api/top-coactors');
      setCoactors(res.data || {});
    } catch (err) {
      console.error(err);
      setCoactors({});
    } finally {
      setLoadingCoactors(false);
    }
  };
  
  return (
    <Container className="mt-4">
      <h2>🎬 NeuraFlix Admin Panel</h2>

      <Row className="mt-4 mb-2">
        <Col xs={12} md={4}>
          <Button variant="dark" onClick={handleModalOpen} className="w-100">
            Insert Movie
          </Button>
        </Col>
        <Col xs={12} md={4}>
          <Button variant="info" onClick={fetchSpecialReviewers} className="w-100">
            {loadingReviewers ? <Spinner animation="border" size="sm" /> : '⭐ Show Special Reviewers'}
          </Button>
        </Col>
        <Col xs={12} md={4}>
          <Button variant="warning" onClick={fetchCoactors} className="w-100">
            {loadingCoactors ? <Spinner animation="border" size="sm" /> : '👥 Show Top Co-Actors'}
          </Button>
        </Col>
      </Row>

      {/* Movie Insertion Modal */}
      <Modal show={showMovieModal} onHide={() => setShowMovieModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Insert New Movie</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-2">
              <Form.Label>Title</Form.Label>
              <Form.Control
                type="text"
                value={movieData.title}
                onChange={(e) => setMovieData({ ...movieData, title: e.target.value })}
                placeholder="e.g. Chava"
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Genre</Form.Label>
              <Form.Control
                type="text"
                value={movieData.genre}
                onChange={(e) => setMovieData({ ...movieData, genre: e.target.value })}
                placeholder="e.g. Historical Drama"
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Year</Form.Label>
              <Form.Control
                type="number"
                value={movieData.year}
                onChange={(e) => setMovieData({ ...movieData, year: e.target.value })}
                placeholder="e.g. 2025"
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Directors (comma separated)</Form.Label>
              <Form.Control
                type="text"
                value={movieData.directors}
                onChange={(e) => setMovieData({ ...movieData, directors: e.target.value })}
                placeholder="e.g. Christopher Nolan, Steven Spielberg"
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Actors (comma separated)</Form.Label>
              <Form.Control
                type="text"
                value={movieData.actors}
                onChange={(e) => setMovieData({ ...movieData, actors: e.target.value })}
                placeholder="e.g. Leonardo DiCaprio, Joseph Gordon-Levitt"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Thumbnail</Form.Label>
              <Form.Control
                type="file"
                accept="image/*"
                onChange={(e) => setThumbnailFile(e.target.files[0])}
              />
            </Form.Group>
          </Form>

          <div className="mt-3">
            <Button
              variant="success"
              className="w-100"
              disabled={
                loading ||
                !movieData.title.trim() ||
                !movieData.genre.trim() ||
                !movieData.year.trim() ||
                !thumbnailFile
              }
              onClick={handleMovieSubmit}
            >
              {loading ? <Spinner animation="border" size="sm" /> : 'Insert Movie'}
            </Button>
          </div>

          {log && (
            <div className="mt-3">
              <hr />
              <pre className="bg-light p-2 text-wrap">{log}</pre>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowMovieModal(false)}>Close</Button>
        </Modal.Footer>
      </Modal>

      {/* Special Reviewers Table */}
      {specialReviewers.length > 0 && (
        <div className="mt-5">
          <h4>Users who reviewed & watched genre-related movies within 7 days</h4>
          <Table striped bordered hover responsive className="mt-3">
            <thead>
              <tr>
                <th>User</th>
                <th>Reviewed Movie</th>
                <th>Review Date</th>
                <th>Watched Movie</th>
                <th>Watch Date</th>
                <th>Genre</th>
              </tr>
            </thead>
            <tbody>
              {specialReviewers.map((entry, idx) => (
                <tr key={idx}>
                  <td>{entry.user}</td>
                  <td>{entry.reviewedMovie}</td>
                  <td>{entry.reviewDate}</td>
                  <td>{entry.watchedMovie}</td>
                  <td>{entry.watchDate}</td>
                  <td>{entry.reviewedGenre}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}

      {/* Co-Actors Table */}
      {Object.keys(coactors).length > 0 && (
        <div className="mt-5">
          <h4>Top 3 Co-Actors Per Actor</h4>
          <Table striped bordered hover responsive className="mt-3">
            <thead>
              <tr>
                <th>Actor</th>
                <th>Co-Actor</th>
                <th>Shared Movies</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(coactors).map(([actor, entries]) =>
                entries.map((entry, idx) => (
                  <tr key={`${actor}_${idx}`} >
                    <td>{actor}</td>
                    <td>{entry.name}</td>
                    <td>{entry.sharedMovies}</td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </div>
      )}
    </Container>
  );
}


// // app/admin/page.js
// 'use client';

// import { useState } from 'react';
// import {
//   Button, Modal, Form, Container, Row, Col, Spinner, Table,
// } from 'react-bootstrap';
// import axios from 'axios';

// export default function AdminPanel() {
//   const [showMovieModal, setShowMovieModal] = useState(false);
//   const [movieData, setMovieData] = useState({ title: '', genre: '', year: '' });
//   const [thumbnailFile, setThumbnailFile] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [log, setLog] = useState('');

//   const [specialReviewers, setSpecialReviewers] = useState([]);
//   const [loadingReviewers, setLoadingReviewers] = useState(false);

//   const [coactors, setCoactors] = useState({});
//   const [loadingCoactors, setLoadingCoactors] = useState(false);

//   const handleMovieSubmit = async () => {
//     setLoading(true);
//     setLog('Uploading thumbnail and inserting vertex...');
//     try {
//       const formData = new FormData();
//       formData.append('file', thumbnailFile);
//       formData.append('title', movieData.title);
//       formData.append('genre', movieData.genre);
//       formData.append('year', movieData.year);

//       const res = await axios.post('/api/insertMovie', formData);
//       setLog(res.data?.message || 'Movie inserted successfully!');
//     } catch (err) {
//       console.error(err);
//       const errMsg = err.response?.data?.message || err.message;
//       setLog(`❌ Error: ${errMsg}`);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleModalOpen = () => {
//     setShowMovieModal(true);
//     setLog('');
//     setMovieData({ title: '', genre: '', year: '' });
//     setThumbnailFile(null);
//   };

//   const fetchSpecialReviewers = async () => {
//     setLoadingReviewers(true);
//     try {
//       const res = await axios.get('/api/special-reviewers');
//       setSpecialReviewers(res.data || []);
//     } catch (err) {
//       console.error(err);
//       setSpecialReviewers([]);
//     } finally {
//       setLoadingReviewers(false);
//     }
//   };
  
//   const fetchCoactors = async () => {
//     setLoadingCoactors(true);
//     try {
//       const res = await axios.get('/api/top-coactors');
//       setCoactors(res.data || {});
//     } catch (err) {
//       console.error(err);
//       setCoactors({});
//     } finally {
//       setLoadingCoactors(false);
//     }
//   };
  
//   return (
//     <Container className="mt-4">
//       <h2>🎬 NeuraFlix Admin Panel</h2>

//       <Row className="mt-4 mb-2">
//         <Col xs={12} md={4}>
//           <Button variant="dark" onClick={handleModalOpen} className="w-100">
//             Insert Movie
//           </Button>
//         </Col>
//         <Col xs={12} md={4}>
//           <Button variant="info" onClick={fetchSpecialReviewers} className="w-100">
//             {loadingReviewers ? <Spinner animation="border" size="sm" /> : '⭐ Show Special Reviewers'}
//           </Button>
//         </Col>
//         <Col xs={12} md={4}>
//           <Button variant="warning" onClick={fetchCoactors} className="w-100">
//             {loadingCoactors ? <Spinner animation="border" size="sm" /> : '👥 Show Top Co-Actors'}
//           </Button>
//         </Col>
//       </Row>

//       {/* Movie Insertion Modal */}
//       <Modal show={showMovieModal} onHide={() => setShowMovieModal(false)}>
//         <Modal.Header closeButton>
//           <Modal.Title>Insert New Movie</Modal.Title>
//         </Modal.Header>
//         <Modal.Body>
//           <Form>
//             <Form.Group className="mb-2">
//               <Form.Label>Title</Form.Label>
//               <Form.Control
//                 type="text"
//                 value={movieData.title}
//                 onChange={(e) => setMovieData({ ...movieData, title: e.target.value })}
//                 placeholder="e.g. Chava"
//               />
//             </Form.Group>
//             <Form.Group className="mb-2">
//               <Form.Label>Genre</Form.Label>
//               <Form.Control
//                 type="text"
//                 value={movieData.genre}
//                 onChange={(e) => setMovieData({ ...movieData, genre: e.target.value })}
//                 placeholder="e.g. Historical Drama"
//               />
//             </Form.Group>
//             <Form.Group className="mb-2">
//               <Form.Label>Year</Form.Label>
//               <Form.Control
//                 type="number"
//                 value={movieData.year}
//                 onChange={(e) => setMovieData({ ...movieData, year: e.target.value })}
//                 placeholder="e.g. 2025"
//               />
//             </Form.Group>
//             <Form.Group className="mb-3">
//               <Form.Label>Thumbnail</Form.Label>
//               <Form.Control
//                 type="file"
//                 accept="image/*"
//                 onChange={(e) => setThumbnailFile(e.target.files[0])}
//               />
//             </Form.Group>
//           </Form>

//           <div className="mt-3">
//             <Button
//               variant="success"
//               className="w-100"
//               disabled={
//                 loading ||
//                 !movieData.title.trim() ||
//                 !movieData.genre.trim() ||
//                 !movieData.year.trim() ||
//                 !thumbnailFile
//               }
//               onClick={handleMovieSubmit}
//             >
//               {loading ? <Spinner animation="border" size="sm" /> : '🎥 Insert Movie'}
//             </Button>
//           </div>

//           {log && (
//             <div className="mt-3">
//               <hr />
//               <pre className="bg-light p-2 text-wrap">{log}</pre>
//             </div>
//           )}
//         </Modal.Body>
//         <Modal.Footer>
//           <Button variant="secondary" onClick={() => setShowMovieModal(false)}>Close</Button>
//         </Modal.Footer>
//       </Modal>

//       {/* Special Reviewers Table */}
//       {specialReviewers.length > 0 && (
//         <div className="mt-5">
//           <h4>⭐ Users who reviewed & watched genre-related movies within 7 days</h4>
//           <Table striped bordered hover responsive className="mt-3">
//             <thead>
//               <tr>
//                 <th>User</th>
//                 <th>Reviewed Movie</th>
//                 <th>Review Date</th>
//                 <th>Watched Movie</th>
//                 <th>Watch Date</th>
//                 <th>Genre</th>
//               </tr>
//             </thead>
//             <tbody>
//               {specialReviewers.map((entry, idx) => (
//                 <tr key={idx}>
//                   <td>{entry.user}</td>
//                   <td>{entry.reviewedMovie}</td>
//                   <td>{entry.reviewDate}</td>
//                   <td>{entry.watchedMovie}</td>
//                   <td>{entry.watchDate}</td>
//                   <td>{entry.reviewedGenre}</td>
//                 </tr>
//               ))}
//             </tbody>
//           </Table>
//         </div>
//       )}

//       {/* Co-Actors Table */}
//       {Object.keys(coactors).length > 0 && (
//         <div className="mt-5">
//           <h4>👥 Top 3 Co-Actors Per Actor</h4>
//           <Table striped bordered hover responsive className="mt-3">
//             <thead>
//               <tr>
//                 <th>Actor</th>
//                 <th>Co-Actor</th>
//                 <th>Shared Movies</th>
//               </tr>
//             </thead>
//             <tbody>
//               {Object.entries(coactors).map(([actor, entries]) =>
//                 entries.map((entry, idx) => (
//                   <tr key={`${actor}_${idx}`} >
//                     <td>{actor}</td>
//                     <td>{entry.name}</td>
//                     <td>{entry.sharedMovies}</td>
//                   </tr>
//                 ))
//               )}
//             </tbody>
//           </Table>
//         </div>
//       )}
//     </Container>
//   );
// }

