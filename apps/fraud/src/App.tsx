// src/App.tsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { auth, useAuthState } from './firebase/firebase';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Profile from './pages/Profile';
import AuthGuard from './components/AuthGuard';
import Loading from './components/Loading';
import Navbar from './components/Navbar';


export default function App() {
  const [user, loading] = useAuthState(auth);

  if (loading) return <Loading />;

  return (
    <Router basename="/apps/fraud">
      <div className="min-h-screen flex flex-col bg-cyber-dark text-gray-100">
        <Navbar />
        <main className="flex-1">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* Protected Routes */}
            <Route element={<AuthGuard />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/profile" element={<Profile />} />
            </Route>

            {/* Redirects */}
            <Route path="*" element={
              user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
            } />
          </Routes>
        </main>

      </div>
    </Router>
  );
}
