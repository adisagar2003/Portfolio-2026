import { getContent } from "@/lib/content";
import ShaderBackground from "@/components/ShaderBackgroundClient";
import RevealController from "@/components/RevealController";
import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import Writing from "@/components/Writing";
import ContributionGrid from "@/components/ContributionGrid";
import TimelineSection from "@/components/TimelineSection";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";

// Cached and rebuilt at most every 5 min; admin saves and the posts API call
// revalidatePath("/") so edits still appear immediately without paying the
// uncached "force-dynamic" cost (a Supabase round-trip) on every visit.
export const revalidate = 300;

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

          <Writing posts={posts} />

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
