import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect, createContext, useContext } from 'react';
import axios from 'axios';
import './index.css';

// API Base URL
const API_URL = 'http://localhost:3001';

// Types
interface User {
  id: string;
  email: string;
  username: string;
  profile_picture?: string;
  bio?: string;
  followersCount?: number;
  followingCount?: number;
  pinsCount?: number;
  boardsCount?: number;
}

interface Board {
  id: string;
  title: string;
  description?: string;
  user_id: string;
  cover_image?: string;
  created_at?: string;
}

interface Pin {
  id: string;
  image_id: string;
  board_id: string;
  title: string;
  description?: string;
  tags: string;
  file_path?: string;
  file_name?: string;
  board_title?: string;
}

interface Image {
  id: string;
  file_name: string;
  file_type: string;
  file_path: string;
}

// Auth Context
interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

// API Helper
const api = {
  users: {
    create: (data: { email: string; username: string; password: string }) => 
      axios.post(`${API_URL}/users`, data),
    get: (id: string) => axios.get(`${API_URL}/users/${id}`),
    login: (data: { email: string; password: string }) => 
      axios.post(`${API_URL}/users/login`, data),
    update: (id: string, data: Partial<User>) => 
      axios.patch(`${API_URL}/users/${id}`, data),
    getBoards: (userId: string) => axios.get(`${API_URL}/users/${userId}/boards`),
    getFollowers: (id: string) => axios.get(`${API_URL}/users/${id}/followers`),
    getFollowing: (id: string) => axios.get(`${API_URL}/users/${id}/following`),
  },
  images: {
    upload: (formData: FormData) => 
      axios.post(`${API_URL}/images`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      }),
    get: (id: string) => axios.get(`${API_URL}/images/${id}`),
    getAll: () => axios.get(`${API_URL}/images`),
    delete: (id: string) => axios.delete(`${API_URL}/images/${id}`),
  },
  boards: {
    create: (data: { title: string; description?: string; user_id: string; cover_image?: string }) => 
      axios.post(`${API_URL}/boards`, data),
    get: (id: string) => axios.get(`${API_URL}/boards/${id}`),
    update: (id: string, data: Partial<Board>) => 
      axios.patch(`${API_URL}/boards/${id}`, data),
    delete: (id: string) => axios.delete(`${API_URL}/boards/${id}`),
  },
  pins: {
    create: (data: { image_id: string; board_id: string; title: string; description?: string; tags?: string[] }) => 
      axios.post(`${API_URL}/pins`, data),
    getAll: () => axios.get(`${API_URL}/pins`),
    get: (id: string) => axios.get(`${API_URL}/pins/${id}`),
    update: (id: string, data: Partial<Pin>) => 
      axios.patch(`${API_URL}/pins/${id}`, data),
    delete: (id: string) => axios.delete(`${API_URL}/pins/${id}`),
  },
  search: {
    pins: (q: string) => axios.get(`${API_URL}/search/pins`, { params: { q } }),
    filter: (tag: string) => axios.get(`${API_URL}/filter/pins`, { params: { tag } }),
  },
  feed: (params?: { tag?: string; board_id?: string; user_id?: string }) => 
    axios.get(`${API_URL}/feed`, { params }),
  follow: {
    create: (data: { follower_id: string; following_id: string }) => 
      axios.post(`${API_URL}/follow`, data),
    delete: (followerId: string, followingId: string) => 
      axios.delete(`${API_URL}/follow?follower_id=${followerId}&following_id=${followingId}`),
  },
};

// ==================== COMPONENTS ====================

