import { useCurrentTime } from '../useCurrentTime';

export default function Home() {
  const { data, loading, error } = useCurrentTime();
  return (
    <section className="rounded-lg bg-white p-8 shadow">
      <h2 className="text-2xl font-semibold text-slate-900">Server time</h2>
      <div className="mt-4">
        {loading && <p className="text-slate-500">Loading…</p>}
        {error && <p className="text-red-600">{error.message}</p>}
        {data && <p className="font-mono text-slate-800">{data.currentTime}</p>}
      </div>
    </section>
  );
}
