import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login           from './pages/auth/Login.jsx';
import Signup          from './pages/auth/Signup';
import Dashboard       from './pages/employee/Dashboard';
import SubmitExpense   from './pages/employee/SubmitExpense';
import ApprovalQueue   from './pages/manager/ApprovalQueue';
import AdminPanel      from './pages/admin/AdminPanel';
import ApprovalRules   from './pages/admin/ApprovalRules';

function Guard({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user)   return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

function Home() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'ADMIN')   return <Navigate to="/admin" replace />;
  if (user.role === 'MANAGER') return <Navigate to="/approvals" replace />;
  return <Navigate to="/expenses" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/"            element={<Home />} />
          <Route path="/login"       element={<Login />} />
          <Route path="/signup"      element={<Signup />} />
          <Route path="/expenses"    element={<Guard><Dashboard /></Guard>} />
          <Route path="/expenses/new"element={<Guard><SubmitExpense /></Guard>} />
          <Route path="/approvals"   element={<Guard roles={['MANAGER','ADMIN']}><ApprovalQueue /></Guard>} />
          <Route path="/admin"       element={<Guard roles={['ADMIN']}><AdminPanel /></Guard>} />
          <Route path="/admin/rules" element={<Guard roles={['ADMIN']}><ApprovalRules /></Guard>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}