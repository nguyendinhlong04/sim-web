export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="mx-auto w-full">{children}</div>;
}
