import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Unauthorized() {
  const { user } = useAuth();
  const targetDashboard = user?.role ? `/${user.role}-dashboard` : '/login';

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200/80 rounded-2xl max-w-md w-full text-center p-8 shadow-lg">
        <div className="w-14 h-14 rounded-full bg-rose-900 text-white flex items-center justify-center mx-auto mb-4 shadow-xs">
          <ShieldAlert size={28} />
        </div>

        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200 mb-2 inline-block">Security Boundary (403)</span>

        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Access Restricted
        </h1>

        <p className="text-sm font-medium text-slate-500 mt-2 leading-relaxed">
          You do not have permission to access this page. This area is reserved for authorized institutional roles.
        </p>

        {user && (
          <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 font-medium">
            Currently authenticated as <strong className="text-slate-900 font-mono">{user.reg_number}</strong> ({user.role} role).
          </div>
        )}

        <div className="mt-6">
          <Link
            to={targetDashboard}
            replace
            className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors w-full text-sm"
          >
            <ArrowLeft size={16} />
            <span>Return to My Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
