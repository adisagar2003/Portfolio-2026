import type { Profile } from "@/lib/types";
import SocialLinks from "@/components/SocialLinks";

export default function Hero({ profile }: { profile: Profile }) {
  return (
    <div className="hero">
      <div className="hero-avatar-wrap">
        <div className="hero-avatar-glow" aria-hidden="true" />
        {/* plain <img>: GitHub avatar, no Next image optimization needed */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={profile.avatarUrl}
          alt={profile.name}
          loading="lazy"
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
