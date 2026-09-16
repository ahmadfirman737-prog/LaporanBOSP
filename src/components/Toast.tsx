import React from "react";
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from "lucide-react";
import { ToastNotification } from "../types";

interface ToastProps {
  toasts: ToastNotification[];
  onDismiss: (id: number) => void;
}

export const Toast: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col space-y-2 no-print max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        let bg = "bg-slate-900 text-white";
        let Icon = Info;

        if (toast.type === "success") {
          bg = "bg-emerald-600 text-white shadow-emerald-600/30";
          Icon = CheckCircle;
        } else if (toast.type === "error") {
          bg = "bg-rose-600 text-white shadow-rose-600/30";
          Icon = AlertCircle;
        } else if (toast.type === "warning") {
          bg = "bg-amber-600 text-white shadow-amber-600/30";
          Icon = AlertTriangle;
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between p-4 rounded-2xl shadow-xl text-xs font-semibold transform transition-all duration-300 animate-in fade-in slide-in-from-bottom-5 ${bg}`}
          >
            <div className="flex items-center space-x-3">
              <Icon className="w-5 h-5 shrink-0" />
              <span>{toast.message}</span>
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              className="p-1 hover:bg-white/20 rounded-lg transition ml-2 shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
