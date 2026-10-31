import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../index.css';

const Signup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('https://hackcbs-cjno.onrender.com/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong during signup');
      }

      // Redirect to login after successful signup
      navigate('/login');
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-content">
        <div className="login-form-container">
          <div className="login-header">
            <h1>Create an account <span className="wave">👋</span></h1>
            <p>Please enter your details to sign up.</p>
          </div>

          <button className="social-btn">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="apple-icon"
            >
              <path d="M16.365 14.363c0-1.637.747-3.218 2.308-4.103-1.045-1.503-2.673-1.743-3.267-1.782-1.39-.142-2.738.835-3.447.835-.724 0-1.841-.81-3.003-.787-1.504.02-2.912.871-3.69 2.21-1.564 2.709-.395 6.726 1.135 8.92 .747 1.077 1.621 2.274 2.779 2.235 1.121-.043 1.558-.724 2.909-.724 1.341 0 1.745.724 2.923.696 1.196-.02 1.94-.1087 2.684-2.182 1.144-1.666 1.621-3.284 1.644-3.364-.035-.015-3.151-1.206-3.151-4.869z" />
              <path d="M14.939 5.894c.64-.775 1.066-1.854.95-2.928-1.031.043-2.193.684-2.853 1.48-.592.707-1.096 1.815-.956 2.868 1.155.088 2.22-.569 2.859-1.42z" />
            </svg>
            Sign up with Apple
          </button>

          <div className="divider">
            <span>or</span>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            {error && <div style={{ color: '#ff4444', marginBottom: '1rem', fontSize: '14px', textAlign: 'center' }}>{error}</div>}
            <div className="input-group">
              <input 
                type="text" 
                placeholder="Full Name" 
                required 
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="input-icon">
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <div className="input-group">
              <input 
                type="email" 
                placeholder="Email" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="input-icon">
                <rect width="20" height="16" x="2" y="4" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
            </div>
            <div className="input-group">
              <input 
                type="password" 
                placeholder="Password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="input-icon">
                <path d="M2 18v3c0 .6.4 1 1 1h4v-3h3v-3h2l1.4-1.4a6.5 6.5 0 1 0-4-4Z" />
                <circle cx="16.5" cy="7.5" r=".5" />
              </svg>
            </div>

            <div className="form-actions" style={{ marginTop: '0.5rem', marginBottom: '1rem' }}>
              <label className="remember-me">
                <input type="checkbox" required />
                <span>I agree to terms & conditions</span>
              </label>
            </div>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? 'Signing Up...' : 'Sign Up'}
            </button>
          </form>

          <p className="signup-link">
            Already have an account? <Link to="/login">Log In</Link>
          </p>
        </div>
      </div>
      
      <div className="login-image">
        <img src="/theme.jpg" alt="Jharkhand Societal Innovation Platform Theme" />
      </div>
    </div>
  );
};

export default Signup;
