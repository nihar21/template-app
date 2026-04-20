import { Link, NavLink, Route, Routes } from 'react-router-dom';
import Home from './routes/Home';
import About from './routes/About';
import { useCurrentUser } from './auth/useCurrentUser';

export default function App() {
  const { user, loading } = useCurrentUser();

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    isActive
      ? 'text-slate-900 font-medium underline underline-offset-4'
      : 'text-slate-600 hover:text-slate-900';

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link to="/" className="text-lg font-semibold text-slate-900">
            TemplateApp
          </Link>
          <nav className="flex items-center gap-6 text-sm">
            <NavLink to="/" end className={linkClass}>
              Home
            </NavLink>
            <NavLink to="/about" className={linkClass}>
              About
            </NavLink>
            <span className="text-slate-500">
              {loading
                ? '…'
                : user
                  ? `Signed in as ${user.name}`
                  : 'Not signed in'}
            </span>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-10">
        <Routes>
          <Route index element={<Home />} />
          <Route path="about" element={<About />} />
        </Routes>
      </main>
    </div>
  );
}
