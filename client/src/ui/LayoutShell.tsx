import { Link, useLocation } from 'react-router-dom';

const nav = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/patients', label: 'Patients' },
  { to: '/visits', label: 'Visits' },
  { to: '/lab-work', label: 'Lab Work' },
  { to: '/options', label: 'Options' },
];

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const loc = useLocation();
  return (
    <div className="min-h-screen flex bg-gray-100 text-gray-800">
      <aside className="w-56 bg-white border-r flex flex-col">
        <div className="p-4 font-semibold text-lg">Dental App</div>
        <nav className="flex-1 space-y-1 px-2">
          {nav.map(item => {
            const active = loc.pathname === item.to || (item.to !== '/dashboard' && loc.pathname.startsWith(item.to));
            return (
              <Link key={item.to} to={item.to} className={`block px-3 py-2 rounded text-sm font-medium ${active ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}>{item.label}</Link>
            );
          })}
        </nav>
      </aside>
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
