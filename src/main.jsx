import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArrowDown,
  ArrowUpRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Mail,
  Menu,
  Phone,
  X
} from 'lucide-react';
import {
  EDUCATION,
  EXPERIENCE,
  INTRO_SEGMENTS,
  LANGUAGES,
  NAV_ITEMS,
  PROFILE,
  PROJECTS,
  SERVICES,
  STACK_ITEMS
} from './data';
import ParticlePortrait from './components/ParticlePortrait';
import OpeningSequence from './components/OpeningSequence';
import BreakoutGame from './components/BreakoutGame';
import ProjectMockup from './components/ProjectMockup';
import StarfieldBackground from './components/StarfieldBackground';
import './style.css';

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeNav, setActiveNav] = useState('HOME');
  const [introDone, setIntroDone] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  );
  const [portraitAssembled, setPortraitAssembled] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  );
  const [heroScroll, setHeroScroll] = useState(0);
  const [introProgress, setIntroProgress] = useState(0.35);
  const [openService, setOpenService] = useState(0);
  const [copied, setCopied] = useState(false);
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e) => {
      const total = lightbox.project.images.length;
      if (e.key === 'Escape') setLightbox(null);
      else if (e.key === 'ArrowRight')
        setLightbox((lb) => (lb ? { ...lb, index: (lb.index + 1) % total } : null));
      else if (e.key === 'ArrowLeft')
        setLightbox((lb) => (lb ? { ...lb, index: (lb.index - 1 + total) % total } : null));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightbox]);

  const heroRef = useRef(null);
  const introRef = useRef(null);

  const handleMorphToPortfolio = useCallback(() => {
    setPortraitAssembled(true);
  }, []);

  const handleIntroComplete = useCallback(() => {
    setIntroDone(true);
    setPortraitAssembled(true);
  }, []);

  useEffect(() => {
    const sections = [
      ['HOME', 'home'],
      ['ABOUT', 'about'],
      ['SERVICES', 'services'],
      ['WORKS', 'projects'],
      ['PLAY', 'play'],
      ['CONTACT', 'contact']
    ];

    const onScroll = () => {
      const y = window.scrollY;
      const vh = window.innerHeight || 800;

      setHeroScroll(Math.max(0, Math.min(1, y / (vh * 0.78))));

      if (introRef.current) {
        const rect = introRef.current.getBoundingClientRect();
        const prog = Math.max(0.18, Math.min(1, (vh * 0.85 - rect.top) / (rect.height * 0.65)));
        setIntroProgress(prog);
      }

      let current = 'HOME';
      for (const [label, id] of sections) {
        const el = document.getElementById(id);
        if (el && y >= el.offsetTop - 200) current = label;
      }
      setActiveNav(current);
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(PROFILE.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="site">
      {!introDone && (
        <OpeningSequence
          onMorphToPortfolio={handleMorphToPortfolio}
          onComplete={handleIntroComplete}
        />
      )}

      <header className={`topbar ${introDone ? 'is-visible' : ''}`}>
        <a href="#home" className="brand">
          {PROFILE.name}
        </a>
        <button
          type="button"
          className="menu-toggle"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Toggle navigation"
        >
          {menuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
        <nav className={`navlinks ${menuOpen ? 'open' : ''}`}>
          {NAV_ITEMS.map(([label, href]) => (
            <a
              key={label}
              href={href}
              className={activeNav === label ? 'active' : ''}
              onClick={() => setMenuOpen(false)}
            >
              {label}
            </a>
          ))}
        </nav>
      </header>

      <main>
        {/* HERO */}
        <section className="hero" id="home" ref={heroRef}>
          <ParticlePortrait assembled={portraitAssembled} scrollProgress={heroScroll} />
          <div className={`hero-foreground ${portraitAssembled ? 'is-visible' : ''}`}>
            <div className="hero-title-wrap">
              <h1 className="hero-portfolio">PORTFOLIO</h1>
              <p className="hero-role">{PROFILE.role} · AI Motion &amp; Branding</p>
            </div>
            <div className="hero-bottom">
              <span className="hero-loc">{PROFILE.location.toUpperCase()}</span>
              <a href="#about" className="hero-scroll" aria-label="Scroll to intro">
                <span>SCROLL</span>
                <ArrowDown size={13} />
              </a>
            </div>
          </div>
        </section>

        <div className="night-sky-zone">
          <StarfieldBackground />

          {/* INTRO + TOOLS + EXPERIENCE & EDUCATION */}
          <section className="intro-section" id="about" ref={introRef}>
            <div className="intro-grid">
              <div className="intro-heading-col">
                <span className="eyebrow">ABOUT ME</span>
                <h2 className="metallic-title intro-word">Intro</h2>
              </div>

              <div className="intro-card">
                <p className="intro-paragraph">
                  {INTRO_SEGMENTS.map((seg, idx) => {
                    const threshold = (idx + 1) / INTRO_SEGMENTS.length;
                    const lit = seg.highlight && introProgress >= threshold * 0.68;
                    return (
                      <span
                        key={idx}
                        className={
                          seg.highlight
                            ? `seg-highlight ${lit ? 'is-lit' : ''}`
                            : 'seg-muted'
                        }
                      >
                        {seg.text}
                      </span>
                    );
                  })}
                </p>
                <div className="intro-card-foot">
                  <span>{PROFILE.name}</span>
                  <span>01 / 05</span>
                </div>
              </div>
            </div>

            <div className="stack-block">
              <div className="stack-header">
                <span className="eyebrow">DESIGN TOOLS &amp; SKILLS</span>
                <span className="stack-sub">CREATIVE SUITE + TECH</span>
              </div>
              <div className="stack-grid">
                {STACK_ITEMS.map((item) => (
                  <div className="stack-pill" key={item.name}>
                    <span className="stack-badge" style={{ color: item.color }}>
                      {item.tag}
                    </span>
                    <span className="stack-name">{item.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="credentials-grid">
              <div className="cred-card">
                <span className="eyebrow red">EXPERIENCE &amp; INTERNSHIP</span>
                <div className="cred-list">
                  {EXPERIENCE.map((exp) => (
                    <div className="cred-item" key={exp.role + exp.period}>
                      <div className="cred-top">
                        <strong>{exp.role}</strong>
                        <span>{exp.period}</span>
                      </div>
                      <small className="cred-place">{exp.company}</small>
                      <ul>
                        {exp.points.map((pt, i) => (
                          <li key={i}>{pt}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>

              <div className="cred-card">
                <span className="eyebrow red">EDUCATION &amp; CERTIFICATIONS</span>
                <div className="edu-list">
                  {EDUCATION.map((edu) => (
                    <div className="edu-row" key={edu.title}>
                      <div>
                        <strong>{edu.title}</strong>
                        <small>{edu.place}</small>
                      </div>
                      <span>{edu.period}</span>
                    </div>
                  ))}
                </div>

                <div className="lang-block">
                  <span className="eyebrow">LANGUAGES</span>
                  <div className="lang-pills">
                    {LANGUAGES.map((lang) => (
                      <span className="lang-pill" key={lang.name}>
                        <b>{lang.name}</b> · {lang.level}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* SERVICES / WHAT I CAN DO */}
          <section className="services-section" id="services">
            <div className="services-head">
              <span className="eyebrow">CAPABILITIES</span>
              <h2 className="metallic-title services-title">
                WHAT I
                <br />
                CAN DO
              </h2>
            </div>

            <div className="services-list">
              {SERVICES.map((svc, idx) => {
                const expanded = openService === idx;
                return (
                  <button
                    type="button"
                    key={svc.num}
                    className={`service-row ${expanded ? 'is-open' : ''}`}
                    onClick={() => setOpenService(expanded ? -1 : idx)}
                  >
                    <div className="service-main">
                      <span className="service-num">{svc.num}</span>
                      <div className="service-text">
                        <h3>{svc.title}</h3>
                        {expanded && (
                          <div className="service-detail">
                            <p>{svc.desc}</p>
                            <small>{svc.meta}</small>
                          </div>
                        )}
                      </div>
                      <ArrowUpRight className="service-arrow" size={18} />
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* SELECTED WORKS */}
          <section className="projects-section" id="projects">
            <div className="projects-head">
              <div>
                <span className="eyebrow red">// SELECTED WORKS</span>
                <h2 className="metallic-title projects-title">
                  FEATURED
                  <br />
                  WORKS
                </h2>
              </div>
              <span className="projects-count">05 SHOWCASES</span>
            </div>

            <div className="projects-flow">
              {PROJECTS.map((project, idx) => {
                const reversed = idx % 2 === 1;
                return (
                  <article
                    key={project.id}
                    className={`project-row ${reversed ? 'is-reversed' : ''}`}
                  >
                    <div className="project-media">
                      <ProjectMockup
                        project={project}
                        onOpenGallery={(proj, i) => setLightbox({ project: proj, index: i })}
                      />
                    </div>
                    <div className="project-info">
                      <div className="project-meta">
                        <span className="red">{project.id}</span>
                        <span>//</span>
                        <span>{project.category}</span>
                      </div>
                      <h3 className="project-name">
                        <strong>{project.titleLead}</strong>{' '}
                        <span>{project.titleAccent}</span>
                      </h3>
                      <p className="project-sub">{project.subtitle}</p>
                      <p className="project-desc">{project.desc}</p>
                      <div className="project-tags">
                        {project.tags.map((tag) => (
                          <span key={tag}>{tag}</span>
                        ))}
                      </div>
                      <button
                        type="button"
                        className="project-link project-link-btn"
                        onClick={() => setLightbox({ project, index: 0 })}
                      >
                        View all {project.images.length} posters <ArrowUpRight size={14} />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          {/* INTERACTIVE PLAYGROUND */}
          <section className="play-section" id="play">
            <div className="play-head">
              <span className="eyebrow red">
                <i className="pulse-dot" /> INTERACTIVE BREAKOUT
              </span>
              <h2 className="metallic-title play-title">BREAK IT IF YOU CAN</h2>
              <p className="play-sub">
                Steer the paddle below and smash through the dot-matrix blocks.
              </p>
            </div>
            <BreakoutGame />
          </section>

          {/* CONTACT */}
          <section className="contact-section" id="contact">
            <div className="contact-grid">
              <div className="contact-left">
                <span className="eyebrow red">
                  <i className="pulse-dot" /> AVAILABLE FOR BRANDING, MOTION &amp; CAMPAIGNS
                </span>
                <h2 className="metallic-title contact-title">
                  LET&apos;S CREATE
                  <br />
                  NOTICEABLE
                  <br />
                  BRANDS.
                </h2>
                <p className="contact-lead">
                  Open to graphic design, motion graphics, social media campaigns and
                  AI-assisted visual production opportunities.
                </p>
                <div className="contact-actions">
                  <a className="btn-primary" href={`mailto:${PROFILE.email}`}>
                    Send an email <ArrowUpRight size={15} />
                  </a>
                  <button type="button" className="btn-ghost" onClick={copyEmail}>
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copied ? 'Copied' : 'Copy email'}</span>
                  </button>
                </div>
              </div>

              <div className="contact-card">
                <div className="contact-item">
                  <span>EMAIL</span>
                  <a href={`mailto:${PROFILE.email}`}>{PROFILE.email}</a>
                </div>
                <div className="contact-item">
                  <span>PHONE</span>
                  <div className="phone-links">
                    {PROFILE.phones.map((ph) => (
                      <a key={ph} href={`tel:${ph.replace(/\s+/g, '')}`}>
                        {ph}
                      </a>
                    ))}
                  </div>
                </div>
                <div className="contact-item">
                  <span>BASED IN</span>
                  <strong>{PROFILE.location}</strong>
                </div>
                <div className="contact-item">
                  <span>FOCUS</span>
                  <strong>Branding · Social Media · Motion · AI Video</strong>
                </div>
                <div className="contact-item">
                  <span>DIRECT</span>
                  <div className="social-row">
                    <a href={`mailto:${PROFILE.email}`} aria-label="Email">
                      <Mail size={15} />
                    </a>
                    <a href={`tel:${PROFILE.phones[0].replace(/\s+/g, '')}`} aria-label="Call primary phone">
                      <Phone size={15} />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <footer className="site-footer">
            <span>© 2026 {PROFILE.name}. All rights reserved.</span>
            <a href="#home">Back to top ↑</a>
          </footer>
        </div>
      </main>

      {lightbox && (
        <div
          className="lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={lightbox.project.images[lightbox.index]?.label}
          onClick={() => setLightbox(null)}
        >
          <div className="lightbox-panel" onClick={(e) => e.stopPropagation()}>
            <div className="lightbox-head">
              <div>
                <span className="eyebrow red">{lightbox.project.category}</span>
                <strong>{lightbox.project.images[lightbox.index]?.label}</strong>
              </div>
              <div className="lightbox-controls">
                <span className="lightbox-count">
                  {lightbox.index + 1} / {lightbox.project.images.length}
                </span>
                <button
                  type="button"
                  className="lightbox-close"
                  onClick={() => setLightbox(null)}
                  aria-label="Close gallery"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="lightbox-stage">
              <button
                type="button"
                className="lightbox-nav"
                onClick={() =>
                  setLightbox((lb) => ({
                    ...lb,
                    index: (lb.index - 1 + lb.project.images.length) % lb.project.images.length
                  }))
                }
                aria-label="Previous poster"
              >
                <ChevronLeft size={20} />
              </button>
              <img
                src={lightbox.project.images[lightbox.index]?.src}
                alt={lightbox.project.images[lightbox.index]?.label}
              />
              <button
                type="button"
                className="lightbox-nav"
                onClick={() =>
                  setLightbox((lb) => ({
                    ...lb,
                    index: (lb.index + 1) % lb.project.images.length
                  }))
                }
                aria-label="Next poster"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            <div className="lightbox-thumbs">
              {lightbox.project.images.map((item, i) => (
                <button
                  type="button"
                  key={item.src}
                  className={`lightbox-thumb ${i === lightbox.index ? 'active' : ''}`}
                  onClick={() => setLightbox((lb) => ({ ...lb, index: i }))}
                >
                  <img src={item.src} alt={item.label} />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
