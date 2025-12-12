import { useEffect, useMemo, useState } from 'react';
import MapContainer from './components/MapContainer';
import { Hydrant, Mode } from './types';

const API_BASE = import.meta.env.VITE_API_BASE ?? '';

export default function App() {
  const [mode, setMode] = useState<Mode>('view');
  const [hydrants, setHydrants] = useState<Hydrant[]>([]);
  const [loading, setLoading] = useState(false);
  const [pendingCoord, setPendingCoord] = useState<[number, number] | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<Hydrant | null>(null);

  const fetchHydrants = useMemo(
    () =>
      async function load() {
        setLoading(true);
        try {
          const res = await fetch(`${API_BASE}/api/hydrants`);
          const data = (await res.json()) as Hydrant[];
          setHydrants(data);
        } catch (err) {
          console.error(err);
          setError('无法加载数据，请检查后端是否启动');
        } finally {
          setLoading(false);
        }
      },
    []
  );

  useEffect(() => {
    fetchHydrants();
  }, [fetchHydrants]);

  const handleAddRequest = (coords: [number, number]) => {
    if (mode === 'edit') {
      setPendingCoord(coords);
      setFile(null);
    }
  };

  const handleSubmit = async () => {
    if (!pendingCoord || !file) return;
    setSubmitting(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('y_coord', pendingCoord[0].toString());
      fd.append('x_coord', pendingCoord[1].toString());
      fd.append('photo', file);
      const res = await fetch(`${API_BASE}/api/hydrants`, { method: 'POST', body: fd });
      if (!res.ok) throw new Error('上传失败');
      const created = (await res.json()) as Hydrant;
      setHydrants((prev: Hydrant[]) => [created, ...prev]);
      setPendingCoord(null);
      setFile(null);
    } catch (err) {
      console.error(err);
      setError('上传失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    const ok = window.confirm('确认删除这个消防栓吗？');
    if (!ok) return;
    try {
      await fetch(`${API_BASE}/api/hydrants/${id}`, { method: 'DELETE' });
      setHydrants((prev: Hydrant[]) => prev.filter((h) => h.id !== id));
    } catch (err) {
      console.error(err);
      setError('删除失败');
    }
  };

  const handleMove = async (id: number, coords: [number, number]) => {
    const [y, x] = coords;
    const prevList = hydrants;
    setHydrants((prev: Hydrant[]) => prev.map((h) => (h.id === id ? { ...h, y_coord: y, x_coord: x } : h)));
    try {
      const res = await fetch(`${API_BASE}/api/hydrants/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ y_coord: y, x_coord: x })
      });
      if (!res.ok) throw new Error('update failed');
    } catch (err) {
      console.error(err);
      setError('更新坐标失败');
      setHydrants(prevList);
    }
  };

  return (
    <div className="min-h-screen bg-white p-6 text-slate-900">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">PKU Hydrant Map</h1>
            <p className="text-sm text-slate-600">北京大学地下消防栓地图</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600 shadow-sm">
              当前模式：{mode === 'view' ? '浏览 / Viewer' : '编辑 / Admin'}
            </div>
            <button
              onClick={() => setMode((m) => (m === 'view' ? 'edit' : 'view'))}
              className="glass-card flex items-center gap-2 rounded-full px-4 py-2 text-sm shadow-glass transition hover:shadow-md"
            >
              <span className="inline-flex h-3 w-3 rounded-full bg-accent"></span>
              {mode === 'view' ? '切换到编辑模式' : '返回浏览模式'}
            </button>
            {loading && <span className="text-xs text-slate-500">加载中...</span>}
          </div>
        </header>

        <div className="relative rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
          <div className="h-[85vh] w-full rounded-xl overflow-hidden">
            <MapContainer
              hydrants={hydrants}
              mode={mode}
              onAddRequest={handleAddRequest}
              onDelete={handleDelete}
              onPreview={(h: Hydrant) => setPreview(h)}
              onMove={handleMove}
            />
          </div>
          {error && <div className="absolute left-4 top-4 rounded-lg bg-rose-100 px-3 py-2 text-xs text-rose-700 shadow-sm">{error}</div>}
        </div>

        {pendingCoord && (
          <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/60">
            <div className="glass-card w-full max-w-md rounded-2xl p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">新增消防栓</h3>
                <button onClick={() => setPendingCoord(null)} className="text-sm text-slate-500 hover:text-slate-700">
                  关闭
                </button>
              </div>
              <div className="space-y-3 text-sm text-slate-700">
                <div>坐标 (y, x)：{pendingCoord[0].toFixed(2)}, {pendingCoord[1].toFixed(2)}</div>
                <label className="block">
                  <span className="text-xs text-slate-500">上传实拍照片</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                  />
                </label>
                <div className="flex gap-2 pt-2">
                  <button
                    disabled={!file || submitting}
                    onClick={handleSubmit}
                    className="flex-1 rounded-lg bg-accent px-3 py-2 font-semibold text-slate-900 shadow hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {submitting ? '上传中...' : '保存'}
                  </button>
                  <button
                    onClick={() => setPendingCoord(null)}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-slate-700 hover:bg-slate-100"
                  >
                    取消
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

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
