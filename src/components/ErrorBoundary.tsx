import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertOctagon, RotateCcw } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an unhandled crash:", error, errorInfo);
  }

  private handleReset = () => {
    // Attempt crash recovery by reloading state cleanly
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div
          className="min-h-screen bg-[#020204] text-white flex flex-col items-center justify-center p-6 text-center"
          dir="rtl"
        >
          <div className="bg-white/5 border border-white/10 p-8 rounded-3xl max-w-md w-full backdrop-blur-xl shadow-2xl flex flex-col items-center gap-5">
            <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl flex items-center justify-center animate-pulse">
              <AlertOctagon size={32} />
            </div>

            <div className="flex flex-col gap-2">
              <h2 className="text-xl font-extrabold tracking-tight">حدث خطأ غير متوقع</h2>
              <p className="text-xs text-gray-400 leading-relaxed">
                نأسف لوجود هذا الخلل. قد يكون هناك مشكلة في قراءة أحد الملفات الصوتية أو مساحة تخزين المتصفح المحلية (IndexedDB).
              </p>
            </div>

            {this.state.error && (
              <div className="w-full bg-black/40 border border-white/5 p-3 rounded-xl text-left font-mono text-[10px] text-red-400 overflow-x-auto max-h-24">
                {this.state.error.toString()}
              </div>
            )}

            <button
              onClick={this.handleReset}
              className="w-full flex items-center justify-center gap-2 bg-[#1ed760] text-black hover:brightness-110 active:scale-95 transition-all text-sm font-bold py-3 rounded-2xl shadow-lg shadow-[#1ed760]/10"
            >
              <RotateCcw size={16} />
              <span>إعادة تشغيل وتحديث التطبيق</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
export default ErrorBoundary;
