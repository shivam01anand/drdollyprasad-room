/** each page fades softly in as it arrives (CSS only; still for reduced motion) */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-in">{children}</div>;
}
