import { useLocation } from "react-router-dom";

export default function ScanEnter({ children }) {
  const { pathname } = useLocation();
  return (
    <div key={pathname} className="scan-enter">
      {children}
    </div>
  );
}
