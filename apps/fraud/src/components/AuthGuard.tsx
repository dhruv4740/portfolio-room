import { Navigate, Outlet } from 'react-router-dom';
import { useAuthState, auth } from '../firebase/firebase';
import Loading from './Loading';

export default function AuthGuard() {
  const [user, loading] = useAuthState(auth);

  if (loading) return <Loading />;
  if (!user) return <Navigate to="/login" replace />;
  
  return <Outlet />;
}
