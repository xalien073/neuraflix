// admin/page.js
'use client';

import { useState } from 'react';
import { Button, Modal, Form, Container, Row, Col, Spinner } from 'react-bootstrap';
import axios from 'axios';

export default function AdminPanel() {
  const [showMovieModal, setShowMovieModal] = useState(false);
  const [movieData, setMovieData] = useState({ title: '', genre: '', year: '' });
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [log, setLog] = useState('');

  const handleMovieSubmit = async () => {
    setLoading(true);
    setLog('Uploading thumbnail and inserting vertex...');

    try {
      const formData = new FormData();
      formData.append('file', thumbnailFile); // 🔥 must be "file", not "thumbnail"
      formData.append('title', movieData.title);
      formData.append('genre', movieData.genre);
      formData.append('year', movieData.year);

      const res = await axios.post('/api/insertMovie', formData);
      setLog(res.data?.message || 'Movie inserted successfully!');
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.message || err.message;
      setLog(`❌ Error: ${errMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleModalOpen = () => {
    setShowMovieModal(true);
    setLog('');
    setMovieData({ title: '', genre: '', year: '' });
    setThumbnailFile(null);
  };

  return (
    <Container className="mt-4">
      <h2>🎬 NeuraFlix Admin Panel</h2>

      <Row className="mt-4">
        <Col xs={12} md={6}>
          <Button variant="dark" onClick={handleModalOpen} className="w-100">
            Insert Movie
          </Button>
        </Col>
      </Row>

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
              {loading ? <Spinner animation="border" size="sm" /> : '🎥 Insert Movie'}
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
          <Button variant="secondary" onClick={() => setShowMovieModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}


// 'use client';

// import { useState } from 'react';
// import { Button, Modal, Form, Container, Row, Col, Spinner } from 'react-bootstrap';
// import axios from 'axios';

// export default function AdminPanel() {
//   const [showMovieModal, setShowMovieModal] = useState(false);
//   const [movieData, setMovieData] = useState({ title: '', genre: '', year: '' });
//   const [thumbnailFile, setThumbnailFile] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [log, setLog] = useState('');

//   const handleMovieSubmit = async () => {
//     setLoading(true);
//     setLog('Uploading image and inserting vertex...');

//     try {
//       const formData = new FormData();
//       formData.append('thumbnail', thumbnailFile);
//       formData.append('title', movieData.title);
//       formData.append('genre', movieData.genre);
//       formData.append('year', movieData.year);

//       const res = await axios.post('/api/insertMovie', formData);
//       setLog(res.data?.message || 'Success!');
//     } catch (err) {
//       console.error(err);
//       alert('Failed!');
//       setLog('Error: ' + (err.response?.data?.error || err.message));
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <Container className="mt-4">
//       <h2>NeuraFlix Admin Panel</h2>
//       <Row className="mt-4">
//         <Col xs={12} md={6}>
//           <Button variant="dark" onClick={() => setShowMovieModal(true)} className="w-100">
//             Insert Movie
//           </Button>
//         </Col>
//         {/* Add more buttons for other inserts here */}
//       </Row>

//       {/* Movie Modal */}
//       <Modal show={showMovieModal} onHide={() => setShowMovieModal(false)}>
//         <Modal.Header closeButton>
//           <Modal.Title>Insert Movie</Modal.Title>
//         </Modal.Header>
//         <Modal.Body>
//           <Form>
//             <Form.Group className="mb-2">
//               <Form.Label>Title</Form.Label>
//               <Form.Control
//                 type="text"
//                 value={movieData.title}
//                 onChange={(e) => setMovieData({ ...movieData, title: e.target.value })}
//               />
//             </Form.Group>
//             <Form.Group className="mb-2">
//               <Form.Label>Genre</Form.Label>
//               <Form.Control
//                 type="text"
//                 value={movieData.genre}
//                 onChange={(e) => setMovieData({ ...movieData, genre: e.target.value })}
//               />
//             </Form.Group>
//             <Form.Group className="mb-2">
//               <Form.Label>Year</Form.Label>
//               <Form.Control
//                 type="number"
//                 value={movieData.year}
//                 onChange={(e) => setMovieData({ ...movieData, year: e.target.value })}
//               />
//             </Form.Group>
//             <Form.Group className="mb-2">
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
//               disabled={loading || !movieData.title || !movieData.genre || !movieData.year || !thumbnailFile}
//               onClick={handleMovieSubmit}
//             >
//               {loading ? <Spinner size="sm" animation="border" /> : 'Insert Movie'}
//             </Button>
//           </div>
//           <hr />
//           <pre className="bg-light p-2">{log}</pre>
//         </Modal.Body>
//         <Modal.Footer>
//           <Button variant="secondary" onClick={() => setShowMovieModal(false)}>Close</Button>
//         </Modal.Footer>
//       </Modal>
//     </Container>
//   );
// }
