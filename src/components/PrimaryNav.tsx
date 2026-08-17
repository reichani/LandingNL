import Link from "next/link";

const items = [
  ["Home", "/"],
  ["Plan", "/plan"],
  ["Money", "/money"],
  ["Work", "/work"],
  ["Account", "/account"],
] as const;

type PrimaryNavLabel = (typeof items)[number][0] | "Wallet" | "";

export function PrimaryNav({ active }: { active: PrimaryNavLabel }) {
  return (
    <nav className="bottom-nav" aria-label="Primary navigation" style={{ gridTemplateColumns: "repeat(5, minmax(0, 1fr))" }}>
      {items.map(([label, href]) => (
        <Link key={label} className={label === active ? "active" : ""} href={href}>
          {label}
        </Link>
      ))}
    </nav>
  );
}
