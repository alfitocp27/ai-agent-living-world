import { Component, useEffect, useState, type ReactNode } from 'react';
import TopBar from './components/TopBar';
import Sidebar from './components/Sidebar';
import RightPanel from './components/RightPanel';
import BottomBar from './components/BottomBar';
import ChatPanel from './components/ChatPanel';
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
  const agents = useWorld((s) => s.agents);

  // Panel Chat/Tugaskan mengambang — state lokal App (bukan store).
  // Menutup panel kembali ke profil agent (nav agents + selectedAgentId tetap).
  const [chatAgentId, setChatAgentId] = useState<string | null>(null);
  const [chatTab, setChatTab] = useState<'chat' | 'assign'>('chat');
  // Laporan yang diminta dibuka dari lonceng TopBar (nav results).
  const [openReportId, setOpenReportId] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'AI Agent Living World 3D';
    const id = setInterval(() => tick(), 1000);
    return () => clearInterval(id);
  }, [tick]);

  const chatAgent = agents.find((a) => a.id === chatAgentId) ?? null;

  const openChat = (agentId: string, tab: 'chat' | 'assign') => {
    setChatAgentId(agentId);
    setChatTab(tab);
  };

  return (
    <div className="h-full flex flex-col">
      <TopBar onOpenReport={(id) => setOpenReportId(id)} />
      <div className="flex-1 flex min-h-0">
        <Sidebar />
        <main className="flex-1 relative min-w-0 min-h-[45vh] md:min-h-0">
          <ErrorBoundary>
            <WorldCanvas />
          </ErrorBoundary>
          <BottomBar />
          {chatAgent && (
            <ChatPanel
              agent={chatAgent}
              initialTab={chatTab}
              onClose={() => setChatAgentId(null)}
            />
          )}
        </main>
        <RightPanel
          onOpenChat={openChat}
          openReportId={openReportId}
          onOpenReportUsed={() => setOpenReportId(null)}
        />
      </div>
      {/* ruang untuk bottom nav mobile */}
      <div className="md:hidden h-14 shrink-0" aria-hidden />
    </div>
  );
}
