import type { SiteMeta } from "@/lib/types";

export default function Footer({ site }: { site: SiteMeta }) {
  return (
    <footer className="footer">
      <div className="footer-divider" aria-hidden="true" />
      <div className="footer-row">
        <span>{site.footerLeft}</span>
        <span>{site.footerRight}</span>
      </div>
    </footer>
  );
}
