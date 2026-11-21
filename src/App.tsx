import { Component, useEffect, type ReactNode } from 'react';
import TopBar from './components/TopBar';
import Sidebar from './components/Sidebar';
import RightPanel from './components/RightPanel';
import BottomBar from './components/BottomBar';
import WorldCanvas from './three/WorldCanvas';
import { useWorld } from './store';

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; msg: string }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, msg: '' };
  }
  static getDerivedStateFromError(err: Error) {
    return { hasError: true, msg: err.message };
  }
  componentDidCatch(err: Error) {
    console.error('WorldCanvas error:', err);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-slate-100 text-slate-700 p-6 text-center">
          <div className="text-lg font-bold">Dunia 3D gagal dimuat</div>
          <div className="text-sm">{this.state.msg}</div>
          <button onClick={() => window.location.reload()} className="px-4 py-2 rounded-lg bg-sky-500 text-white text-sm font-semibold">
            Muat ulang
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const tick = useWorld((s) => s.tick);

  useEffect(() => {
    document.title = 'AI Agent Living World 3D';
    const id = setInterval(() => tick(), 1000);
    return () => clearInterval(id);
  }, [tick]);

  return (
    <div className="h-full flex flex-col">
      <TopBar />
      <div className="flex-1 flex flex-col md:flex-row min-h-0">
        <Sidebar />
        <main className="flex-1 relative min-w-0 min-h-[45vh] md:min-h-0">
          <ErrorBoundary>
            <WorldCanvas />
          </ErrorBoundary>
          <BottomBar />
        </main>
        <RightPanel />
      </div>
    </div>
  );
}
