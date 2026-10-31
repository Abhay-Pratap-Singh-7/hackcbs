import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import ProblemSubmission from './pages/ProblemSubmission';
import PublicFeed from './pages/PublicFeed';
import ProblemDetail from './pages/ProblemDetail';
import ExploreMap from './pages/ExploreMap';
import UniversityDashboard from './pages/UniversityDashboard';
import IndustryDashboard from './pages/IndustryDashboard';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Auth />} />
        <Route path="/signup" element={<Auth />} />
        
        {/* Portal Pages */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/university/dashboard" element={<UniversityDashboard />} />
        <Route path="/university" element={<UniversityDashboard />} />
        <Route path="/industry/dashboard" element={<IndustryDashboard />} />
        <Route path="/industry" element={<IndustryDashboard />} />
        <Route path="/explore" element={<ExploreMap />} />
        <Route path="/submit-problem" element={<ProblemSubmission />} />
        <Route path="/feed" element={<PublicFeed />} />
        <Route path="/problem/:id" element={<ProblemDetail />} />
      </Routes>
    </Router>
  );
}

export default App;
