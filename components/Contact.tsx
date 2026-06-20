import type { ContactBlock } from "@/lib/types";
import SocialLinks from "@/components/SocialLinks";

export default function Contact({ contact }: { contact: ContactBlock }) {
  return (
    <section id="contact" className="contact" data-screen-label="Contact" data-reveal>
      <div className="section-label">
        <span className="section-label-index">07</span>
        <span className="section-label-text">Contact</span>
        <span className="section-label-line" />
      </div>
      <h2 className="contact-heading">{contact.heading}</h2>
      <p className="contact-body">{contact.body}</p>
      <SocialLinks links={contact.socials} />
    </section>
  );
}
