import type { SocialLink } from "@/lib/types";
import { SocialIcon } from "@/components/icons";

export default function SocialLinks({ links }: { links: SocialLink[] }) {
  return (
    <div className="social-row">
      {links.map((link) => {
        const external = link.kind !== "email";
        return (
          <a
            key={link.kind}
            href={link.href}
            className="social-btn"
            {...(external
              ? { target: "_blank", rel: "noopener noreferrer" }
              : {})}
          >
            <SocialIcon kind={link.kind} />
            {link.label}
          </a>
        );
      })}
    </div>
  );
}
