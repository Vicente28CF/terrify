export default function Loading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-sand border-t-coral" />
        <p className="text-sm font-medium text-stone">Cargando...</p>
      </div>
    </div>
  );
}