export default function Loading() {
    return (
      <div className="fixed inset-0 bg-cyber-dark/90 flex items-center justify-center">
        <div className="text-cyber-primary text-2xl">
          <div className="animate-pulse">Securing Connection...</div>
          <div className="mt-4 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyber-primary"></div>
          </div>
        </div>
      </div>
    );
  }