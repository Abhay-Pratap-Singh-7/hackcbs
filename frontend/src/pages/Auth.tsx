import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Auth.css';
import { ChevronDown, Lock, Check, User, MapPin, Map, Hash, Users, Building, UserCheck, Briefcase, Layers, Home, Landmark, FileCode, Award, Shield, Mail, BadgeCheck, Eye, EyeOff, Globe, Calendar } from 'lucide-react';

const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const formColumnRef = useRef<HTMLDivElement>(null);
  
  const [view, setView] = useState<'login' | 'signup'>(
    location.pathname === '/signup' ? 'signup' : 'login'
  );

  useEffect(() => {
    if (location.pathname === '/signup') setView('signup');
    else setView('login');
  }, [location.pathname]);

  const switchView = (targetView: 'login' | 'signup') => {
    if (formColumnRef.current) {
      formColumnRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
    setView(targetView);
    navigate(`/${targetView}`);
  };

  const [toast, setToast] = useState({ show: false, msg: '' });
  const showToast = (msg: string) => {
    setToast({ show: true, msg });
    setTimeout(() => setToast({ show: false, msg: '' }), 3000);
  };

  // Login State
  const [loginStep, setLoginStep] = useState(1);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginOtp, setLoginOtp] = useState('');
  const [loginResendTimer, setLoginResendTimer] = useState(0);
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Signup State
  const [signupStep, setSignupStep] = useState(1);
  const [signupRole, setSignupRole] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [signupResendTimer, setSignupResendTimer] = useState(0);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Profile Details State
  const [profileDetails, setProfileDetails] = useState<any>({});

  const handleProfileChange = (key: string, value: string) => {
    setProfileDetails((prev: any) => ({ ...prev, [key]: value }));
  };

  // Timers
  useEffect(() => {
    if (loginResendTimer > 0) {
      const timer = setTimeout(() => setLoginResendTimer(loginResendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [loginResendTimer]);

  useEffect(() => {
    if (signupResendTimer > 0) {
      const timer = setTimeout(() => setSignupResendTimer(signupResendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [signupResendTimer]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (loginStep === 1) {
      if (!loginEmail.trim() || !/\S+@\S+\.\S+/.test(loginEmail)) {
        showToast('Please enter a valid email address');
        return;
      }
      if (!loginPassword.trim()) {
        showToast('Please enter your password');
        return;
      }

      setLoading(true);
      try {
        const response = await fetch('https://sih-26-jarr.onrender.com/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: loginEmail, password: loginPassword }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Login failed');
        
        showToast(data.message || 'OTP Sent!');
        setLoginStep(2);
        setLoginResendTimer(60);
      } catch (err: any) {
        showToast(err.message || 'An error occurred');
      } finally {
        setLoading(false);
      }
    } else {
      if (!loginOtp || loginOtp.length !== 6 || !/^\d+$/.test(loginOtp)) {
        showToast('Please enter a valid 6-digit OTP');
        return;
      }

      setLoading(true);
      try {
        const response = await fetch('https://sih-26-jarr.onrender.com/api/auth/verify-login-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: loginEmail, otp: loginOtp, purpose: 'LOGIN_VERIFY' }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Verification failed');
        
        showToast('Login successful!');
        const userObj = data.data?.user || data.user;
        const accessToken = data.data?.tokens?.accessToken || data.accessToken || data.data?.accessToken;
        const refreshToken = data.data?.tokens?.refreshToken || data.refreshToken || data.data?.refreshToken;
        if (accessToken) localStorage.setItem('accessToken', accessToken);
        if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
        if (userObj) {
          localStorage.setItem('user', JSON.stringify(userObj));
          if (userObj.role === 'INSTITUTE_ADMIN') {
            navigate('/university/dashboard');
          } else {
            navigate('/dashboard');
          }
        } else {
          navigate('/dashboard');
        }
      } catch (err: any) {
        showToast(err.message || 'An error occurred');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (signupStep === 1) {
      if (!signupRole) {
        showToast('Please select your role');
        return;
      }
      if (!signupEmail.trim() || !/\S+@\S+\.\S+/.test(signupEmail)) {
        showToast('Please enter a valid email address');
        return;
      }

      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_])[A-Za-z\d\W_]{8,}$/;
      if (!passwordRegex.test(password)) {
        showToast('Password must have 8+ chars, 1 uppercase, 1 lowercase, 1 number, and 1 special char.');
        return;
      }

      if (password !== confirmPassword) {
        showToast('Passwords do not match');
        return;
      }

      setLoading(true);
      try {
        // Derive name from profile details
        const backendName = profileDetails.fullName || profileDetails.organizationName || profileDetails.institutionName || profileDetails.companyName || profileDetails.localBodyName || "New User";

        const payload = {
          name: backendName,
          email: signupEmail,
          password,
          confirmPassword,
          role: signupRole,
          profileDetails
        };
        const response = await fetch('https://sih-26-jarr.onrender.com/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Signup failed');
        
        showToast(data.message || 'OTP sent to email!');
        setSignupStep(2);
        setSignupResendTimer(60);
      } catch (err: any) {
        showToast(err.message || 'An error occurred');
      } finally {
        setLoading(false);
      }
    } else {
      if (!loginOtp || loginOtp.length !== 6 || !/^\d+$/.test(loginOtp)) {
        showToast('Please enter a valid 6-digit OTP');
        return;
      }

      setLoading(true);
      try {
        const response = await fetch('https://sih-26-jarr.onrender.com/api/auth/verify-signup-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: signupEmail, otp: loginOtp, purpose: 'SIGNUP_VERIFY' }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Verification failed');
        
        showToast('Account verified successfully!');
        switchView('login');
        setSignupStep(1);
      } catch (err: any) {
        showToast(err.message || 'An error occurred');
      } finally {
        setLoading(false);
      }
    }
  };

  const resendSignupOtp = async () => {
    if (signupResendTimer > 0) return;
    try {
      const response = await fetch('https://sih-26-jarr.onrender.com/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: signupEmail, purpose: 'SIGNUP_VERIFY' }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to resend');
      showToast('OTP Resent!');
      setSignupResendTimer(60);
    } catch (err: any) {
      showToast(err.message || 'Error resending OTP');
    }
  };

  const resendLoginOtp = async () => {
    if (loginResendTimer > 0) return;
    try {
      const response = await fetch('https://sih-26-jarr.onrender.com/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, purpose: 'LOGIN_VERIFY' }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to resend');
      showToast('OTP Resent!');
      setLoginResendTimer(60);
    } catch (err: any) {
      showToast(err.message || 'Error resending OTP');
    }
  };

  const renderRoleFields = () => {
    switch (signupRole) {
      case 'INDIVIDUAL_CITIZEN':
        return (
          <>
            <div className="role-section-tag"><User size={14} /> Citizen Details</div>
            <div className="input-pill">
              <input type="text" placeholder="Full Name" required onChange={e => handleProfileChange('fullName', e.target.value)} />
              <div className="input-icon-right"><User size={17} /></div>
            </div>
            <div className="input-pill">
              <input type="text" placeholder="District" required onChange={e => handleProfileChange('district', e.target.value)} />
              <div className="input-icon-right"><MapPin size={17} /></div>
            </div>
            <div className="input-pill">
              <input type="text" placeholder="State" required onChange={e => handleProfileChange('state', e.target.value)} />
              <div className="input-icon-right"><Map size={17} /></div>
            </div>
            <div className="input-pill">
              <input type="text" placeholder="Pincode" required onChange={e => handleProfileChange('pincode', e.target.value)} />
              <div className="input-icon-right"><Hash size={17} /></div>
            </div>
          </>
        );
      case 'NGO_COMMUNITY':
        return (
          <>
            <div className="role-section-tag"><Users size={14} /> Community / NGO / Self-Help Group</div>
            <div className="input-pill">
              <input type="text" placeholder="Organization / Group Name" required onChange={e => handleProfileChange('organizationName', e.target.value)} />
              <div className="input-icon-right"><Building size={17} /></div>
            </div>
            <div className="input-pill">
              <input type="text" placeholder="Authorized Representative Name" required onChange={e => handleProfileChange('authorizedRepresentativeName', e.target.value)} />
              <div className="input-icon-right"><UserCheck size={17} /></div>
            </div>
            <div className="input-pill">
              <input type="text" placeholder="Designation" required onChange={e => handleProfileChange('designation', e.target.value)} />
              <div className="input-icon-right"><Briefcase size={17} /></div>
            </div>
            <div className="input-pill">
              <input type="text" placeholder="Focus Area / Domains" required onChange={e => handleProfileChange('focusAreas', e.target.value)} />
              <div className="input-icon-right"><Layers size={17} /></div>
            </div>
            <div className="input-pill">
              <input type="text" placeholder="Office Address" required onChange={e => handleProfileChange('officeAddress', e.target.value)} />
              <div className="input-icon-right"><MapPin size={17} /></div>
            </div>
            <div className="input-pill">
              <input type="text" placeholder="District" required onChange={e => handleProfileChange('district', e.target.value)} />
              <div className="input-icon-right"><MapPin size={17} /></div>
            </div>
            <div className="input-pill">
              <input type="text" placeholder="State" required onChange={e => handleProfileChange('state', e.target.value)} />
              <div className="input-icon-right"><Map size={17} /></div>
            </div>
            <div className="input-pill">
              <input type="text" placeholder="Pincode" required onChange={e => handleProfileChange('pincode', e.target.value)} />
              <div className="input-icon-right"><Hash size={17} /></div>
            </div>
          </>
        );
      case 'LOCAL_BODY_PRI':
        return (
          <>
            <div className="role-section-tag"><Landmark size={14} /> Local Body / PRI / ULB</div>
            <div className="input-pill role-highlight">
              <select required onChange={e => handleProfileChange('localBodyType', e.target.value)} defaultValue="">
                <option value="" disabled>Select Local Body Type</option>
                <option value="Gram Panchayat">Gram Panchayat</option>
                <option value="Municipal Council">Municipal Council</option>
                <option value="Municipal Corporation">Municipal Corporation</option>
                <option value="Block">Block</option>
              </select>
              <div className="input-icon-right"><ChevronDown size={17} /></div>
            </div>
            <div className="input-pill">
              <input type="text" placeholder="Local Body Name" required onChange={e => handleProfileChange('localBodyName', e.target.value)} />
              <div className="input-icon-right"><Building size={17} /></div>
            </div>
            <div className="input-pill">
              <input type="text" placeholder="LGD Code" required onChange={e => handleProfileChange('lgdCode', e.target.value)} />
              <div className="input-icon-right"><FileCode size={17} /></div>
            </div>
            <div className="input-pill">
              <input type="text" placeholder="Authorized Official Name" required onChange={e => handleProfileChange('authorizedOfficialName', e.target.value)} />
              <div className="input-icon-right"><UserCheck size={17} /></div>
            </div>
            <div className="input-pill">
              <input type="text" placeholder="Official Designation" required onChange={e => handleProfileChange('officialDesignation', e.target.value)} />
              <div className="input-icon-right"><Briefcase size={17} /></div>
            </div>
            <div className="input-pill">
              <input type="text" placeholder="District & State" required onChange={e => handleProfileChange('districtState', e.target.value)} />
              <div className="input-icon-right"><Map size={17} /></div>
            </div>
            <div className="input-pill">
              <input type="text" placeholder="Pincode" required onChange={e => handleProfileChange('pincode', e.target.value)} />
              <div className="input-icon-right"><Hash size={17} /></div>
            </div>
          </>
        );
      case 'GOVT_OFFICER':
        return (
          <>
            <div className="role-section-tag"><Shield size={14} /> Government Officer Details</div>
            <div className="input-pill">
              <input type="text" placeholder="Full Name" required onChange={e => handleProfileChange('fullName', e.target.value)} />
              <div className="input-icon-right"><User size={17} /></div>
            </div>
            <div className="input-pill">
              <input type="email" placeholder="Official Gov Email (.gov.in / .nic.in)" required onChange={e => handleProfileChange('officialGovEmail', e.target.value)} />
              <div className="input-icon-right"><Mail size={17} /></div>
            </div>
            <div className="input-pill">
              <input type="text" placeholder="Employee ID / Cadre Code" required onChange={e => handleProfileChange('employeeId', e.target.value)} />
              <div className="input-icon-right"><BadgeCheck size={17} /></div>
            </div>
            <div className="input-pill">
              <input type="text" placeholder="Department & Ministry" required onChange={e => handleProfileChange('departmentMinistry', e.target.value)} />
              <div className="input-icon-right"><Building size={17} /></div>
            </div>
            <div className="input-pill">
              <input type="text" placeholder="Designation" required onChange={e => handleProfileChange('designation', e.target.value)} />
              <div className="input-icon-right"><Briefcase size={17} /></div>
            </div>
            <div className="input-pill">
              <input type="text" placeholder="Jurisdiction State" required onChange={e => handleProfileChange('jurisdictionState', e.target.value)} />
              <div className="input-icon-right"><Map size={17} /></div>
            </div>
            <div className="input-pill">
              <input type="text" placeholder="Jurisdiction District" required onChange={e => handleProfileChange('jurisdictionDistrict', e.target.value)} />
              <div className="input-icon-right"><MapPin size={17} /></div>
            </div>
          </>
        );
      case 'INSTITUTE_ADMIN':
        return (
          <>
            <div className="role-section-tag"><Home size={14} /> University / Institute Admin</div>
            <div className="input-pill">
              <input type="text" placeholder="Institution Name" required onChange={e => handleProfileChange('institutionName', e.target.value)} />
              <div className="input-icon-right"><Building size={17} /></div>
            </div>
            <div className="input-pill">
              <input type="email" placeholder="Official Institute Email" required onChange={e => handleProfileChange('officialInstituteEmail', e.target.value)} />
              <div className="input-icon-right"><Mail size={17} /></div>
            </div>
            <div className="input-pill">
              <input type="text" placeholder="AISHE Code" required onChange={e => handleProfileChange('aisheCode', e.target.value)} />
              <div className="input-icon-right"><FileCode size={17} /></div>
            </div>
            <div className="input-pill role-highlight">
              <select required onChange={e => handleProfileChange('institutionType', e.target.value)} defaultValue="">
                <option value="" disabled>Select Institution Type</option>
                <option value="Central">Central</option>
                <option value="State">State</option>
                <option value="Autonomous">Autonomous</option>
                <option value="Private">Private</option>
              </select>
              <div className="input-icon-right"><ChevronDown size={17} /></div>
            </div>
            <div className="input-pill">
              <input type="text" placeholder="Authorized Contact Person Name" required onChange={e => handleProfileChange('authorizedContactPersonName', e.target.value)} />
              <div className="input-icon-right"><UserCheck size={17} /></div>
            </div>
            <div className="input-pill">
              <input type="text" placeholder="Designation" required onChange={e => handleProfileChange('designation', e.target.value)} />
              <div className="input-icon-right"><Briefcase size={17} /></div>
            </div>
            <div className="input-pill">
              <input type="text" placeholder="Institute Website" required onChange={e => handleProfileChange('website', e.target.value)} />
              <div className="input-icon-right"><Globe size={17} /></div>
            </div>
            <div className="input-pill">
              <input type="text" placeholder="Campus City" required onChange={e => handleProfileChange('campusCity', e.target.value)} />
              <div className="input-icon-right"><MapPin size={17} /></div>
            </div>
            <div className="input-pill">
              <input type="text" placeholder="District" required onChange={e => handleProfileChange('district', e.target.value)} />
              <div className="input-icon-right"><Map size={17} /></div>
            </div>
            <div className="input-pill">
              <input type="text" placeholder="State" required onChange={e => handleProfileChange('state', e.target.value)} />
              <div className="input-icon-right"><Map size={17} /></div>
            </div>
            <div className="input-pill">
              <input type="text" placeholder="Pincode" required onChange={e => handleProfileChange('pincode', e.target.value)} />
              <div className="input-icon-right"><Hash size={17} /></div>
            </div>
          </>
        );
      case 'FACULTY_MENTOR':
        return (
          <>
            <div className="role-section-tag"><Award size={14} /> Faculty Mentor Details</div>
            <div className="input-pill">
              <input type="text" placeholder="Full Name" required onChange={e => handleProfileChange('fullName', e.target.value)} />
              <div className="input-icon-right"><User size={17} /></div>
            </div>
            <div className="input-pill">
              <input type="text" placeholder="Faculty Employee ID" required onChange={e => handleProfileChange('facultyEmployeeId', e.target.value)} />
              <div className="input-icon-right"><BadgeCheck size={17} /></div>
            </div>
            <div className="input-pill">
              <input type="text" placeholder="Associated University / College" required onChange={e => handleProfileChange('associatedInstitution', e.target.value)} />
              <div className="input-icon-right"><Building size={17} /></div>
            </div>
            <div className="input-pill">
              <input type="text" placeholder="Department" required onChange={e => handleProfileChange('department', e.target.value)} />
              <div className="input-icon-right"><Layers size={17} /></div>
            </div>
            <div className="input-pill">
              <input type="text" placeholder="Designation" required onChange={e => handleProfileChange('designation', e.target.value)} />
              <div className="input-icon-right"><Briefcase size={17} /></div>
            </div>
            <div className="input-pill">
              <input type="text" placeholder="Areas of Expertise" required onChange={e => handleProfileChange('researchDomains', e.target.value)} />
              <div className="input-icon-right"><Award size={17} /></div>
            </div>
          </>
        );
      case 'STUDENT_INNOVATOR':
        return (
          <>
            <div className="role-section-tag"><Award size={14} /> Student / Innovator Details</div>
            <div className="input-pill">
              <input type="text" placeholder="Full Name" required onChange={e => handleProfileChange('fullName', e.target.value)} />
              <div className="input-icon-right"><User size={17} /></div>
            </div>
            <div className="input-pill">
              <input type="text" placeholder="Roll Number / Student ID" required onChange={e => handleProfileChange('rollNumber', e.target.value)} />
              <div className="input-icon-right"><Hash size={17} /></div>
            </div>
            <div className="input-pill">
              <input type="text" placeholder="College / University Name" required onChange={e => handleProfileChange('collegeName', e.target.value)} />
              <div className="input-icon-right"><Building size={17} /></div>
            </div>
            <div className="input-pill">
              <input type="text" placeholder="Current Degree Program" required onChange={e => handleProfileChange('currentDegreeProgram', e.target.value)} />
              <div className="input-icon-right"><Layers size={17} /></div>
            </div>
            <div className="input-pill">
              <input type="text" placeholder="Branch / Specialization" required onChange={e => handleProfileChange('branchSpecialization', e.target.value)} />
              <div className="input-icon-right"><Layers size={17} /></div>
            </div>
            <div className="input-pill">
              <input type="text" placeholder="Graduation Year" required onChange={e => handleProfileChange('graduationYear', e.target.value)} />
              <div className="input-icon-right"><Calendar size={17} /></div>
            </div>
            <div className="input-pill">
              <input type="text" placeholder="Technical Skills" required onChange={e => handleProfileChange('technicalSkills', e.target.value)} />
              <div className="input-icon-right"><Award size={17} /></div>
            </div>
          </>
        );
      case 'INDUSTRY_PARTNER':
        return (
          <>
            <div className="role-section-tag"><Building size={14} /> Industry Partner / CSR Sponsor</div>
            <div className="input-pill">
              <input type="text" placeholder="Company / Organization Name" required onChange={e => handleProfileChange('companyName', e.target.value)} />
              <div className="input-icon-right"><Building size={17} /></div>
            </div>
            <div className="input-pill">
              <input type="text" placeholder="CIN" required onChange={e => handleProfileChange('cin', e.target.value)} />
              <div className="input-icon-right"><FileCode size={17} /></div>
            </div>
            <div className="input-pill">
              <input type="text" placeholder="PAN Number" required onChange={e => handleProfileChange('panNumber', e.target.value)} />
              <div className="input-icon-right"><Hash size={17} /></div>
            </div>
            <div className="input-pill">
              <input type="text" placeholder="Industry Sector" required onChange={e => handleProfileChange('industrySector', e.target.value)} />
              <div className="input-icon-right"><Layers size={17} /></div>
            </div>
            <div className="input-pill">
              <input type="text" placeholder="Primary SPOC Name" required onChange={e => handleProfileChange('primarySpocName', e.target.value)} />
              <div className="input-icon-right"><UserCheck size={17} /></div>
            </div>
            <div className="input-pill">
              <input type="text" placeholder="SPOC Designation" required onChange={e => handleProfileChange('spocDesignation', e.target.value)} />
              <div className="input-icon-right"><Briefcase size={17} /></div>
            </div>
            <div className="input-pill">
              <input type="text" placeholder="Company Website URL" required onChange={e => handleProfileChange('companyWebsite', e.target.value)} />
              <div className="input-icon-right"><Globe size={17} /></div>
            </div>
            <div className="input-pill">
              <input type="text" placeholder="Headquarters City & State" required onChange={e => handleProfileChange('headquarters', e.target.value)} />
              <div className="input-icon-right"><MapPin size={17} /></div>
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="auth-page-container">
      <video className="bg-video" autoPlay muted loop playsInline>
        <source src="/assets/bg.mp4" type="video/mp4" />
      </video>
      <div className="bg-overlay"></div>

      <div className="auth-card">
        <div className="form-column" id="formColumn" ref={formColumnRef}>
          <div className="form-header">
            <img src="/assets/logo.png" alt="Jharkhand Samadhan" className="brand-logo" />
            <p>Civic Innovation & Grievance Resolution Platform</p>
          </div>

          <div className="auth-slider-container">
            
            {/* LOGIN VIEW */}
            <div className={`auth-view ${view === 'login' ? 'active' : 'slide-left'}`}>
              <form className="auth-form" onSubmit={handleLoginSubmit}>
                {loginStep === 1 ? (
                  <>
                    <div className="input-pill">
                      <input 
                        type="email" 
                        placeholder="Email Address" 
                        required 
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                      />
                      <div className="input-icon-right"><Mail size={17} /></div>
                    </div>
                    <div className="input-pill">
                      <input 
                        type={showLoginPassword ? "text" : "password"} 
                        placeholder="Password" 
                        required 
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                      />
                      <div 
                        className="input-icon-right" 
                        style={{ cursor: 'pointer', pointerEvents: 'auto' }} 
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                      >
                        {showLoginPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <p style={{textAlign: 'center', fontSize: '13px', color: '#6b7280', marginBottom: '10px'}}>
                      Enter the OTP sent to {loginEmail}
                    </p>
                    <div className="input-pill">
                      <input 
                        type="text" 
                        placeholder="Enter 6-digit OTP" 
                        maxLength={6}
                        pattern="[0-9]{6}" 
                        inputMode="numeric"
                        required 
                        value={loginOtp}
                        onChange={(e) => setLoginOtp(e.target.value)}
                      />
                      <div className="input-icon-right"><Lock size={17} /></div>
                    </div>
                    <div className="options-row" style={{justifyContent: 'center', marginTop: '10px'}}>
                      <span 
                        className="link-subtle" 
                        onClick={resendLoginOtp}
                        style={{ cursor: loginResendTimer > 0 ? 'not-allowed' : 'pointer', opacity: loginResendTimer > 0 ? 0.5 : 1 }}
                      >
                        {loginResendTimer > 0 ? `Resend OTP in ${loginResendTimer}s` : 'Resend OTP'}
                      </span>
                    </div>
                  </>
                )}

                <button type="submit" className="btn-submit" disabled={loading}>
                  <span>{loading ? 'Processing...' : (loginStep === 1 ? 'Log In' : 'Verify & Log In')}</span>
                </button>
              </form>

              <div className="form-footer">
                Don't have an account? <button type="button" onClick={() => switchView('signup')}>Sign Up</button>
              </div>
            </div>

            {/* SIGN UP VIEW */}
            <div className={`auth-view ${view === 'signup' ? 'active' : 'slide-right'}`}>
              <form className="auth-form" onSubmit={handleSignUpSubmit}>
                {signupStep === 1 ? (
                  <>
                    <div className="input-pill role-highlight">
                      <select 
                        value={signupRole}
                        onChange={(e) => setSignupRole(e.target.value)} 
                        required
                      >
                        <option value="" disabled>Select Your Role</option>
                        <option value="INDIVIDUAL_CITIZEN">A. Individual Citizen</option>
                        <option value="NGO_COMMUNITY">B. Community / NGO / Self-Help Group</option>
                        <option value="LOCAL_BODY_PRI">C. Local Body / PRI / ULB</option>
                        <option value="GOVT_OFFICER">D. Government Officer / Department</option>
                        <option value="INSTITUTE_ADMIN">E. University / Institute Administrator</option>
                        <option value="FACULTY_MENTOR">F. Faculty Mentor</option>
                        <option value="STUDENT_INNOVATOR">G. Student / Innovator</option>
                        <option value="INDUSTRY_PARTNER">H. Industry Partner / CSR Sponsor</option>
                      </select>
                      <div className="input-icon-right"><ChevronDown color="#0b6e6a" size={17} /></div>
                    </div>

                    <div className="input-pill">
                      <input type="email" placeholder="Official Email Address" required value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} />
                      <div className="input-icon-right"><Mail size={17} /></div>
                    </div>

                    <div className={`role-fields-wrapper ${signupRole ? 'expanded' : ''}`}>
                      <div className="role-fields-container">
                        {renderRoleFields()}
                      </div>
                    </div>

                    <div className="input-pill">
                      <input 
                        type={showSignupPassword ? "text" : "password"} 
                        placeholder="Create password" 
                        required 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                      />
                      <div 
                        className="input-icon-right" 
                        style={{ cursor: 'pointer', pointerEvents: 'auto' }} 
                        onClick={() => setShowSignupPassword(!showSignupPassword)}
                      >
                        {showSignupPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                      </div>
                    </div>
                    
                    {password && !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_])[A-Za-z\d\W_]{8,}$/.test(password) && (
                      <div style={{ fontSize: '12px', marginTop: '-5px', marginBottom: '10px', display: 'flex', flexDirection: 'column', gap: '2px', paddingLeft: '15px' }}>
                        {password.length < 8 && <div style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '4px' }}><span>✗</span> 8+ characters</div>}
                        {!/[A-Z]/.test(password) && <div style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '4px' }}><span>✗</span> 1 uppercase letter</div>}
                        {!/[a-z]/.test(password) && <div style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '4px' }}><span>✗</span> 1 lowercase letter</div>}
                        {!/\d/.test(password) && <div style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '4px' }}><span>✗</span> 1 number</div>}
                        {!/[\W_]/.test(password) && <div style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '4px' }}><span>✗</span> 1 special character</div>}
                      </div>
                    )}


                    <div className="input-pill">
                      <input 
                        type={showConfirmPassword ? "text" : "password"} 
                        placeholder="Confirm password" 
                        required 
                        value={confirmPassword} 
                        onChange={(e) => setConfirmPassword(e.target.value)} 
                      />
                      <div 
                        className="input-icon-right" 
                        style={{ cursor: 'pointer', pointerEvents: 'auto' }} 
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <p style={{textAlign: 'center', fontSize: '13px', color: '#6b7280', marginBottom: '10px'}}>
                      Enter the OTP sent to {signupEmail}
                    </p>
                    <div className="input-pill">
                      <input 
                        type="text" 
                        placeholder="Enter 6-digit OTP" 
                        maxLength={6}
                        required 
                        value={loginOtp}
                        onChange={(e) => setLoginOtp(e.target.value)}
                      />
                      <div className="input-icon-right"><Lock size={17} /></div>
                    </div>
                    <div className="options-row" style={{justifyContent: 'center', marginTop: '10px'}}>
                      <span 
                        className="link-subtle" 
                        onClick={resendSignupOtp}
                        style={{ cursor: signupResendTimer > 0 ? 'not-allowed' : 'pointer', opacity: signupResendTimer > 0 ? 0.5 : 1 }}
                      >
                        {signupResendTimer > 0 ? `Resend OTP in ${signupResendTimer}s` : 'Resend OTP'}
                      </span>
                    </div>
                  </>
                )}

                <button type="submit" className="btn-submit" disabled={loading}>
                  <span>{loading ? 'Processing...' : (signupStep === 1 ? 'Create Account' : 'Verify & Create Account')}</span>
                </button>
              </form>

              <div className="form-footer">
                Already have an account? <button type="button" onClick={() => switchView('login')}>Log In</button>
              </div>
            </div>

          </div>
        </div>

        <div className="image-column">
          <img src="/assets/RightImage.png" alt="Jharkhand Samadhan Campus" className="hero-img" />
        </div>
      </div>

      <div className={`toast ${toast.show ? 'show' : ''}`}>
        <Check color="#10b981" size={18} />
        <span>{toast.msg}</span>
      </div>
    </div>
  );
};

export default Auth;
