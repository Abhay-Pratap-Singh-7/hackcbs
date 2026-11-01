import { Link } from 'react-router-dom';
import '../index.css';

const Login = () => {
  return (
    <div className="login-container">
      <div className="login-content">
        <div className="login-form-container">
          <div className="login-header">
            <h1>Welcome back <span className="wave">👋</span></h1>
            <p>Please enter your details.</p>
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
            Log In with Apple
          </button>

          <div className="divider">
            <span>or</span>
          </div>

          <form className="login-form">
            <div className="input-group">
              <input type="email" placeholder="Email" required />
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="input-icon">
                <rect width="20" height="16" x="2" y="4" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
            </div>
            <div className="input-group">
              <input type="password" placeholder="Password" required />
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="input-icon">
                <path d="M2 18v3c0 .6.4 1 1 1h4v-3h3v-3h2l1.4-1.4a6.5 6.5 0 1 0-4-4Z" />
                <circle cx="16.5" cy="7.5" r=".5" />
              </svg>
            </div>

            <div className="form-actions">
              <label className="remember-me">
                <input type="checkbox" />
                <span>Remember for 30 days</span>
              </label>
              <a href="#" className="forgot-password">Forgot password?</a>
            </div>

            <button type="submit" className="login-btn">Log In</button>
          </form>

          <p className="signup-link">
            Don't have an account? <Link to="/signup">Sign Up</Link>
          </p>
        </div>
      </div>
      
      <div className="login-image">
        <img src="/theme.jpg" alt="Societal Innovation Platform Theme" />
      </div>
    </div>
  );
};

export default Login;
