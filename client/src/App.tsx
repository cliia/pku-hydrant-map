import { useEffect, useMemo, useState } from 'react';
import MapContainer from './components/MapContainer';
import { Hydrant } from './types';

export default function App() {
  const [hydrants, setHydrants] = useState<Hydrant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<Hydrant | null>(null);

  const dataUrl = useMemo(() => {
    const basePath = import.meta.env.BASE_URL || '/';
    const absBase = new URL(basePath, window.location.origin).toString();
    return new URL('data.json', absBase).toString();
  }, []);

  const assetBase = useMemo(() => {
    const basePath = import.meta.env.BASE_URL || '/';
    return new URL(basePath, window.location.origin).toString();
  }, []);

  const fetchHydrants = useMemo(
    () =>
      async function load() {
        setLoading(true);
        try {
          const res = await fetch(dataUrl);
          const data = (await res.json()) as Hydrant[];
          const withBase = data.map((h) => {
            const normalize = (p: string) => new URL(p.replace(/^\//, ''), assetBase).toString();
            return {
              ...h,
              image_large_path: normalize(h.image_large_path),
              image_thumb_path: normalize(h.image_thumb_path)
            };
          });
          setHydrants(withBase);
        } catch (err) {
          console.error(err);
          setError('无法加载数据，请确认 data.json 是否存在');
        } finally {
          setLoading(false);
        }
      },
    [dataUrl]
  );

  useEffect(() => {
    fetchHydrants();
  }, [fetchHydrants]);

  const handlePreview = (h: Hydrant) => setPreview(h);

  return (
    <div className="min-h-screen bg-white p-6 text-slate-900">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">PKU Hydrant Map</h1>
            <p className="text-sm text-slate-600">北京大学部分地下消防栓和消防水泵接合器地图</p>
          </div>
          <div className="flex items-center gap-3">
            {loading && <span className="text-xs text-slate-500">加载中...</span>}
          </div>
        </header>

        <div className="relative rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
          <div className="h-[85vh] w-full rounded-xl overflow-hidden">
            <MapContainer
              hydrants={hydrants}
              onPreview={handlePreview}
            />
          </div>
          {error && <div className="absolute left-4 top-4 rounded-lg bg-rose-100 px-3 py-2 text-xs text-rose-700 shadow-sm">{error}</div>}
        </div>

        {preview && (
          <div
            className="fixed inset-0 z-[1300] flex items-center justify-center bg-black/80 p-4"
            onClick={() => setPreview(null)}
          >
            <img
              src={preview.image_large_path}
              alt="Hydrant"
              className="max-h-[90vh] max-w-[90vw] rounded-2xl shadow-2xl"
            />
          </div>
        )}
      </div>
    </div>
  );
}
