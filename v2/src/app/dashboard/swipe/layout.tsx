// Swipe page uses its own full-screen layout without header/nav
export default function SwipeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
