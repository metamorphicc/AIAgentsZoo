import Link from "next/link";

type KineticLinkProps = {
  className: string;
  href: string;
  label: string;
};

export function KineticLink({ className, href, label }: KineticLinkProps) {
  return (
    <Link className={`${className} kinetic-link`} href={href}>
      <span className="kinetic-link__window">
        <span className="kinetic-link__track">
          <span>{label}</span>
          <span aria-hidden="true">{label}</span>
        </span>
      </span>
      <span aria-hidden="true">↗</span>
    </Link>
  );
}
