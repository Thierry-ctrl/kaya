// Use the simple class component in App.tsx instead
export function ErrorBoundary({ children }: { children: React.ReactNode, resetKey: any }) {
  return <>{children}</>;
}
