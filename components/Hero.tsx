import Image from "next/image";
import type { Profile } from "@/lib/types";
import SocialLinks from "@/components/SocialLinks";

export default function Hero({ profile }: { profile: Profile }) {
  return (
    <div className="hero">
      <div className="hero-avatar-wrap">
        <div className="hero-avatar-glow" aria-hidden="true" />
        {/* Above-the-fold LCP image: optimized + priority (preloaded). */}
        <Image
          src={profile.avatarUrl}
          alt={profile.name}
          width={152}
          height={152}
          priority
          sizes="152px"
          className="hero-avatar"
        />
      </div>
      <div className="hero-body">
        <h1 className="hero-name">{profile.name}</h1>
        <p className="hero-role">
          {profile.role}
          {profile.company ? (
            <>
              {" "}
              <a
                href={profile.company.href}
                target="_blank"
                rel="noopener noreferrer"
                className="hero-role-link"
              >
                {profile.company.name}
              </a>
            </>
          ) : null}
        </p>
        <div className="hero-loc">
          <span className="hero-loc-dot" />
          {profile.location}
        </div>
        <p className="hero-bio">{profile.bio}</p>
        <SocialLinks links={profile.socials} />
      </div>
    </div>
  );
}
