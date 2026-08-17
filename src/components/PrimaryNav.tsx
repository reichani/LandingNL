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
    <nav className="bottom-nav" aria-label="Primary navigation">
      {items.map(([label, href]) => {
        const isActive = label === active;
        return (
          <Link key={label} className={isActive ? "active" : ""} href={href} aria-current={isActive ? "page" : undefined}>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