// Navbar
const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-logo">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z"/>
        </svg>
        Pinterest
      </Link>
      <div className="navbar-links">
        <Link to="/" className="nav-link">Home</Link>
        {user ? (
          <>
            <Link to="/pins" className="nav-link">Pins</Link>
            <Link to="/boards" className="nav-link">Boards</Link>
            <Link to="/profile" className="nav-link">Profile</Link>
            <button onClick={() => { logout(); navigate('/'); }} className="nav-btn nav-btn-secondary">
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="nav-btn nav-btn-secondary">Login</Link>
            <Link to="/register" className="nav-btn nav-btn-primary">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
};

// Pin Card Component
const PinCard = ({ pin, onClick }: { pin: Pin; onClick?: () => void }) => {
  const tags = pin.tags ? JSON.parse(pin.tags) : [];

  return (
    <div className="pin-card" onClick={onClick}>
      <img 
        src={pin.file_path?.startsWith('http') ? pin.file_path : `${API_URL}${pin.file_path}`} 
        alt={pin.title}
        className="pin-card-image"
      />
      <div className="pin-card-overlay">
        <div className="pin-card-title">{pin.title}</div>
        <div className="pin-card-description">{pin.description}</div>
        {tags.length > 0 && (
          <div className="tags-container" style={{ marginTop: 8 }}>
            {tags.slice(0, 3).map((tag: string, i: number) => (
              <span key={i} className="tag tag-primary">{tag}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Board Card Component
const BoardCard = ({ board, pinCount = 0, onClick }: { board: Board; pinCount?: number; onClick?: () => void }) => {
  return (
    <div className="board-card" onClick={onClick}>
      {board.cover_image ? (
        <img src={board.cover_image} alt={board.title} className="board-card-image" />
      ) : (
        <div className="board-card-image" style={{ background: 'linear-gradient(135deg, #e60023, #ff6b6b)' }} />
      )}
      <div className="board-card-overlay">
        <div>
          <div className="board-card-title">{board.title}</div>
          <div className="board-card-count">{pinCount} pins</div>
        </div>
      </div>
    </div>
  );
};

// Modal Component
const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
};

// Toast Component
const Toast = ({ message, onClose }: { message: string; onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return <div className="toast">{message}</div>;
};

// ==================== PAGES ====================

// Home Page
const HomePage = () => {
  const [pins, setPins] = useState<Pin[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPins();
  }, []);

  const loadPins = async () => {
    try {
      const res = await api.feed();
      setPins(res.data);
    } catch (error) {
      console.error('Error loading pins:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="main-content">
      <div className="page-header">
        <h1 className="page-title">Discover</h1>
        <p className="page-subtitle">Explore the latest pins from our community</p>
      </div>

      {loading ? (
        <div className="loading"><div className="spinner"></div></div>
      ) : pins.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📌</div>
          <h3 className="empty-state-title">No pins yet</h3>
          <p className="empty-state-description">Be the first to create a pin!</p>
        </div>
      ) : (
        <div className="masonry-grid">
          {pins.map(pin => (
            <div key={pin.id} className="masonry-item">
              <PinCard pin={pin} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Login Page
const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-subtitle">Sign in to your account</p>
        
        {error && <div style={{ color: 'red', marginBottom: 16, textAlign: 'center' }}>{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="form-btn form-btn-primary">Sign In</button>
        </form>
        
        <p className="auth-switch">
          Don't have an account? <Link to="/register">Sign up</Link>
        </p>
      </div>
    </div>
  );
};

// Register Page
const RegisterPage = () => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await register(email, username, password);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">Create account</h1>
        <p className="auth-subtitle">Join Pinterest and start saving ideas</p>
        
        {error && <div style={{ color: 'red', marginBottom: 16, textAlign: 'center' }}>{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              type="text"
              className="form-input"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="form-btn form-btn-primary">Create Account</button>
        </form>
        
        <p className="auth-switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

// User Profile Dashboard
const UserProfileDashboard = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<User | null>(null);
  const [boards, setBoards] = useState<Board[]>([]);
  const [pins, setPins] = useState<Pin[]>([]);
  const [followers, setFollowers] = useState<User[]>([]);
  const [following, setFollowing] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState('pins');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    try {
      const [profileRes, boardsRes, pinsRes, followersRes, followingRes] = await Promise.all([
        api.users.get(user.id),
        api.users.getBoards(user.id),
        api.feed({ user_id: user.id }),
        api.users.getFollowers(user.id),
        api.users.getFollowing(user.id),
      ]);
      setProfile(profileRes.data);
      setBoards(boardsRes.data);
      setPins(pinsRes.data);
      setFollowers(followersRes.data);
      setFollowing(followingRes.data);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="main-content">
        <div className="empty-state">
          <h3 className="empty-state-title">Please login to view your profile</h3>
          <Link to="/login" className="form-btn form-btn-primary" style={{ display: 'inline-block', width: 'auto', padding: '12px 24px' }}>
            Login
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="loading"><div className="spinner"></div></div>;
  }

  return (
    <div className="main-content">
      <div className="profile-header">
        <div className="profile-avatar">
          {profile?.profile_picture ? (
            <img src={profile.profile_picture} alt={profile.username} />
          ) : (
            profile?.username?.charAt(0).toUpperCase()
          )}
        </div>
        <div className="profile-info">
          <h1 className="profile-name">{profile?.username}</h1>
          <p className="profile-email">{profile?.email}</p>
          <div className="profile-stats">
            <div className="profile-stat">
              <div className="profile-stat-value">{profile?.pinsCount || 0}</div>
              <div className="profile-stat-label">Pins</div>
            </div>
            <div className="profile-stat">
              <div className="profile-stat-value">{profile?.followersCount || 0}</div>
              <div className="profile-stat-label">Followers</div>
            </div>
            <div className="profile-stat">
              <div className="profile-stat-value">{profile?.followingCount || 0}</div>
              <div className="profile-stat-label">Following</div>
            </div>
            <div className="profile-stat">
              <div className="profile-stat-value">{profile?.boardsCount || 0}</div>
              <div className="profile-stat-label">Boards</div>
            </div>
          </div>
        </div>
      </div>

      <div className="tabs">
        <button className={`tab ${activeTab === 'pins' ? 'active' : ''}`} onClick={() => setActiveTab('pins')}>
          Pins
        </button>
        <button className={`tab ${activeTab === 'boards' ? 'active' : ''}`} onClick={() => setActiveTab('boards')}>
          Boards
        </button>
        <button className={`tab ${activeTab === 'followers' ? 'active' : ''}`} onClick={() => setActiveTab('followers')}>
          Followers
        </button>
        <button className={`tab ${activeTab === 'following' ? 'active' : ''}`} onClick={() => setActiveTab('following')}>
          Following
        </button>
      </div>

      {activeTab === 'pins' && (
        pins.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📌</div>
            <h3 className="empty-state-title">No pins yet</h3>
            <p className="empty-state-description">Create your first pin to get started</p>
          </div>
        ) : (
          <div className="masonry-grid">
            {pins.map(pin => (
              <div key={pin.id} className="masonry-item">
                <PinCard pin={pin} />
              </div>
            ))}
          </div>
        )
      )}

      {activeTab === 'boards' && (
        boards.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📁</div>
            <h3 className="empty-state-title">No boards yet</h3>
            <p className="empty-state-description">Create your first board to organize your pins</p>
          </div>
        ) : (
          <div className="grid grid-4">
            {boards.map(board => (
              <BoardCard key={board.id} board={board} />
            ))}
          </div>
        )
      )}

      {activeTab === 'followers' && (
        followers.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">👥</div>
            <h3 className="empty-state-title">No followers yet</h3>
            <p className="empty-state-description">Share your profile to get followers</p>
          </div>
        ) : (
          <div className="grid grid-4">
            {followers.map(f => (
              <div key={f.id} className="card" style={{ textAlign: 'center' }}>
                <div className="profile-avatar" style={{ width: 60, height: 60, fontSize: 24, margin: '0 auto 12px' }}>
                  {f.username.charAt(0).toUpperCase()}
                </div>
                <div style={{ fontWeight: 600 }}>{f.username}</div>
              </div>
            ))}
          </div>
        )
      )}

      {activeTab === 'following' && (
        following.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">👤</div>
            <h3 className="empty-state-title">Not following anyone</h3>
            <p className="empty-state-description">Follow other users to see their content</p>
          </div>
        ) : (
          <div className="grid grid-4">
            {following.map(f => (
              <div key={f.id} className="card" style={{ textAlign: 'center' }}>
                <div className="profile-avatar" style={{ width: 60, height: 60, fontSize: 24, margin: '0 auto 12px' }}>
                  {f.username.charAt(0).toUpperCase()}
                </div>
                <div style={{ fontWeight: 600 }}>{f.username}</div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
};

// Pin Management Workspace
const PinManagementWorkspace = () => {
  const { user } = useAuth();
  const [pins, setPins] = useState<Pin[]>([]);
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [formData, setFormData] = useState({ title: '', description: '', board_id: '', tags: '' });
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    try {
      const [pinsRes, boardsRes] = await Promise.all([
        api.feed({ user_id: user.id }),
        api.users.getBoards(user.id),
      ]);
      setPins(pinsRes.data);
      setBoards(boardsRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleCreatePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedImage || !formData.board_id) return;

    setUploading(true);
    try {
      // Upload image
      const imageFormData = new FormData();
      imageFormData.append('image', selectedImage);
      const imageRes = await api.images.upload(imageFormData);

      // Create pin
      await api.pins.create({
        image_id: imageRes.data.id,
        board_id: formData.board_id,
        title: formData.title,
        description: formData.description,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
      });

      setToast('Pin created successfully!');
      setShowCreateModal(false);
      setSelectedImage(null);
      setImagePreview('');
      setFormData({ title: '', description: '', board_id: '', tags: '' });
      loadData();
    } catch (error) {
      console.error('Error creating pin:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePin = async (pinId: string) => {
    try {
      await api.pins.delete(pinId);
      setToast('Pin deleted successfully!');
      loadData();
    } catch (error) {
      console.error('Error deleting pin:', error);
    }
  };

  if (!user) {
    return (
      <div className="main-content">
        <div className="empty-state">
          <h3 className="empty-state-title">Please login to manage pins</h3>
          <Link to="/login" className="form-btn form-btn-primary" style={{ display: 'inline-block', width: 'auto', padding: '12px 24px' }}>
            Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Pin Management</h1>
          <p className="page-subtitle">Create and manage your pins</p>
        </div>
        <button className="nav-btn nav-btn-primary" onClick={() => setShowCreateModal(true)}>
          + Create Pin
        </button>
      </div>

      {loading ? (
        <div className="loading"><div className="spinner"></div></div>
      ) : pins.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📌</div>
          <h3 className="empty-state-title">No pins yet</h3>
          <p className="empty-state-description">Create your first pin to get started</p>
          <button className="form-btn form-btn-primary" onClick={() => setShowCreateModal(true)} style={{ width: 'auto', padding: '12px 24px' }}>
            Create Pin
          </button>
        </div>
      ) : (
        <div className="masonry-grid">
          {pins.map(pin => (
            <div key={pin.id} className="masonry-item">
              <PinCard pin={pin} />
              <button 
                onClick={(e) => { e.stopPropagation(); handleDeletePin(pin.id); }}
                style={{ 
                  position: 'absolute', 
                  top: 8, 
                  right: 8, 
                  background: 'rgba(255,255,255,0.9)', 
                  border: 'none', 
                  borderRadius: '50%', 
                  width: 32, 
                  height: 32,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                🗑️
              </button>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create New Pin">
        <form onSubmit={handleCreatePin}>
          <div className="form-group">
            <label className="form-label">Image</label>
            {imagePreview ? (
              <img src={imagePreview} alt="Preview" className="image-preview" />
            ) : (
              <label className="upload-area">
                <input type="file" accept="image/*" onChange={handleImageSelect} style={{ display: 'none' }} />
                <div className="upload-icon">📷</div>
                <div className="upload-text">Click to upload an image</div>
                <div className="upload-hint">PNG, JPG, GIF up to 10MB</div>
              </label>
            )}
          </div>
          <div className="form-group">
            <label className="form-label">Title</label>
            <input
              type="text"
              className="form-input"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-input form-textarea"
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Board</label>
            <select
              className="form-input"
              value={formData.board_id}
              onChange={e => setFormData({ ...formData, board_id: e.target.value })}
              required
            >
              <option value="">Select a board</option>
              {boards.map(board => (
                <option key={board.id} value={board.id}>{board.title}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Tags (comma separated)</label>
            <input
              type="text"
              className="form-input"
              value={formData.tags}
              onChange={e => setFormData({ ...formData, tags: e.target.value })}
              placeholder="nature, travel, photography"
            />
          </div>
          <button type="submit" className="form-btn form-btn-primary" disabled={uploading || !selectedImage}>
            {uploading ? 'Creating...' : 'Create Pin'}
          </button>
        </form>
      </Modal>

      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </div>
  );
};

// Board Management Workspace
const BoardManagementWorkspace = () => {
  const { user } = useAuth();
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '' });
  const [creating, setCreating] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    loadBoards();
  }, [user]);

  const loadBoards = async () => {
    if (!user) return;
    try {
      const res = await api.users.getBoards(user.id);
      setBoards(res.data);
    } catch (error) {
      console.error('Error loading boards:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setCreating(true);
    try {
      await api.boards.create({
        title: formData.title,
        description: formData.description,
        user_id: user.id,
      });
      setToast('Board created successfully!');
      setShowCreateModal(false);
      setFormData({ title: '', description: '' });
      loadBoards();
    } catch (error) {
      console.error('Error creating board:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteBoard = async (boardId: string) => {
    try {
      await api.boards.delete(boardId);
      setToast('Board deleted successfully!');
      loadBoards();
    } catch (error) {
      console.error('Error deleting board:', error);
    }
  };

  if (!user) {
    return (
      <div className="main-content">
        <div className="empty-state">
          <h3 className="empty-state-title">Please login to manage boards</h3>
          <Link to="/login" className="form-btn form-btn-primary" style={{ display: 'inline-block', width: 'auto', padding: '12px 24px' }}>
            Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Board Management</h1>
          <p className="page-subtitle">Create and organize your boards</p>
        </div>
        <button className="nav-btn nav-btn-primary" onClick={() => setShowCreateModal(true)}>
          + Create Board
        </button>
      </div>

      {loading ? (
        <div className="loading"><div className="spinner"></div></div>
      ) : boards.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📁</div>
          <h3 className="empty-state-title">No boards yet</h3>
          <p className="empty-state-description">Create your first board to organize your pins</p>
          <button className="form-btn form-btn-primary" onClick={() => setShowCreateModal(true)} style={{ width: 'auto', padding: '12px 24px' }}>
            Create Board
          </button>
        </div>
      ) : (
        <div className="grid grid-4">
          {boards.map(board => (
            <div key={board.id} style={{ position: 'relative' }}>
              <BoardCard board={board} />
              <button 
                onClick={() => handleDeleteBoard(board.id)}
                style={{ 
                  position: 'absolute', 
                  top: 8, 
                  right: 8, 
                  background: 'rgba(255,255,255,0.9)', 
                  border: 'none', 
                  borderRadius: '50%', 
                  width: 32, 
                  height: 32,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                🗑️
              </button>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create New Board">
        <form onSubmit={handleCreateBoard}>
          <div className="form-group">
            <label className="form-label">Title</label>
            <input
              type="text"
              className="form-input"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-input form-textarea"
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          <button type="submit" className="form-btn form-btn-primary" disabled={creating}>
            {creating ? 'Creating...' : 'Create Board'}
          </button>
        </form>
      </Modal>

      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </div>
  );
};

// Search and Filtering Results
const SearchAndFilteringResults = () => {
  const [query, setQuery] = useState('');
  const [pins, setPins] = useState<Pin[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [selectedTag, setSelectedTag] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    try {
      const res = await axios.get(`${API_URL}/tags`);
      setTags(res.data.map((t: any) => t.name));
    } catch (error) {
      console.error('Error loading tags:', error);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;

    setLoading(true);
    try {
      const res = await api.search.pins(query);
      setPins(res.data);
      setSelectedTag('');
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterByTag = async (tag: string) => {
    setLoading(true);
    setSelectedTag(tag);
    setQuery('');
    try {
      const res = await api.search.filter(tag);
      setPins(res.data);
    } catch (error) {
      console.error('Error filtering:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="main-content">
      <div className="page-header">
        <h1 className="page-title">Search & Filter</h1>
        <p className="page-subtitle">Find pins by searching or filtering by tags</p>
      </div>

      <form className="search-container" onSubmit={handleSearch}>
        <span className="search-icon">🔍</span>
        <input
          type="text"
          className="search-input"
          placeholder="Search pins..."
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
      </form>

      <div className="filter-container">
        <button 
          className={`filter-btn ${!selectedTag ? 'active' : ''}`}
          onClick={() => { setSelectedTag(''); setPins([]); }}
        >
          All
        </button>
        {tags.map(tag => (
          <button
            key={tag}
            className={`filter-btn ${selectedTag === tag ? 'active' : ''}`}
            onClick={() => handleFilterByTag(tag)}
          >
            {tag}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading"><div className="spinner"></div></div>
      ) : pins.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🔍</div>
          <h3 className="empty-state-title">No results found</h3>
          <p className="empty-state-description">Try searching for something else or browse all pins</p>
        </div>
      ) : (
        <div className="masonry-grid">
          {pins.map(pin => (
            <div key={pin.id} className="masonry-item">
              <PinCard pin={pin} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// UI Dashboard (Admin-style view)
const UIDashboard = () => {
  const [stats, setStats] = useState({ users: 0, boards: 0, pins: 0, images: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [usersRes, boardsRes, pinsRes, imagesRes] = await Promise.all([
        axios.get(`${API_URL}/users`),
        axios.get(`${API_URL}/boards`),
        api.pins.getAll(),
        api.images.getAll(),
      ]);
      setStats({
        users: Array.isArray(usersRes.data) ? usersRes.data.length : 0,
        boards: Array.isArray(boardsRes.data) ? boardsRes.data.length : 0,
        pins: Array.isArray(pinsRes.data) ? pinsRes.data.length : 0,
        images: Array.isArray(imagesRes.data) ? imagesRes.data.length : 0,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="main-content">
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Overview of your Pinterest clone</p>
      </div>

      {loading ? (
        <div className="loading"><div className="spinner"></div></div>
      ) : (
        <div className="grid grid-4">
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>👥</div>
            <div style={{ fontSize: 32, fontWeight: 700 }}>{stats.users}</div>
            <div style={{ color: 'var(--text-secondary)' }}>Users</div>
          </div>
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>📁</div>
            <div style={{ fontSize: 32, fontWeight: 700 }}>{stats.boards}</div>
            <div style={{ color: 'var(--text-secondary)' }}>Boards</div>
          </div>
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>📌</div>
            <div style={{ fontSize: 32, fontWeight: 700 }}>{stats.pins}</div>
            <div style={{ color: 'var(--text-secondary)' }}>Pins</div>
          </div>
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>🖼️</div>
            <div style={{ fontSize: 32, fontWeight: 700 }}>{stats.images}</div>
            <div style={{ color: 'var(--text-secondary)' }}>Images</div>
          </div>
        </div>
      )}
    </div>
  );
};

// ==================== APP ====================

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // Check for stored user
    const storedUser = localStorage.getItem('pinterest_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setInitialized(true);
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.users.login({ email, password });
    const userData = res.data;
    setUser(userData);
    localStorage.setItem('pinterest_user', JSON.stringify(userData));
  };

  const register = async (email: string, username: string, password: string) => {
    await api.users.create({ email, username, password });
    await login(email, password);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('pinterest_user');
  };

  if (!initialized) {
    return <div className="loading"><div className="spinner"></div></div>;
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      <Router>
        <div className="app-container">
          <Navbar />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/profile" element={<UserProfileDashboard />} />
            <Route path="/pins" element={<PinManagementWorkspace />} />
            <Route path="/boards" element={<BoardManagementWorkspace />} />
            <Route path="/search" element={<SearchAndFilteringResults />} />
            <Route path="/dashboard" element={<UIDashboard />} />
          </Routes>
        </div>
      </Router>
    </AuthContext.Provider>
  );
}

export default App;