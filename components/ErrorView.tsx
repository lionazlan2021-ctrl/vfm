export default function ErrorView({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="text-center py-20 px-8" style={{ animation: "fadeUp .4s ease" }}>
      <div className="text-[40px] mb-3.5">⚠️</div>
      <div className="font-semibold mb-1.5" style={{ color: "#ddeede" }}>
        Search failed
      </div>
      <div className="text-[13px] mb-5.5 max-w-[380px] mx-auto" style={{ color: "#3d5542" }}>
        {message}
      </div>
      <button onClick={onRetry} className="btn-jade">
        Try Again
      </button>
    </div>
  );
}
