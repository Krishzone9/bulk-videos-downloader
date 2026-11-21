import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy – YT Bulk Downloader',
  description: 'Privacy policy and disclaimer for YT Bulk Downloader.',
};

export default function PrivacyPage() {
  return (
    <div style={{ minHeight: '100dvh', backgroundColor: '#0f0f0f', color: '#f1f1f1' }}>
      {/* Nav */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        backgroundColor: '#0f0f0f',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        padding: '12px 24px',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            backgroundColor: '#ff0000',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg viewBox="0 0 24 24" fill="white" width="18" height="18">
              <path d="M8 5v14l11-7L8 5z"/>
            </svg>
          </div>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#f1f1f1', letterSpacing: '-0.3px' }}>
            YT Downloader
          </span>
        </Link>
      </header>

      <main style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px 80px' }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, margin: '0 0 8px', color: '#f1f1f1' }}>
          Privacy Policy &amp; Disclaimer
        </h1>
        <p style={{ fontSize: 13, color: '#666', margin: '0 0 32px' }}>
          Last updated: November 2026
        </p>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, margin: '0 0 12px', color: '#f1f1f1' }}>
            1. No Data Collection
          </h2>
          <p style={{ fontSize: 15, lineHeight: 1.7, color: '#aaa', margin: 0 }}>
            YT Bulk Downloader runs entirely on your local machine. We do not collect,
            store, transmit, or process any personal data, usage analytics, cookies,
            or tracking information of any kind. No data is sent to any external server
            other than YouTube (to fetch publicly available video metadata and content).
          </p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, margin: '0 0 12px', color: '#f1f1f1' }}>
            2. Disclaimer of Liability
          </h2>
          <p style={{ fontSize: 15, lineHeight: 1.7, color: '#aaa', margin: 0 }}>
            This software is provided <strong style={{ color: '#f1f1f1' }}>&quot;as is&quot;</strong>,
            without warranty of any kind, express or implied. The website owner and developer
            of this application shall <strong style={{ color: '#f1f1f1' }}>not be held liable
            or responsible</strong> for any actions taken by users of this software, including
            but not limited to:
          </p>
          <ul style={{ fontSize: 15, lineHeight: 1.8, color: '#aaa', margin: '12px 0 0', paddingLeft: 20 }}>
            <li>Any fraudulent, illegal, or unauthorized use of downloaded content</li>
            <li>Copyright infringement or violation of YouTube&apos;s Terms of Service</li>
            <li>Any loss, damage, or harm arising from the use or misuse of this tool</li>
            <li>Distribution, reproduction, or commercial use of downloaded videos</li>
            <li>Any claims, lawsuits, or legal proceedings resulting from user activity</li>
          </ul>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, margin: '0 0 12px', color: '#f1f1f1' }}>
            3. User Responsibility
          </h2>
          <p style={{ fontSize: 15, lineHeight: 1.7, color: '#aaa', margin: 0 }}>
            You are solely responsible for ensuring that your use of this application complies
            with all applicable laws, regulations, and third-party rights (including YouTube&apos;s
            Terms of Service and applicable copyright laws). This tool is intended for
            downloading content that you have the legal right to download (e.g., your own
            uploads, Creative Commons content, or content you have explicit permission to save).
          </p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, margin: '0 0 12px', color: '#f1f1f1' }}>
            4. No Warranty
          </h2>
          <p style={{ fontSize: 15, lineHeight: 1.7, color: '#aaa', margin: 0 }}>
            The developer makes no guarantees regarding the availability, accuracy, reliability,
            or functionality of this software. The application may stop working at any time due
            to changes in YouTube&apos;s platform, yt-dlp updates, or other external factors.
          </p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, margin: '0 0 12px', color: '#f1f1f1' }}>
            5. Indemnification
          </h2>
          <p style={{ fontSize: 15, lineHeight: 1.7, color: '#aaa', margin: 0 }}>
            By using this application, you agree to indemnify and hold harmless the website
            owner and developer from any and all claims, damages, obligations, losses,
            liabilities, costs, or expenses arising from your use of the software.
          </p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, margin: '0 0 12px', color: '#f1f1f1' }}>
            6. Contact
          </h2>
          <p style={{ fontSize: 15, lineHeight: 1.7, color: '#aaa', margin: 0 }}>
            For questions about this policy, reach out via{' '}
            <a
              href="https://www.linkedin.com/in/kanhaiya-geda/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#ff0000', textDecoration: 'none' }}
            >
              LinkedIn
            </a>.
          </p>
        </section>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 24 }}>
          <Link href="/" style={{ color: '#ff0000', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>
            ← Back to Home
          </Link>
        </div>
      </main>
    </div>
  );
}
