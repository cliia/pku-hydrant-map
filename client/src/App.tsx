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

        <footer className="mt-4 border-t border-slate-200 pt-4 text-center text-xs text-slate-500">
          <p>
            Code licensed under <a href="https://opensource.org/licenses/MIT" target="_blank" rel="noreferrer" className="underline hover:text-slate-700">MIT</a>.
            Assets licensed under <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer" className="underline hover:text-slate-700">CC BY 4.0</a>.
          </p>
          <div className="mt-2 mx-auto max-w-2xl space-y-1">
            <p className="font-medium text-rose-600">
              免责声明：本项目仅供课程学习交流，数据非官方发布，可能存在误差。
            </p>
            <p>
              紧急情况下请务必以现场实际标识和官方指引为准，切勿仅依赖本图。
            </p>
            <p className="text-slate-400">
              （地图底图来源于网络）
            </p>
          </div>
        </footer>

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
