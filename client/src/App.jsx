import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import StudentDashboard from './pages/StudentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import AdminUsers from './pages/AdminUsers';
import MyCourses from './pages/MyCourses';
import Assignments from './pages/Assignments';
import AIStudyPlan from './pages/AIStudyPlan';
import Resources from './pages/Resources';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Unauthorized from './pages/Unauthorized';
import Layout from './components/Layout';
import LoadingSpinner from './components/LoadingSpinner';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <LoadingSpinner text="Authenticating credentials..." />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles) {
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    if (!roles.includes(user.role)) {
      return <Navigate to={user.role === 'admin' ? "/admin-dashboard" : "/student-dashboard"} replace />;
    }
  }

  return children;
};

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <LoadingSpinner text="Connecting to university LMS..." />
      </div>
    );
  }
  
  return (
    <Routes>
      <Route 
        path="/login" 
        element={!user ? <Login /> : <Navigate to={user.role === 'admin' ? "/admin-dashboard" : "/student-dashboard"} replace />} 
      />

      <Route path="/unauthorized" element={<Unauthorized />} />
      
      <Route path="/" element={<Layout />}>
        {/* Redirect root to appropriate dashboard */}
        <Route index element={<Navigate to={user?.role === 'admin' ? "/admin-dashboard" : (user ? "/student-dashboard" : "/login")} replace />} />
        
        {/* Student Routes */}
        <Route path="student-dashboard" element={
          <ProtectedRoute allowedRoles={['student']}><StudentDashboard /></ProtectedRoute>
        } />
        <Route path="courses" element={
          <ProtectedRoute allowedRoles={['student']}><MyCourses /></ProtectedRoute>
        } />
        <Route path="assignments" element={
          <ProtectedRoute allowedRoles={['student']}><Assignments /></ProtectedRoute>
        } />
        <Route path="ai-plan" element={
          <ProtectedRoute allowedRoles={['student']}><AIStudyPlan /></ProtectedRoute>
        } />
        <Route path="resources" element={
          <ProtectedRoute allowedRoles={['student']}><Resources /></ProtectedRoute>
        } />

        {/* Deprecated routes redirected to student dashboard */}
        <Route path="attendance" element={<Navigate to="/student-dashboard" replace />} />
        <Route path="growth" element={<Navigate to="/student-dashboard" replace />} />
        <Route path="career" element={<Navigate to="/student-dashboard" replace />} />

        {/* Admin Routes */}
        <Route path="admin-dashboard" element={
          <ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>
        } />
        <Route path="admin-users" element={
          <ProtectedRoute allowedRoles={['admin']}><AdminUsers /></ProtectedRoute>
        } />

        {/* Shared Authenticated Routes */}
        <Route path="profile" element={
          <ProtectedRoute allowedRoles={['student', 'admin']}><Profile /></ProtectedRoute>
        } />
        <Route path="settings" element={
          <ProtectedRoute allowedRoles={['student', 'admin']}><Settings /></ProtectedRoute>
        } />

        {/* Default route handles redirect based on user role */}
        <Route path="*" element={<Navigate to={user ? `/${user.role}-dashboard` : "/login"} replace />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}
