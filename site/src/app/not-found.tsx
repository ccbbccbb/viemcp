export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center text-center p-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold font-title">Page not found</h1>
        <p className="text-[--viem-text-muted]">
          The page you are looking for does not exist.
        </p>
      </div>
    </main>
  )
}
