import React, { useState } from 'react';
import { 
    SearchIcon, 
    ShieldCheckIcon, 
    ChartBarIcon, 
    DocumentReportIcon, 
    FolderIcon, 
    ShareIcon,
    SparklesIcon,
    BoltIcon,
    CheckBadgeIcon,
    GlobeAltIcon,
    LockClosedIcon,
    ClockIcon,
    UserGroupIcon,
    EyeIcon
} from '../icons';
import { ForensicFlowLogo } from '../Logo';

interface PublicLandingPageProps {
  onTryDemo: () => void;
  onLogin: () => void;
  onRegister: () => void;
}

const FeatureCard: React.FC<{ 
  icon: React.ReactNode; 
  title: string; 
  description: string;
  gradient?: string;
}> = ({ icon, title, description, gradient = "from-cyan-500/10 to-blue-500/10" }) => (
    <div className="group rounded-xl border border-white/10 p-6 shadow-2xl backdrop-blur-lg bg-gradient-to-br from-white/5 to-white/0 h-full hover:border-cyan-500/30 transition-all duration-300 hover:shadow-cyan-500/10">
        <div className={`absolute -inset-px bg-gradient-to-r ${gradient} rounded-xl opacity-0 group-hover:opacity-20 transition-opacity blur`}></div>
        <div className="relative">
            <div className="flex items-center gap-4 mb-4">
                <div className="flex-shrink-0 rounded-lg bg-cyan-500/20 p-3 text-cyan-300 group-hover:bg-cyan-500/30 transition-all group-hover:scale-110">
                    {icon}
                </div>
                <h3 className="text-xl font-semibold text-white">{title}</h3>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">{description}</p>
        </div>
    </div>
);

const StatCard: React.FC<{ 
  icon: React.ReactNode; 
  value: string; 
  label: string;
  gradient?: string;
}> = ({ icon, value, label, gradient = "from-cyan-500 to-blue-500" }) => (
    <div className="relative group">
        <div className={`absolute inset-0 bg-gradient-to-r ${gradient} opacity-0 group-hover:opacity-20 rounded-lg blur transition-opacity`}></div>
        <div className="relative flex items-center gap-4 rounded-lg bg-slate-800/50 px-8 py-6 backdrop-blur-sm border border-white/10 group-hover:border-white/20 transition-all">
            <div className="text-cyan-400 group-hover:scale-110 transition-transform">{icon}</div>
            <div>
                <div className="text-3xl font-bold text-white">{value}</div>
                <div className="text-sm text-slate-400">{label}</div>
            </div>
        </div>
    </div>
);

const UseCaseCard: React.FC<{
  title: string;
  description: string;
  icon: React.ReactNode;
}> = ({ title, description, icon }) => (
    <div className="rounded-xl border border-white/10 p-6 bg-gradient-to-br from-slate-800/30 to-slate-900/30 backdrop-blur-lg hover:border-cyan-500/30 transition-all">
        <div className="text-cyan-400 mb-4">{icon}</div>
        <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
        <p className="text-sm text-slate-400">{description}</p>
    </div>
);

