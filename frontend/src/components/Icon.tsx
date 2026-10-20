export default function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const paths: Record<string, React.ReactNode> = {
    ball: <><circle cx="12" cy="12" r="9"/><path d="M3 12h6m6 0h6"/><circle cx="12" cy="12" r="3"/></>,
    users: <><circle cx="9" cy="7" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3M17 4a3 3 0 0 1 0 6m1 4a5 5 0 0 1 3 5v2"/></>,
    chart: <path d="M4 20V12m8 8V4m8 16v-12"/>,
    target: <><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><path d="m12 12 9-9"/></>,
    settings: <><path d="m9 3-1 3-3 1-2 4 2 3v4l4 1 3 2 3-2 4-1v-4l2-3-2-4-3-1-1-3Z"/><circle cx="12" cy="12" r="3"/></>,
    search: <><circle cx="10" cy="10" r="6"/><path d="m15 15 5 5"/></>,
    chevron: <path d="m9 5 7 7-7 7"/>,
    moon: <path d="M20 14a9 9 0 0 1-10-11 9 9 0 1 0 10 11Z"/>,
    trend: <path d="m3 17 6-6 4 4 8-10m-6 0h6v6"/>,
    heart: <path d="M20 5c-3-3-6 0-8 2C10 5 7 2 4 5s-1 6 1 8l7 8 7-8c2-2 4-5 1-8Z"/>,
    bolt: <path d="m13 2-9 12h7l-1 8 10-12h-8Z"/>,
    bulb: <path d="M9 18h6m-5 4h4M8 14a7 7 0 1 1 8 0l-1 4H9Z"/>,
    shield: <><path d="m12 2 9 4v6c0 6-9 10-9 10S3 18 3 12V6Z"/><path d="m8 12 3 3 5-6"/></>,
    close: <path d="m6 6 12 12M6 18 18 6"/>,
    refresh: <path d="M20 8a9 9 0 1 0 0 9M20 3v5h-5"/>,
    arrow: <path d="M4 12h16m-6-6 6 6-6 6"/>,
    info: <><circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v1"/></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name] || paths.info}</svg>;
}
