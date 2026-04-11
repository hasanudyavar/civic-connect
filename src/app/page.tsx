import Link from 'next/link';
import { Building2, Shield, MapPin, Clock, BarChart3, ChevronRight, Star, Zap } from 'lucide-react';

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[var(--background)]/80 backdrop-blur-xl border-b border-[var(--glass-border)]">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--primary-container)] flex items-center justify-center shadow-[0_0_15px_rgba(0,105,72,0.3)]">
              <Building2 className="w-5 h-5 text-[var(--on-primary)]" />
            </div>
            <span className="text-lg font-bold" style={{ fontFamily: 'var(--font-display)' }}>Civic Connect</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/transparency" className="hidden sm:flex items-center gap-2 text-sm font-semibold text-[var(--on-surface-variant)] hover:text-[var(--on-surface)] transition-colors px-3 py-2 rounded-xl hover:bg-[var(--glass-bg)]">
              <BarChart3 className="w-4 h-4" /> Transparency
            </Link>
            <Link href="/login" className="btn-secondary !py-2 !px-5 text-sm">Sign In</Link>
            <Link href="/register" className="btn-primary !py-2 !px-5 text-sm">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-4">
        <div className="absolute top-20 right-0 w-[600px] h-[600px] bg-[var(--primary)] rounded-full mix-blend-screen filter blur-[200px] opacity-10 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[var(--secondary)] rounded-full mix-blend-screen filter blur-[180px] opacity-[0.08] pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--surface-container-highest)] text-[var(--primary)] text-xs font-bold uppercase tracking-widest mb-8 border border-[rgba(0,105,72,0.2)]">
            <Zap className="w-3.5 h-3.5" /> Bhatkal Taluk &bull; Smart Civic Platform
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 text-[var(--on-surface)] leading-[1.1]" style={{ fontFamily: 'var(--font-display)' }}>
            Report Civic Issues.{' '}
            <span className="bg-gradient-to-r from-[var(--primary)] to-[var(--primary-container)] bg-clip-text text-transparent">Track Progress.</span>{' '}
            Hold Officials Accountable.
          </h1>

          <p className="text-lg sm:text-xl text-[var(--on-surface-variant)] max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
            File complaints directly to the right department. Get real-time updates.
            AI-powered analysis ensures faster resolution for Bhatkal Taluk residents.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="btn-primary !py-4 !px-8 text-base shadow-[0_0_30px_rgba(0,105,72,0.3)] hover:shadow-[0_0_40px_rgba(245,166,35,0.5)] group">
              File a Complaint — Free <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/transparency" className="btn-secondary !py-4 !px-8 text-base">
              <BarChart3 className="w-5 h-5" /> View Public Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 relative">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-4" style={{ fontFamily: 'var(--font-display)' }}>How It Works</h2>
            <p className="text-lg text-[var(--on-surface-variant)] max-w-xl mx-auto">Report issues in 30 seconds. Track every step until resolution.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: MapPin, title: 'Pin Location', desc: 'Mark the exact location on the map', color: 'var(--secondary)', step: '01' },
              { icon: Building2, title: 'Auto-Route', desc: 'AI routes to the correct department automatically', color: 'var(--primary)', step: '02' },
              { icon: Clock, title: 'SLA Tracking', desc: 'Every complaint has a deadline with real-time countdown', color: 'var(--success)', step: '03' },
              { icon: Star, title: 'Rate & Review', desc: 'Rate the resolution and provide feedback', color: 'var(--warning)', step: '04' },
            ].map(f => (
              <div key={f.title} className="glass-card p-6 group hover:translate-y-[-8px] transition-all duration-500">
                <div className="text-[40px] font-black opacity-[0.05] absolute top-4 right-6" style={{ fontFamily: 'var(--font-display)' }}>{f.step}</div>
                <div className="w-12 h-12 rounded-xl mb-4 flex items-center justify-center group-hover:scale-110 transition-transform" style={{ background: `${f.color}20` }}>
                  <f.icon className="w-6 h-6" style={{ color: f.color }} />
                </div>
                <h3 className="text-lg font-bold mb-2 group-hover:text-[var(--primary)] transition-colors">{f.title}</h3>
                <p className="text-sm text-[var(--on-surface-variant)] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="py-16 px-4 border-t border-[var(--glass-border)]">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-[var(--success)]" />
            <span className="text-sm font-bold text-[var(--outline)]">Government-Grade Security</span>
          </div>
          <p className="text-sm text-[var(--outline)] max-w-lg mx-auto">
            End-to-end encrypted. Role-based access control. Citizen privacy protected.
            Built on Supabase with row-level security policies.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-[var(--glass-border)]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[var(--primary)]" />
            <span className="text-sm font-bold">Bhatkal Civic Connect</span>
          </div>
          <p className="text-xs text-[var(--outline)]">&copy; {new Date().getFullYear()} Bhatkal Taluk Administration. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
