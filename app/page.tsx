import { getContent } from "@/lib/content";
import ShaderBackground from "@/components/ShaderBackground";
import RevealController from "@/components/RevealController";
import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import Writing from "@/components/Writing";
import ContributionGrid from "@/components/ContributionGrid";
import TimelineSection from "@/components/TimelineSection";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";

export default async function Home() {
  const { site, profile, posts, sections, contact } = await getContent();

  return (
    <div className="root" id="top">
      <ShaderBackground />
      <div className="scrim" aria-hidden="true" />

      <div className="layer">
        <Nav initials={profile.initials} />

        <header className="header">
          <Hero profile={profile} />

          <div className="divider" aria-hidden="true" />

          <Writing posts={posts} initials={profile.initials} />

          <ContributionGrid username={profile.githubUsername} />
        </header>

        <main>
          {sections.map((section) => (
            <TimelineSection key={section.id} section={section} />
          ))}

          <Contact contact={contact} />

          <Footer site={site} />
        </main>
      </div>

      <RevealController />
    </div>
  );
}
