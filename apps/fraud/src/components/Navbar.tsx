import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthState, auth } from "../firebase/firebase";
import { 
  ShieldAlert, 
  LayoutDashboard, 
  Settings,
  User,
  Menu,
  X
} from 'lucide-react';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [user] = useAuthState(auth);

  // Define navigation items
  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { name: 'Settings', path: '/settings', icon: <Settings className="w-5 h-5" /> },
  ];

  // Logout handler
  const handleLogout = () => {
    auth.signOut();
  };

  return (
    <nav className="bg-gray-900 border-b border-cyber-primary/20 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <ShieldAlert className="text-cyber-primary w-7 h-7 transition-transform group-hover:scale-110" />
            <span className="text-xl font-bold text-cyber-primary glow">FraudShield</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className="flex items-center gap-2 text-gray-300 hover:text-cyber-primary transition-colors group"
              >
                {item.icon}
                <span className="group-hover:glow">{item.name}</span>
              </Link>
            ))}
          </div>

          {/* Auth Section */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-2 text-gray-300 hover:text-cyber-primary transition-colors focus:outline-none"
                >
                  <User className="w-5 h-5" />
                  <span>Account</span>
                </button>
                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-lg border border-cyber-primary/20">
                    <div className="p-2">
                      <Link
                        to="/profile"
                        className="block px-4 py-2 text-gray-300 hover:bg-gray-700 rounded-md"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        Profile
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-cyber-alert hover:bg-gray-700 rounded-md"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex gap-4">
                <Link
                  to="/login"
                  className="px-4 py-2 text-cyber-primary border border-cyber-primary/20 rounded-lg hover:bg-cyber-primary/10 transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="px-4 py-2 bg-cyber-primary text-cyber-dark rounded-lg hover:bg-cyber-primary/90 transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden text-gray-300 hover:text-cyber-primary focus:outline-none"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden absolute top-16 inset-x-0 bg-gray-900 border-b border-cyber-primary/20">
            <div className="px-4 py-4 space-y-4">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  className="flex items-center gap-3 px-4 py-2 text-gray-300 hover:text-cyber-primary hover:bg-gray-800 rounded-lg"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.icon}
                  <span>{item.name}</span>
                </Link>
              ))}
              <div className="pt-4 border-t border-cyber-primary/20">
                {user ? (
                  <div className="space-y-2">
                    <Link
                      to="/profile"
                      className="flex items-center gap-3 px-4 py-2 text-gray-300 hover:text-cyber-primary hover:bg-gray-800 rounded-lg"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <User className="w-5 h-5" />
                      <span>Profile</span>
                    </Link>
                    <button
                      onClick={() => {
                        handleLogout();
                        setIsMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-cyber-alert hover:bg-gray-800 rounded-lg"
                    >
                      Logout
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <Link
                      to="/login"
                      className="col-span-1 text-center px-4 py-2 text-cyber-primary border border-cyber-primary/20 rounded-lg hover:bg-cyber-primary/10"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Login
                    </Link>
                    <Link
                      to="/signup"
                      className="col-span-1 text-center px-4 py-2 bg-cyber-primary text-cyber-dark rounded-lg hover:bg-cyber-primary/90"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Sign Up
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
