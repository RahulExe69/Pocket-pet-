import React, { Component, ErrorInfo, ReactNode } from 'react';
import { clearSavedPet } from '../utils/storage';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Pocket Pet ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  private handleReset = () => {
    clearSavedPet();
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-screen bg-stone-900 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 text-center shadow-2xl border-2 border-amber-300">
            <div className="w-20 h-20 mx-auto mb-3 bg-amber-100 rounded-2xl overflow-hidden border-2 border-amber-300 shadow-md flex items-center justify-center">
              <img
                src="/pocket_pet_icon.png"
                alt="Pocket Pet"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>

            <h2 className="font-bubble text-xl font-bold text-stone-800">
              Pocket Pet Needs a Hug!
            </h2>
            <p className="text-xs text-stone-500 mt-2 leading-relaxed">
              Your pet encountered a tiny hiccup. Tap reload to jump right back in!
            </p>

            {this.state.error && (
              <div className="my-3 p-2 bg-stone-50 rounded-xl border border-stone-200 text-[11px] text-stone-500 font-mono text-left max-h-24 overflow-y-auto">
                {this.state.error.message || 'Unexpected error'}
              </div>
            )}

            <div className="flex flex-col gap-2 mt-4">
              <button
                id="btn-error-recover"
                onClick={this.handleReload}
                className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bubble text-sm font-bold rounded-xl shadow-md transition-transform active:scale-95"
              >
                Reload Game ✨
              </button>

              <button
                id="btn-error-reset"
                onClick={this.handleReset}
                className="w-full py-2 bg-stone-100 hover:bg-stone-200 text-stone-600 font-bubble text-xs font-semibold rounded-xl transition-colors"
              >
                Reset Saved State & Restart
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
