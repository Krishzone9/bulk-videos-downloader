import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'About – YT Bulk Downloader',
  description: 'About the YouTube Bulk Downloader project and its creator.',
};

export default function AboutPage() {
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
        <h1 style={{ fontSize: 32, fontWeight: 700, margin: '0 0 24px', color: '#f1f1f1' }}>
          About
        </h1>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, margin: '0 0 12px', color: '#f1f1f1' }}>
            What is YT Bulk Downloader?
          </h2>
          <p style={{ fontSize: 15, lineHeight: 1.7, color: '#aaa', margin: 0 }}>
            YT Bulk Downloader is a local web application that lets you browse any YouTube
            channel&apos;s videos in a familiar grid layout and download them at the highest
            available quality with a single click. It supports bulk selection, real-time
            progress tracking, and works entirely on your machine — no cloud, no accounts,
            no tracking.
          </p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, margin: '0 0 12px', color: '#f1f1f1' }}>
            Tech Stack
          </h2>
          <ul style={{ fontSize: 15, lineHeight: 1.8, color: '#aaa', margin: 0, paddingLeft: 20 }}>
            <li><strong style={{ color: '#f1f1f1' }}>Frontend:</strong> Next.js (App Router), TypeScript, Tailwind CSS</li>
            <li><strong style={{ color: '#f1f1f1' }}>Backend:</strong> Node.js, Express, TypeScript</li>
            <li><strong style={{ color: '#f1f1f1' }}>Engine:</strong> yt-dlp + ffmpeg</li>
            <li><strong style={{ color: '#f1f1f1' }}>Realtime:</strong> Server-Sent Events (SSE)</li>
          </ul>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, margin: '0 0 12px', color: '#f1f1f1' }}>
            Creator
          </h2>
          <p style={{ fontSize: 15, lineHeight: 1.7, color: '#aaa', margin: '0 0 16px' }}>
            Built by <strong style={{ color: '#f1f1f1' }}>Kanhaiya Geda</strong>.
          </p>
          <a
            href="https://www.linkedin.com/in/kanhaiya-geda/"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              backgroundColor: '#0a66c2', color: 'white',
              padding: '10px 20px', borderRadius: 8,
              fontSize: 14, fontWeight: 600, textDecoration: 'none',
              transition: 'opacity 0.15s',
            }}
          >
            <svg viewBox="0 0 24 24" fill="white" width="18" height="18">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
            Connect on LinkedIn
          </a>
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
