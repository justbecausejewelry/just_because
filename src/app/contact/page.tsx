import { Clock, Mail, Sparkles } from 'lucide-react'
import { ContactForm } from '@/components/contact/ContactForm'

const contactCards = [
  {
    icon: Mail,
    title: 'Email Us',
    text: 'For general inquiries and order support',
    value: 'support@justbecausejewelry.com',
    href: 'mailto:support@justbecausejewelry.com',
  },
  {
    icon: Clock,
    title: 'Response Time',
    text: 'We typically respond within',
    value: '24 hours',
    subtext: 'Monday to Friday, 9am to 6pm EST',
  },
  {
    icon: Sparkles,
    title: 'Custom Orders',
    text: 'For bespoke pieces and ring builder help',
    value: 'support@justbecausejewelry.com',
    href: 'mailto:support@justbecausejewelry.com',
  },
]

const faqs = [
  {
    question: 'How long does shipping take?',
    answer:
      'All orders ship within 1-2 business days. Standard delivery takes 3-5 business days within the US. Free shipping on all orders over $150.',
  },
  {
    question: 'Can I return or exchange my order?',
    answer:
      'Yes. We offer a 30-day return policy on all unworn pieces in original packaging. Custom and engraved pieces are final sale.',
  },
  {
    question: 'How do I know my ring size?',
    answer:
      'We recommend visiting a local jeweler for the most accurate measurement. You can also use our online ring size guide at justbecausejewelry.com/education/ring-size',
  },
]

