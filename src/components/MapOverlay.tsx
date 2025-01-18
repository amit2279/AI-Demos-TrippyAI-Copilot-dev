interface MapOverlayProps {
  isLoading?: boolean;
}

export const MapOverlay: React.FC<MapOverlayProps> = ({ isLoading = false }) => {
  if (!isLoading) return null;

  return (
    <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-20 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
        <p className="text-sm text-gray-600 font-medium">Discovering locations...</p>
      </div>
    </div>
  );
};