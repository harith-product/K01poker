interface ToastProps {
  message: { text: string; type: 'success' | 'error' } | null;
}

export function Toast({ message }: ToastProps) {
  if (!message) return null;
  return (
    <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-[70] px-5 py-3 rounded-2xl shadow-lg text-white text-sm font-medium transition-all whitespace-nowrap ${
      message.type === 'success' ? 'bg-green-600' : 'bg-red-500'
    }`}>
      {message.text}
    </div>
  );
}