export default function ContactPage() {
  return (
    <main className="contact-page-shell">
      <style>{`
        .contact-page-shell {
          background: #FBF5F0;
          color: #1A1014;
          min-height: 100vh;
        }

        .contact-hero {
          padding: clamp(56px, 8vw, 112px) 24px clamp(44px, 6vw, 72px);
          text-align: center;
        }

        .contact-container {
          margin: 0 auto;
          max-width: 1120px;
          width: 100%;
        }

        .contact-eyebrow {
          color: #C9A961;
          font-family: var(--font-inter);
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.3em;
          margin: 0 0 16px;
          text-transform: uppercase;
        }

        .contact-hero h1,
        .contact-form-copy h2,
        .contact-faq-section h2,
        .contact-card h2,
        .contact-faq-item h3 {
          color: #1A1014;
          font-family: var(--font-playfair);
          font-weight: 400;
          letter-spacing: 0;
        }

        .contact-hero h1 {
          font-size: clamp(42px, 7vw, 72px);
          line-height: 1.04;
          margin: 0 auto 20px;
          max-width: 720px;
        }

        .contact-hero p,
        .contact-form-copy p,
        .contact-card p,
        .contact-faq-item p {
          color: #B8A090;
          font-family: var(--font-inter);
          font-size: 14px;
          font-weight: 400;
          line-height: 1.85;
          margin: 0;
        }

        .contact-hero p {
          color: #1A1014;
          margin: 0 auto;
          max-width: 680px;
        }

        .contact-cards-section {
          padding: 0 24px clamp(56px, 7vw, 96px);
        }

        .contact-cards-grid {
          display: grid;
          gap: 20px;
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }

        .contact-card {
          background: #FDF8F2;
          border: 0.5px solid #EDD9AF;
          border-radius: 4px;
          box-shadow: 0 4px 20px rgba(26,16,20,0.06);
          min-height: 274px;
          padding: 32px;
          transition: border-color 500ms cubic-bezier(0.4,0,0.2,1),
            box-shadow 500ms cubic-bezier(0.4,0,0.2,1),
            transform 500ms cubic-bezier(0.4,0,0.2,1);
        }

        .contact-card:hover {
          border-color: #C9A961;
          box-shadow: 0 16px 40px rgba(26,16,20,0.10);
          transform: translateY(-6px);
        }

        .contact-card-icon {
          align-items: center;
          border: 0.5px solid #EDD9AF;
          color: #C9A961;
          display: inline-flex;
          height: 48px;
          justify-content: center;
          margin-bottom: 26px;
          width: 48px;
        }

        .contact-card h2 {
          font-size: 26px;
          line-height: 1.12;
          margin: 0 0 12px;
        }

        .contact-card-value {
          color: #1A1014;
          display: inline-block;
          font-family: var(--font-inter);
          font-size: 14px;
          font-weight: 500;
          line-height: 1.5;
          margin-top: 18px;
          overflow-wrap: anywhere;
          text-decoration: none;
          transition: color 400ms cubic-bezier(0.4,0,0.2,1);
        }

        a.contact-card-value:hover {
          color: #C9A961;
        }

        .contact-card-subtext {
          color: #B8A090;
          display: block;
          font-family: var(--font-inter);
          font-size: 12px;
          line-height: 1.7;
          margin-top: 10px;
        }

        .contact-form-section {
          background: #FCF0F4;
          border-bottom: 0.5px solid #EDD9AF;
          border-top: 0.5px solid #EDD9AF;
          padding: clamp(56px, 8vw, 104px) 24px;
        }

        .contact-form-layout {
          align-items: start;
          display: grid;
          gap: clamp(32px, 6vw, 72px);
          grid-template-columns: minmax(240px, 0.78fr) minmax(0, 1.22fr);
        }

        .contact-form-copy {
          position: sticky;
          top: 112px;
        }

        .contact-form-copy h2,
        .contact-faq-section h2 {
          font-size: clamp(32px, 4vw, 48px);
          line-height: 1.1;
          margin: 0 0 18px;
        }

        .contact-form {
          background: #FDF8F2;
          border: 0.5px solid #EDD9AF;
          border-radius: 4px;
          box-shadow: 0 4px 20px rgba(26,16,20,0.06);
          display: grid;
          gap: 18px;
          padding: clamp(24px, 4vw, 40px);
        }

        .contact-form-grid {
          display: grid;
          gap: 18px;
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .contact-field {
          display: grid;
          gap: 8px;
        }

        .contact-field label {
          color: #1A1014;
          font-family: var(--font-inter);
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.18em;
          text-transform: uppercase;
        }

        .contact-field input,
        .contact-field select,
        .contact-field textarea {
          background: #FBF5F0;
          border: 0.5px solid #EDD9AF;
          border-radius: 2px;
          color: #1A1014;
          font-family: var(--font-inter);
          font-size: 15px;
          font-weight: 400;
          outline: none;
          padding: 14px 16px;
          transition: border-color 400ms cubic-bezier(0.4,0,0.2,1),
            box-shadow 400ms cubic-bezier(0.4,0,0.2,1);
          width: 100%;
        }

        .contact-field textarea {
          min-height: 180px;
          resize: vertical;
        }

        .contact-field input:focus,
        .contact-field select:focus,
        .contact-field textarea:focus {
          border-color: #C9A961 !important;
          box-shadow: 0 0 0 3px rgba(201,169,97,0.18);
        }

        .contact-field input[aria-invalid="true"],
        .contact-field select[aria-invalid="true"],
        .contact-field textarea[aria-invalid="true"] {
          border-color: #A85C6A !important;
        }

        .contact-field span {
          color: #B8A090;
          font-family: var(--font-inter);
          font-size: 12px;
          line-height: 1.5;
        }

        .contact-field [id$="-error"],
        .contact-error {
          color: #A85C6A;
        }

        .contact-success,
        .contact-error {
          border: 0.5px solid #EDD9AF;
          font-family: var(--font-inter);
          font-size: 14px;
          line-height: 1.7;
          padding: 14px 16px;
        }

        .contact-success {
          background: #FBF5F0;
          color: #1A1014;
        }

        .contact-error {
          background: #FCF0F4;
        }

        .contact-form button {
          background: #1A1014;
          border: 0;
          border-radius: 2px;
          color: #FBF5F0;
          font-family: var(--font-inter);
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.18em;
          min-height: 52px;
          padding: 16px 28px;
          text-transform: uppercase;
          transition: background 400ms cubic-bezier(0.4,0,0.2,1),
            opacity 400ms cubic-bezier(0.4,0,0.2,1);
          width: fit-content;
        }

        .contact-form button:hover {
          background: #575757;
        }

        .contact-form button:disabled {
          background: #B8A090;
          cursor: wait;
          opacity: 0.9;
        }

        .contact-faq-section {
          padding: clamp(56px, 8vw, 104px) 24px;
        }

        .contact-faq-header {
          margin: 0 auto 40px;
          max-width: 1120px;
          text-align: center;
        }

        .contact-faq-grid {
          display: grid;
          gap: 18px;
          margin: 0 auto;
          max-width: 1120px;
        }

        .contact-faq-item {
          background: #FDF8F2;
          border: 0.5px solid #EDD9AF;
          border-radius: 4px;
          display: grid;
          gap: 12px;
          grid-template-columns: minmax(220px, 0.44fr) minmax(0, 0.56fr);
          padding: 26px 28px;
        }

        .contact-faq-item h3 {
          font-size: 24px;
          line-height: 1.18;
          margin: 0;
        }

        @media (max-width: 1024px) {
          .contact-cards-grid,
          .contact-form-layout {
            grid-template-columns: 1fr;
          }

          .contact-form-copy {
            position: static;
          }
        }

        @media (max-width: 768px) {
          .contact-hero {
            padding: 48px 20px 40px;
          }

          .contact-cards-section,
          .contact-form-section,
          .contact-faq-section {
            padding-left: 20px;
            padding-right: 20px;
          }

          .contact-card {
            min-height: 0;
            padding: 26px 22px;
          }

          .contact-form-grid,
          .contact-faq-item {
            grid-template-columns: 1fr;
          }

          .contact-form button {
            justify-content: center;
            width: 100%;
          }
        }
      `}</style>

      <section className="contact-hero">
        <div className="contact-container">
          <p className="contact-eyebrow">GET IN TOUCH</p>
          <h1>We are here for you</h1>
          <p>
            Whether you have a question about a piece, need help with sizing, or just want to talk diamonds - we would love to hear from you.
          </p>
        </div>
      </section>

      <section className="contact-cards-section" aria-label="Contact options">
        <div className="contact-container contact-cards-grid">
          {contactCards.map((card) => {
            const Icon = card.icon
            return (
              <article className="contact-card" key={card.title}>
                <span className="contact-card-icon" aria-hidden="true">
                  <Icon size={24} strokeWidth={1.5} />
                </span>
                <h2>{card.title}</h2>
                <p>{card.text}</p>
                {card.href ? (
                  <a className="contact-card-value" href={card.href}>
                    {card.value}
                  </a>
                ) : (
                  <span className="contact-card-value">{card.value}</span>
                )}
                {card.subtext ? <span className="contact-card-subtext">{card.subtext}</span> : null}
              </article>
            )
          })}
        </div>
      </section>

      <section className="contact-form-section">
        <div className="contact-container contact-form-layout">
          <div className="contact-form-copy">
            <p className="contact-eyebrow">MESSAGE US</p>
            <h2>Send us a message</h2>
            <p>Fill out the form below and we will get back to you within 24 hours.</p>
          </div>
          <ContactForm />
        </div>
      </section>

      <section className="contact-faq-section">
        <div className="contact-faq-header">
          <p className="contact-eyebrow">SUPPORT</p>
          <h2>Common Questions</h2>
        </div>
        <div className="contact-faq-grid">
          {faqs.map((faq) => (
            <article className="contact-faq-item" key={faq.question}>
              <h3>{faq.question}</h3>
              <p>{faq.answer}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
