import { signInWithPopup, auth, googleProvider, useAuthState } from "../firebase/firebase";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

export default function GoogleLoginButton() {
  const [user] = useAuthState(auth);
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Google login error:", error);
    }
  };

  useEffect(() => {
    if (user) navigate("/dashboard");
  }, [user, navigate]);

  return (
    <button 
      onClick={handleLogin}
      className="w-full flex items-center justify-center gap-3 bg-white text-cyber-dark py-3 rounded-lg hover:bg-gray-100 transition"
    >
      {/* Google SVG remains same */}
      Continue with Google
    </button>
  );
}
