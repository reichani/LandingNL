import Link from "next/link";

const items = [
  ["Home", "/"],
  ["Plan", "/plan"],
  ["Money", "/money"],
  ["Wallet", "/wallet"],
  ["Work", "/work"],
  ["Account", "/account"],
] as const;

export function PrimaryNav({ active }: { active: (typeof items)[number][0] | "" }) {
  return (
    <nav className="bottom-nav" aria-label="Primary navigation" style={{ gridTemplateColumns: "repeat(6, 1fr)" }}>
      {items.map(([label, href]) => (
        <Link key={label} className={label === active ? "active" : ""} href={href}>
          {label}
        </Link>
      ))}
    </nav>
  );
}
