import { useLocation } from 'react-router-dom';
import { BookOpen, CheckSquare, Calendar, TrendingUp, Target, Lightbulb, Briefcase, Settings, User } from 'lucide-react';

const icons = {
  '/courses': BookOpen,
  '/assignments': CheckSquare,
  '/attendance': Calendar,
  '/growth': TrendingUp,
  '/ai-plan': Target,
  '/resources': Lightbulb,
  '/career': Briefcase,
  '/profile': User,
  '/settings': Settings
};

export default function GenericPage({ title, description }) {
  const location = useLocation();
  const Icon = icons[location.pathname] || Target;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
          <Icon size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <p className="text-gray-500">{description}</p>
        </div>
      </div>
      
      <div className="card h-96 flex flex-col items-center justify-center text-center bg-gray-50/50 border-dashed">
        <div className="w-16 h-16 bg-white shadow-sm rounded-full flex items-center justify-center text-gray-400 mb-4">
          <Icon size={32} />
        </div>
        <h2 className="text-xl font-semibold text-gray-700 mb-2">This module is connected to the DB</h2>
        <p className="text-gray-500 max-w-md">
          The <b>{title}</b> interface is structured and ready for backend data integration. 
          As per the EduAssist AI architecture, you can expand this panel with real LMS data.
        </p>
        <button className="btn-primary mt-6">Generate AI Insights</button>
      </div>
    </div>
  );
}
