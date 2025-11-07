import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import axios from 'axios';
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';

function AdminPanel({ setMessage }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = Cookies.get('token');
  const headers = { Authorization: `Bearer ${token}` };

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/users`, { headers });
      setUsers(res.data.users);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchUsers();
  }, [token]);

  const handleRoleChange = async (userId, newRole) => {
    try {
      await axios.patch(`${import.meta.env.VITE_API_URL}/api/users/${userId}/role`, { role: newRole }, { headers });
      setMessage('Role updated!');
      fetchUsers();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Update failed.');
    }
  };

  if (loading) return <div className="text-center py-5"><div className="spinner-border"></div></div>;

  return (
    <div className="container py-5">
      <h2 className="mb-4">Admin Panel <span className="badge bg-danger">Admin Only</span></h2>
      <div className="row g-4">
        {users.map(user => (
          <div key={user._id} className="col-md-6 col-lg-4">
            <div className="card h-100 shadow-sm">
              <div className="card-body">
                <h5 className="card-title">{user.username}</h5>
                <p className="text-muted small">{user.email}</p>
                <div className="d-flex align-items-center gap-2">
                  <strong>Role:</strong>
                  <select
                    className="form-select form-select-sm"
                    value={user.role}
                    onChange={(e) => handleRoleChange(user._id, e.target.value)}
                  >
                    <option value="Viewer">Viewer</option>
                    <option value="Editor">Editor</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function HomePage() {
  return (
    <div className="container py-5">
      <div className="text-center mb-5">
        <h1 className="display-4 fw-bold text-primary">Welcome to RBAC MERN App!</h1>
        <p className="lead text-muted">Fine-grained Role-Based Access Control in action.</p>
      </div>
      <div className="row g-4">
        <div className="col-md-4">
          <div className="card role-card h-100 border-0 bg-info text-white">
            <div className="card-body text-center p-4">
              <i className="fas fa-eye fa-3x mb-3"></i>
              <h3>Viewer</h3>
              <p>Read only access to posts.</p>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card role-card h-100 border-0 bg-success text-white">
            <div className="card-body text-center p-4">
              <i className="fas fa-edit fa-3x mb-3"></i>
              <h3>Editor</h3>
              <p>Create and edit own posts.</p>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card role-card h-100 border-0 bg-danger text-white">
            <div className="card-body text-center p-4">
              <i className="fas fa-shield-alt fa-3x mb-3"></i>
              <h3>Admin</h3>
              <p>Full access + manage users.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoginForm({ setRole, setUserId, setMessage }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage('Logging in...');
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/login`, { email, password });
      const { token, user } = response.data;
      Cookies.set('token', token, { secure: false, sameSite: 'strict' });
      setRole(user.role);
      setUserId(user.id);
      setMessage(`Welcome, ${user.username}! Role: ${user.role}`);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Login failed!');
    }
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-5">
          <div className="card shadow-lg border-0">
            <div className="card-body p-5">
              <h2 className="text-center mb-4">Login</h2>
              <form onSubmit={handleLogin}>
                <div className="mb-3">
                  <input
                    type="email"
                    className="form-control form-control-lg"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-3">
                  <input
                    type="password"
                    className="form-control form-control-lg"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary btn-lg w-100 btn-custom">
                  Login
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PostsPage({ role, userId, setMessage }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [formData, setFormData] = useState({ title: '', content: '' });

  const token = Cookies.get('token');
  const headers = { Authorization: `Bearer ${token}` };

  const fetchPosts = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/posts`, { headers });
      setPosts(res.data.posts);
    } catch (err) {
      setMessage('Failed to load posts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchPosts();
    else setLoading(false);
  }, [token]);

  const openModal = (post = null) => {
    setEditingPost(post);
    setFormData(post ? { title: post.title, content: post.content } : { title: '', content: '' });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingPost(null);
    setFormData({ title: '', content: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingPost) {
        await axios.put(`${import.meta.env.VITE_API_URL}/api/posts/${editingPost._id}`, formData, { headers });
        setMessage('Post updated!');
      } else {
        await axios.post(`${import.meta.env.VITE_API_URL}/api/posts`, formData, { headers });
        setMessage('Post created!');
      }
      closeModal();
      fetchPosts();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Operation failed.');
    }
  };

  const handleDelete = async (postId) => {
    if (!window.confirm('Delete this post?')) return;
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/posts/${postId}`, { headers });
      setMessage('Post deleted!');
      fetchPosts();
    } catch (err) {
      setMessage('Delete failed.');
    }
  };

  const canCreate = ['Editor', 'Admin'].includes(role);
  const canEdit = (post) => role === 'Admin' || (role === 'Editor' && post.author._id === userId);

  if (loading) return <div className="text-center py-5"><div className="spinner-border"></div></div>;

  return (
    <div className="container py-5">
      <h2 className="mb-4">Posts Dashboard <span className="badge bg-secondary">Role: {role}</span></h2>

      <div className="mb-4">
        {canCreate && (
          <button onClick={() => openModal()} className="btn btn-success btn-lg me-2 btn-custom">
            New Post
          </button>
        )}
      </div>

      <div className="row g-4">
        {posts.length === 0 ? (
          <div className="col-12 text-center py-5">
            <p className="text-muted">No posts yet — create one!</p>
          </div>
        ) : (
          posts.map(post => (
            <div key={post._id} className="col-md-6 col-lg-4">
              <div className="card h-100 shadow-sm border-0">
                <div className="card-body">
                  <h5 className="card-title">{post.title}</h5>
                  <p className="text-muted small">
                    By <strong>{post.author.username}</strong> | {new Date(post.createdAt).toLocaleDateString()}
                  </p>
                  <p className="card-text">{post.content}</p>
                  <div className="mt-3">
                    {canEdit(post) ? (
                      <>
                        <button onClick={() => openModal(post)} className="btn btn-outline-primary btn-sm me-2">Edit</button>
                        <button onClick={() => handleDelete(post._id)} className="btn btn-outline-danger btn-sm">Delete</button>
                      </>
                    ) : (
                      <span className="text-muted small">Read-only.</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{editingPost ? 'Edit Post' : 'New Post'}</h5>
                <button onClick={closeModal} className="btn-close"></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <textarea
                      className="form-control"
                      rows="4"
                      placeholder="Content"
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" onClick={closeModal} className="btn btn-secondary">Cancel</button>
                  <button type="submit" className="btn btn-primary">{editingPost ? 'Update' : 'Create'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function App() {
  const [role, setRole] = useState('Viewer');
  const [userId, setUserId] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = Cookies.get('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setRole(decoded.role);
        setUserId(decoded.userId);
      } catch {
        Cookies.remove('token');
      }
    }
  }, []);

  const handleLogout = () => {
    Cookies.remove('token');
    setRole('Viewer');
    setUserId(null);
    setMessage('Logged out.');
  };

  return (
    <Router>
      <nav className="navbar navbar-expand-lg navbar-light bg-white navbar-custom">
        <div className="container">
          <div className="navbar-nav me-auto">
            <Link to="/" className="nav-link">Home</Link>
            <Link to="/login" className="nav-link">Login</Link>
            <Link to="/posts" className="nav-link">Posts</Link>
            {role === 'Admin' && <Link to="/admin" className="nav-link">Admin Panel</Link>}
          </div>
          <div className="d-flex align-items-center">
            <span className="badge bg-dark me-3">Role: {role}</span>
            {role !== 'Viewer' && (
              <button onClick={handleLogout} className="btn btn-outline-danger btn-sm">
                Logout
              </button>
            )}
          </div>
        </div>
      </nav>

      {message && (
        <div className="container mt-3">
          <div className="alert alert-info text-center">{message}</div>
        </div>
      )}

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginForm setRole={setRole} setUserId={setUserId} setMessage={setMessage} />} />
        <Route path="/posts" element={<PostsPage role={role} userId={userId} setMessage={setMessage} />} />
        <Route path="/admin" element={<AdminPanel setMessage={setMessage} />} />
      </Routes>
    </Router>
  );
}

export default App;