const PublicLandingPage: React.FC<PublicLandingPageProps> = ({ onTryDemo, onLogin, onRegister }) => {
    const [activeTab, setActiveTab] = useState<'features' | 'demo' | 'pricing'>('features');

    return (
        <div className="w-full text-white">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-white/10">
                <nav className="container mx-auto flex h-16 items-center justify-between px-6">
                    <button onClick={() => window.location.reload()} className="hover:scale-105 transition-transform">
                        <ForensicFlowLogo />
                    </button>
                    
                    {/* Navigation Links */}
                    <div className="hidden md:flex items-center gap-8">
                        <button 
                            onClick={() => setActiveTab('features')}
                            className={`text-sm font-medium transition-colors ${activeTab === 'features' ? 'text-cyan-400' : 'text-slate-300 hover:text-white'}`}
                        >
                            Features
                        </button>
                        <button 
                            onClick={() => setActiveTab('demo')}
                            className={`text-sm font-medium transition-colors ${activeTab === 'demo' ? 'text-cyan-400' : 'text-slate-300 hover:text-white'}`}
                        >
                            Demo
                        </button>
                        <a href="#use-cases" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
                            Documentation
                        </a>
                        <a href="#use-cases" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
                            Use Cases
                        </a>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={onLogin}
                            className="rounded-lg bg-slate-700/50 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-600/50 border border-slate-600 hover:border-slate-500 transition-all"
                        >
                            Login
                        </button>
                        <button 
                            onClick={onRegister}
                            className="rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 px-4 py-2 text-sm font-semibold text-white hover:from-cyan-500 hover:to-blue-500 transition-all shadow-lg shadow-cyan-500/20"
                        >
                            Sign Up
                        </button>
                    </div>
                </nav>
            </header>

            <main className="container mx-auto px-6 pt-24">
                {/* Hero Section */}
                <section className="flex flex-col items-center justify-center py-20 min-h-[90vh] text-center">
                    {/* Animated badge */}
                    <div className="mb-6 animate-fade-in">
                        <span className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-500/10 to-purple-500/10 px-4 py-2 text-sm font-medium text-cyan-300 border border-cyan-500/20">
                            <SparklesIcon className="h-4 w-4" />
                            Next-Generation Digital Forensics Platform
                        </span>
                    </div>

                    {/* Main Heading */}
                    <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight animate-fade-in-up">
                        <span className="block bg-gradient-to-r from-cyan-300 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                            Solve Cases Faster
                        </span>
                        <span className="block text-slate-100 mt-3">with AI-Powered Forensics</span>
                    </h1>
                    
                    {/* Subheading */}
                    <p className="mt-8 max-w-3xl text-xl text-slate-300 leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                        Transform digital evidence into actionable intelligence. Search millions of records in seconds, 
                        uncover hidden connections, and generate court-ready reports with <span className="text-cyan-400 font-semibold">ForensicFlow</span>.
                    </p>
                    
                    {/* CTA Buttons */}
                    <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                        <button 
                            onClick={onTryDemo}
                            className="group w-full sm:w-auto relative rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 px-10 py-4 text-lg font-semibold text-white shadow-2xl shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all transform hover:scale-105 overflow-hidden"
                        >
                            <span className="relative z-10 flex items-center gap-2">
                                <EyeIcon className="h-5 w-5" />
                                Try Demo (No Signup Required)
                            </span>
                            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        </button>
                        <button 
                            onClick={onRegister}
                            className="w-full sm:w-auto rounded-lg border-2 border-white/20 bg-white/5 px-10 py-4 text-lg font-semibold text-white shadow-lg backdrop-blur-md hover:bg-white/10 hover:border-white/40 transition-all transform hover:scale-105"
                        >
                            Create Free Account
                        </button>
                    </div>
                    
                    {/* Stats Display */}
                    <div className="mt-16 flex flex-wrap items-center justify-center gap-6 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                        <StatCard
                            icon={<UserGroupIcon className="h-6 w-6" />}
                            value="500+"
                            label="Law Enforcement Agencies"
                            gradient="from-cyan-500 to-blue-500"
                        />
                        <StatCard
                            icon={<ChartBarIcon className="h-6 w-6" />}
                            value="1M+"
                            label="Cases Analyzed"
                            gradient="from-purple-500 to-pink-500"
                        />
                        <StatCard
                            icon={<ClockIcon className="h-6 w-6" />}
                            value="70%"
                            label="Time Saved"
                            gradient="from-green-500 to-emerald-500"
                        />
                    </div>
                    
                    {/* Video/Screenshot Placeholder */}
                    <div className="mt-20 w-full max-w-6xl animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                        <div className="relative">
                            <div className="absolute -inset-4 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 blur-3xl"></div>
                            <div className="relative rounded-2xl border border-white/20 bg-slate-900/50 backdrop-blur-xl overflow-hidden shadow-2xl">
                                <div className="aspect-video bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                                    <button 
                                        onClick={onTryDemo}
                                        className="group flex flex-col items-center gap-4 px-8 py-6 rounded-xl bg-slate-800/80 backdrop-blur-md border border-white/20 hover:border-cyan-500/50 transition-all hover:scale-105"
                                    >
                                        <div className="w-20 h-20 rounded-full bg-gradient-to-r from-cyan-600 to-blue-600 flex items-center justify-center group-hover:from-cyan-500 group-hover:to-blue-500 transition-all">
                                            <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M8 5v14l11-7z" />
                                            </svg>
                                        </div>
                                        <span className="text-lg font-semibold text-white">Watch Demo</span>
                                        <span className="text-sm text-slate-400">See ForensicFlow in action (2:30)</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Trust Badges Section */}
                <section className="py-16 border-t border-white/10">
                    <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-8 text-center">Trusted by Law Enforcement Agencies Worldwide</p>
                    <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-6 text-slate-300">
                        <div className="flex items-center gap-3 group cursor-pointer">
                            <div className="p-2 bg-cyan-500/10 rounded-lg group-hover:bg-cyan-500/20 transition-colors">
                                <ShieldCheckIcon className="h-6 w-6 text-cyan-400" />
                            </div>
                            <span className="font-medium">ISO 27001 Certified</span>
                        </div>
                        <div className="flex items-center gap-3 group cursor-pointer">
                            <div className="p-2 bg-green-500/10 rounded-lg group-hover:bg-green-500/20 transition-colors">
                                <CheckBadgeIcon className="h-6 w-6 text-green-400" />
                            </div>
                            <span className="font-medium">SOC 2 Compliant</span>
                        </div>
                        <div className="flex items-center gap-3 group cursor-pointer">
                            <div className="p-2 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors">
                                <GlobeAltIcon className="h-6 w-6 text-blue-400" />
                            </div>
                            <span className="font-medium">GDPR & CCPA Ready</span>
                        </div>
                        <div className="flex items-center gap-3 group cursor-pointer">
                            <div className="p-2 bg-purple-500/10 rounded-lg group-hover:bg-purple-500/20 transition-colors">
                                <LockClosedIcon className="h-6 w-6 text-purple-400" />
                            </div>
                            <span className="font-medium">256-bit Encryption</span>
                        </div>
                    </div>
                </section>

                {/* Key Features Section */}
                <section className="py-20 border-t border-white/10">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                            Everything You Need to <span className="text-cyan-400">Investigate Faster</span>
                        </h2>
                        <p className="text-lg text-slate-400 max-w-3xl mx-auto">
                            Powerful tools designed by investigators, for investigators. From evidence intake to courtroom presentation.
                        </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <FeatureCard 
                            icon={<SearchIcon className="h-7 w-7" />} 
                            title="AI-Powered Search"
                            description="Query terabytes of data with natural language. Our AI understands context, entities, and intent to find critical evidence in seconds."
                            gradient="from-cyan-500/10 to-blue-500/10"
                        />
                        <FeatureCard 
                            icon={<ShareIcon className="h-7 w-7" />} 
                            title="Network Visualization"
                            description="Automatically map connections between people, devices, locations, and events. Interactive graphs reveal hidden patterns instantly."
                            gradient="from-purple-500/10 to-pink-500/10"
                        />
                        <FeatureCard 
                            icon={<DocumentReportIcon className="h-7 w-7" />} 
                            title="Court-Ready Reports"
                            description="Generate comprehensive, court-admissible reports with one click. Cryptographic hashing ensures chain-of-custody integrity."
                            gradient="from-green-500/10 to-emerald-500/10"
                        />
                        <FeatureCard 
                            icon={<FolderIcon className="h-7 w-7" />} 
                            title="Case Management"
                            description="Organize multiple investigations with timelines, evidence tagging, and collaborative tools for your team."
                            gradient="from-orange-500/10 to-red-500/10"
                        />
                        <FeatureCard 
                            icon={<ClockIcon className="h-7 w-7" />} 
                            title="Timeline Analysis"
                            description="Reconstruct events chronologically with automatic timeline generation from digital evidence metadata."
                            gradient="from-blue-500/10 to-indigo-500/10"
                        />
                        <FeatureCard 
                            icon={<ShieldCheckIcon className="h-7 w-7" />} 
                            title="Audit Trail"
                            description="Complete audit logging of all actions ensures compliance and maintains evidence integrity for legal proceedings."
                            gradient="from-yellow-500/10 to-orange-500/10"
                        />
                    </div>

                    {/* Demo CTA */}
                    <div className="mt-12 text-center">
                        <button 
                            onClick={onTryDemo}
                            className="inline-flex items-center gap-2 px-8 py-3 bg-slate-800/50 border border-cyan-500/30 rounded-lg text-white font-semibold hover:bg-slate-700/50 hover:border-cyan-500/50 transition-all"
                        >
                            <EyeIcon className="h-5 w-5 text-cyan-400" />
                            Try These Features in Demo Mode
                        </button>
                    </div>
                </section>

                {/* Use Cases Section */}
                <section id="use-cases" className="py-20 border-t border-white/10">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-white mb-4">Built for Every Investigation</h2>
                        <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                            From cybercrime to fraud, ForensicFlow adapts to your investigation needs
                        </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <UseCaseCard
                            icon={<svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
                            title="Cybercrime Investigation"
                            description="Analyze digital footprints, trace IP addresses, and uncover online criminal activities across multiple platforms."
                        />
                        <UseCaseCard
                            icon={<svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                            title="Financial Fraud"
                            description="Track monetary flows, identify suspicious transactions, and build evidence for prosecution in fraud cases."
                        />
                        <UseCaseCard
                            icon={<svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
                            title="Organized Crime"
                            description="Map criminal networks, identify key players, and visualize communication patterns to dismantle organizations."
                        />
                        <UseCaseCard
                            icon={<svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>}
                            title="Mobile Device Forensics"
                            description="Extract and analyze data from smartphones, including messages, calls, locations, and app usage."
                        />
                        <UseCaseCard
                            icon={<svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
                            title="Email Forensics"
                            description="Analyze email headers, trace message paths, and recover deleted communications for evidence gathering."
                        />
                        <UseCaseCard
                            icon={<svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
                            title="Corporate Investigations"
                            description="Conduct internal investigations, analyze employee communications, and ensure compliance with policies."
                        />
                    </div>
                </section>

                {/* Testimonials Section */}
                <section className="py-20 border-t border-white/10">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-white mb-4">Trusted by Investigators</h2>
                        <p className="text-lg text-slate-400">See what forensic professionals are saying</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="rounded-xl border border-white/10 p-8 bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-lg">
                            <div className="flex gap-1 mb-4">
                                {[...Array(5)].map((_, i) => (
                                    <svg key={i} className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                ))}
                            </div>
                            <p className="text-slate-300 mb-6">"ForensicFlow cut our investigation time by 70%. The AI search is incredibly accurate and the reports are court-ready out of the box."</p>
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold">
                                    JD
                                </div>
                                <div>
                                    <div className="font-semibold text-white">John Davis</div>
                                    <div className="text-sm text-slate-400">Senior Investigator</div>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-xl border border-white/10 p-8 bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-lg">
                            <div className="flex gap-1 mb-4">
                                {[...Array(5)].map((_, i) => (
                                    <svg key={i} className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                ))}
                            </div>
                            <p className="text-slate-300 mb-6">"The network visualization helped us uncover a crime ring we didn't even know existed. This tool is a game-changer."</p>
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-bold">
                                    SR
                                </div>
                                <div>
                                    <div className="font-semibold text-white">Sarah Roberts</div>
                                    <div className="text-sm text-slate-400">Detective</div>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-xl border border-white/10 p-8 bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-lg">
                            <div className="flex gap-1 mb-4">
                                {[...Array(5)].map((_, i) => (
                                    <svg key={i} className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                ))}
                            </div>
                            <p className="text-slate-300 mb-6">"Finally, a forensic tool that's actually user-friendly. My team was productive on day one, no training required."</p>
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold">
                                    MK
                                </div>
                                <div>
                                    <div className="font-semibold text-white">Michael Kumar</div>
                                    <div className="text-sm text-slate-400">Forensic Lead</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Final CTA Section */}
                <section className="py-20 border-t border-white/10">
                    <div className="relative rounded-2xl overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 blur-3xl"></div>
                        <div className="relative bg-gradient-to-r from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-12 md:p-16 text-center">
                            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                                Ready to Transform Your Investigations?
                            </h2>
                            <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
                                Join hundreds of law enforcement agencies using ForensicFlow to solve cases faster
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <button 
                                    onClick={onTryDemo}
                                    className="px-8 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold rounded-lg shadow-xl shadow-cyan-500/30 transition-all transform hover:scale-105 flex items-center justify-center gap-2"
                                >
                                    <EyeIcon className="h-5 w-5" />
                                    Try Demo Now
                                </button>
                                <button 
                                    onClick={onRegister}
                                    className="px-8 py-4 border-2 border-white/20 hover:border-white/40 text-white font-semibold rounded-lg backdrop-blur-md hover:bg-white/5 transition-all"
                                >
                                    Create Account
                                </button>
                            </div>
                            <p className="mt-6 text-sm text-slate-400">Free to use • Full access after registration • No hidden costs</p>
                        </div>
                    </div>
                </section>
            </main>
            
            {/* Footer */}
            <footer className="border-t border-white/10 py-12 mt-20">
                <div className="container mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                        <div>
                            <ForensicFlowLogo />
                            <p className="mt-4 text-sm text-slate-400">
                                AI-powered digital forensics for modern investigations
                            </p>
                        </div>
                        <div>
                            <h4 className="font-semibold text-white mb-4">Product</h4>
                            <ul className="space-y-2 text-sm text-slate-400">
                                <li><button onClick={() => setActiveTab('features')} className="hover:text-white transition-colors">Features</button></li>
                                <li><button onClick={() => setActiveTab('demo')} className="hover:text-white transition-colors">Demo</button></li>
                                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold text-white mb-4">Company</h4>
                            <ul className="space-y-2 text-sm text-slate-400">
                                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold text-white mb-4">Legal</h4>
                            <ul className="space-y-2 text-sm text-slate-400">
                                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Compliance</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-white/10 pt-8 text-center text-sm text-slate-400">
                        <p>&copy; {new Date().getFullYear()} ForensicFlow. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default PublicLandingPage;

