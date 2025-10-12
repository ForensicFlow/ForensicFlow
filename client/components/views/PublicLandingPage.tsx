import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDemo } from '../../contexts/DemoContext';
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

const FeatureCard: React.FC<{ 
  icon: React.ReactNode; 
  title: string; 
  description: string;
  gradient?: string;
}> = ({ icon, title, description, gradient = "from-cyan-500/20 to-blue-500/20" }) => (
    <div className="group relative rounded-xl border border-cyan-500/20 p-6 bg-gray-900/60 backdrop-blur-xl h-full hover:border-cyan-400/60 transition-all duration-300 hover:shadow-[0_0_30px_rgba(6,182,212,0.3)]">
        <div className={`absolute -inset-px bg-gradient-to-br ${gradient} rounded-xl opacity-0 group-hover:opacity-30 transition-opacity blur-xl`}></div>
        <div className="relative">
            <div className="flex items-center gap-4 mb-4">
                <div className="flex-shrink-0 rounded-lg bg-cyan-500/10 p-3 text-cyan-400 group-hover:bg-cyan-500/20 transition-all group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(6,182,212,0.5)]">
                    {icon}
                </div>
                <h3 className="text-xl font-bold text-white tracking-tight">{title}</h3>
            </div>
            <p className="text-sm text-gray-300 leading-relaxed">{description}</p>
        </div>
        {/* Holographic corner accent */}
        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-cyan-400/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-tr-xl"></div>
    </div>
);

const StatCard: React.FC<{ 
  icon: React.ReactNode; 
  value: string; 
  label: string;
  gradient?: string;
}> = ({ icon, value, label, gradient = "from-cyan-400 to-blue-500" }) => (
    <div className="relative group">
        <div className={`absolute -inset-1 bg-gradient-to-r ${gradient} opacity-20 group-hover:opacity-40 rounded-xl blur-lg transition-opacity`}></div>
        <div className="relative flex items-center gap-4 rounded-xl bg-gray-900/80 border border-cyan-500/30 px-8 py-6 backdrop-blur-sm group-hover:border-cyan-400/60 transition-all group-hover:shadow-[0_0_25px_rgba(6,182,212,0.4)]">
            <div className="text-cyan-400 group-hover:scale-110 transition-transform group-hover:drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]">{icon}</div>
            <div>
                <div className="text-3xl font-bold text-white tracking-tight">{value}</div>
                <div className="text-sm text-gray-400 font-medium">{label}</div>
            </div>
        </div>
    </div>
);

const UseCaseCard: React.FC<{
  title: string;
  description: string;
  icon: React.ReactNode;
}> = ({ title, description, icon }) => (
    <div className="group relative rounded-xl border border-cyan-500/20 p-6 bg-gray-900/60 backdrop-blur-xl hover:border-cyan-400/50 transition-all hover:shadow-[0_0_25px_rgba(6,182,212,0.2)]">
        <div className="absolute -inset-px bg-gradient-to-br from-cyan-500/0 via-cyan-500/10 to-blue-500/0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <div className="relative">
            <div className="text-cyan-400 mb-4 group-hover:scale-110 transition-transform group-hover:drop-shadow-[0_0_10px_rgba(6,182,212,0.8)]">{icon}</div>
            <h3 className="text-lg font-bold text-white mb-2 tracking-tight">{title}</h3>
            <p className="text-sm text-gray-400 leading-relaxed">{description}</p>
        </div>
    </div>
);

const PublicLandingPage: React.FC = () => {
    const navigate = useNavigate();
    const { enterDemoMode } = useDemo();
    const [activeTab, setActiveTab] = useState<'features' | 'demo' | 'pricing'>('features');

    // Navigation handlers
    const handleTryDemo = () => {
        enterDemoMode();
        navigate('/app');
    };

    const handleLogin = () => {
        navigate('/login');
    };

    const handleRegister = () => {
        navigate('/register');
    };

    return (
        <div className="w-full text-white">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-xl border-b border-cyan-500/20">
                <nav className="container mx-auto flex h-16 items-center justify-between px-6">
                    <button onClick={() => window.location.reload()} className="hover:scale-105 transition-transform">
                        <ForensicFlowLogo />
                    </button>
                    
                    {/* Navigation Links */}
                    <div className="hidden md:flex items-center gap-8">
                        <button 
                            onClick={() => setActiveTab('features')}
                            className={`text-sm font-semibold tracking-wide transition-all ${activeTab === 'features' ? 'text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]' : 'text-gray-300 hover:text-white'}`}
                        >
                            Features
                        </button>
                        <button 
                            onClick={() => setActiveTab('demo')}
                            className={`text-sm font-semibold tracking-wide transition-all ${activeTab === 'demo' ? 'text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]' : 'text-gray-300 hover:text-white'}`}
                        >
                            Demo
                        </button>
                        <a href="#use-cases" className="text-sm font-semibold text-gray-300 hover:text-white transition-all tracking-wide">
                            Documentation
                        </a>
                        <a href="#use-cases" className="text-sm font-semibold text-gray-300 hover:text-white transition-all tracking-wide">
                            Use Cases
                        </a>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={handleLogin}
                            className="rounded-lg bg-gray-800/80 border border-cyan-500/30 px-4 py-2 text-sm font-bold text-white hover:bg-gray-700/80 hover:border-cyan-400/50 transition-all hover:shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                        >
                            Login
                        </button>
                        <button 
                            onClick={handleRegister}
                            className="group relative rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-sm font-bold text-white transition-all overflow-hidden hover:shadow-[0_0_25px_rgba(6,182,212,0.6)]"
                        >
                            <span className="relative z-10">Sign Up</span>
                            <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        </button>
                    </div>
                </nav>
            </header>

            <main className="container mx-auto px-6 pt-24">
                {/* Hero Section */}
                <section className="flex flex-col items-center justify-center py-20 min-h-[90vh] text-center relative">
                    {/* Digital matrix effect */}
                    <div className="absolute inset-0 opacity-5 pointer-events-none">
                        <div className="absolute top-0 left-0 text-xs text-cyan-400 font-mono animate-pulse">01010011 01000101 01000011 01010101 01010010 01000101</div>
                        <div className="absolute top-10 right-10 text-xs text-cyan-400 font-mono animate-pulse" style={{ animationDelay: '1s' }}>01000100 01000001 01010100 01000001</div>
                    </div>

                    {/* Animated badge */}
                    <div className="mb-6 animate-fade-in">
                        <span className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-400/40 px-5 py-2.5 text-sm font-bold text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
                            <SparklesIcon className="h-4 w-4 animate-pulse" />
                            Next-Gen Digital Forensics Platform
                        </span>
                    </div>

                    {/* Main Heading with glowing effect */}
                    <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight animate-fade-in-up mb-4">
                        <span className="block bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-300 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(6,182,212,0.5)]">
                            Decode Digital Evidence
                        </span>
                        <span className="block text-white mt-3 drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">with AI-Powered Precision</span>
                    </h1>
                    
                    {/* Subheading */}
                    <p className="mt-8 max-w-3xl text-xl text-gray-300 leading-relaxed animate-fade-in-up font-medium" style={{ animationDelay: '0.1s' }}>
                        Analyze <span className="text-cyan-400 font-bold">terabytes of data</span> in seconds. Uncover hidden patterns, 
                        trace digital footprints, and generate <span className="text-cyan-400 font-bold">court-ready reports</span> with ForensicFlow's advanced AI engine.
                    </p>
                    
                    {/* CTA Buttons */}
                    <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                        <button 
                            onClick={handleTryDemo}
                            className="group relative w-full sm:w-auto rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-10 py-4 text-lg font-bold text-white shadow-[0_0_40px_rgba(6,182,212,0.4)] hover:shadow-[0_0_60px_rgba(6,182,212,0.6)] transition-all transform hover:scale-105 overflow-hidden"
                        >
                            <span className="relative z-10 flex items-center gap-2">
                                <EyeIcon className="h-5 w-5" />
                                Try Live Demo
                            </span>
                            <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            {/* Scanning line effect */}
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100">
                                <div className="h-full w-1 bg-white/50 animate-[data-flow_2s_linear_infinite]"></div>
                            </div>
                        </button>
                        <button 
                            onClick={handleRegister}
                            className="w-full sm:w-auto rounded-lg border-2 border-cyan-500/50 bg-gray-900/60 backdrop-blur-xl px-10 py-4 text-lg font-bold text-white shadow-lg hover:bg-cyan-500/10 hover:border-cyan-400 transition-all transform hover:scale-105 hover:shadow-[0_0_30px_rgba(6,182,212,0.3)]"
                        >
                            Start Free Trial
                        </button>
                    </div>
                    
                    {/* Stats Display with enhanced glow */}
                    <div className="mt-16 flex flex-wrap items-center justify-center gap-6 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                        <StatCard
                            icon={<ShieldCheckIcon className="h-6 w-6" />}
                            value="50+"
                            label="Law Enforcement Agencies"
                            gradient="from-cyan-400 to-blue-500"
                        />
                        <StatCard
                            icon={<ChartBarIcon className="h-6 w-6" />}
                            value="10K+"
                            label="Cases Analyzed"
                            gradient="from-blue-400 to-cyan-500"
                        />
                        <StatCard
                            icon={<BoltIcon className="h-6 w-6" />}
                            value="99.79%"
                            label="Accuracy Rate"
                            gradient="from-cyan-500 to-blue-400"
                        />
                    </div>
                    
                    {/* Video/Screenshot with holographic frame */}
                    <div className="mt-20 w-full max-w-6xl animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                        <div className="relative">
                            <div className="absolute -inset-6 bg-gradient-to-r from-cyan-500/30 to-blue-500/30 blur-3xl rounded-2xl"></div>
                            <div className="relative rounded-2xl border-2 border-cyan-500/40 bg-black/80 backdrop-blur-xl overflow-hidden shadow-[0_0_50px_rgba(6,182,212,0.4)]">
                                {/* Holographic corners */}
                                <div className="absolute top-0 left-0 w-16 h-16 border-l-2 border-t-2 border-cyan-400 rounded-tl-xl"></div>
                                <div className="absolute top-0 right-0 w-16 h-16 border-r-2 border-t-2 border-cyan-400 rounded-tr-xl"></div>
                                <div className="absolute bottom-0 left-0 w-16 h-16 border-l-2 border-b-2 border-cyan-400 rounded-bl-xl"></div>
                                <div className="absolute bottom-0 right-0 w-16 h-16 border-r-2 border-b-2 border-cyan-400 rounded-br-xl"></div>
                                
                                <div className="aspect-video bg-gradient-to-br from-gray-900 to-black flex items-center justify-center relative overflow-hidden">
                                    {/* Scan line effect */}
                                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/10 to-transparent h-32 animate-[data-flow_3s_linear_infinite]"></div>
                                    
                                    <button 
                                        onClick={handleTryDemo}
                                        className="group relative flex flex-col items-center gap-4 px-8 py-6 rounded-xl bg-gray-900/90 backdrop-blur-md border-2 border-cyan-500/40 hover:border-cyan-400 transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(6,182,212,0.5)]"
                                    >
                                        <div className="relative w-20 h-20 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 flex items-center justify-center group-hover:from-cyan-400 group-hover:to-blue-500 transition-all shadow-[0_0_30px_rgba(6,182,212,0.5)]">
                                            <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M8 5v14l11-7z" />
                                            </svg>
                                            {/* Pulse ring */}
                                            <div className="absolute inset-0 rounded-full border-2 border-cyan-400 animate-ping opacity-75"></div>
                                        </div>
                                        <span className="text-lg font-bold text-white tracking-wide">Watch Platform Demo</span>
                                        <span className="text-sm text-cyan-400 font-semibold">See ForensicFlow in Action (2:30)</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Trust Badges Section */}
                <section className="py-16 border-t border-cyan-500/20">
                    <p className="text-xs uppercase tracking-widest text-gray-500 font-bold mb-8 text-center">Trusted & Certified Worldwide</p>
                    <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-6">
                        <div className="flex items-center gap-3 group cursor-pointer">
                            <div className="p-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg group-hover:bg-cyan-500/20 group-hover:border-cyan-400/50 transition-all group-hover:shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                                <ShieldCheckIcon className="h-6 w-6 text-cyan-400" />
                            </div>
                            <span className="font-bold text-gray-300 group-hover:text-white transition-colors">ISO 27001 Certified</span>
                        </div>
                        <div className="flex items-center gap-3 group cursor-pointer">
                            <div className="p-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg group-hover:bg-cyan-500/20 group-hover:border-cyan-400/50 transition-all group-hover:shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                                <CheckBadgeIcon className="h-6 w-6 text-cyan-400" />
                            </div>
                            <span className="font-bold text-gray-300 group-hover:text-white transition-colors">SOC 2 Compliant</span>
                        </div>
                        <div className="flex items-center gap-3 group cursor-pointer">
                            <div className="p-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg group-hover:bg-cyan-500/20 group-hover:border-cyan-400/50 transition-all group-hover:shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                                <GlobeAltIcon className="h-6 w-6 text-cyan-400" />
                            </div>
                            <span className="font-bold text-gray-300 group-hover:text-white transition-colors">GDPR Ready</span>
                        </div>
                        <div className="flex items-center gap-3 group cursor-pointer">
                            <div className="p-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg group-hover:bg-cyan-500/20 group-hover:border-cyan-400/50 transition-all group-hover:shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                                <LockClosedIcon className="h-6 w-6 text-cyan-400" />
                            </div>
                            <span className="font-bold text-gray-300 group-hover:text-white transition-colors">256-bit Encryption</span>
                        </div>
                    </div>
                </section>

                {/* Key Features Section */}
                <section className="py-20 border-t border-cyan-500/20">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">
                            Precision Tools for <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(6,182,212,0.5)]">Digital Investigation</span>
                        </h2>
                        <p className="text-lg text-gray-400 max-w-3xl mx-auto font-medium">
                            Advanced forensic capabilities engineered for speed, accuracy, and legal compliance
                        </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <FeatureCard 
                            icon={<SearchIcon className="h-7 w-7" />} 
                            title="AI-Powered Analysis"
                            description="Process terabytes of evidence with neural network-based pattern recognition. Context-aware entity extraction identifies critical evidence in milliseconds."
                            gradient="from-cyan-500/20 to-blue-500/20"
                        />
                        <FeatureCard 
                            icon={<ShareIcon className="h-7 w-7" />} 
                            title="Network Graph Mapping"
                            description="Visualize complex relationships with dynamic graph algorithms. Automatically identify key nodes, clusters, and communication patterns across devices."
                            gradient="from-blue-500/20 to-cyan-500/20"
                        />
                        <FeatureCard 
                            icon={<DocumentReportIcon className="h-7 w-7" />} 
                            title="Cryptographic Reports"
                            description="Generate SHA-256 verified, court-admissible reports with complete audit trails. Maintain chain-of-custody integrity at every step."
                            gradient="from-cyan-500/20 to-blue-600/20"
                        />
                        <FeatureCard 
                            icon={<FolderIcon className="h-7 w-7" />} 
                            title="Case Intelligence Hub"
                            description="Centralized evidence repository with ML-powered tagging, timeline reconstruction, and collaborative investigation tools."
                            gradient="from-blue-600/20 to-cyan-500/20"
                        />
                        <FeatureCard 
                            icon={<ClockIcon className="h-7 w-7" />} 
                            title="Temporal Analysis"
                            description="Reconstruct event sequences with nanosecond precision. Automated timeline generation from metadata across all evidence types."
                            gradient="from-cyan-500/20 to-blue-500/20"
                        />
                        <FeatureCard 
                            icon={<ShieldCheckIcon className="h-7 w-7" />} 
                            title="Immutable Audit Chain"
                            description="Blockchain-verified logging of all actions. Zero-knowledge proof authentication ensures evidence integrity for legal proceedings."
                            gradient="from-blue-500/20 to-cyan-600/20"
                        />
                    </div>

                    {/* Demo CTA */}
                    <div className="mt-12 text-center">
                        <button 
                            onClick={handleTryDemo}
                            className="inline-flex items-center gap-2 px-8 py-3 bg-gray-900/80 border-2 border-cyan-500/40 rounded-lg text-white font-bold hover:bg-gray-800/80 hover:border-cyan-400/60 transition-all hover:shadow-[0_0_25px_rgba(6,182,212,0.4)]"
                        >
                            <EyeIcon className="h-5 w-5 text-cyan-400" />
                            Experience These Features Live
                        </button>
                    </div>
                </section>

                {/* Use Cases Section */}
                <section id="use-cases" className="py-20 border-t border-cyan-500/20">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-extrabold text-white mb-4 tracking-tight">Built for Every Investigation Scenario</h2>
                        <p className="text-lg text-gray-400 max-w-2xl mx-auto font-medium">
                            From cybercrime to corporate fraud, ForensicFlow delivers precision results
                        </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <UseCaseCard
                            icon={<svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
                            title="Cybercrime Investigation"
                            description="Trace IP addresses, analyze network traffic, decrypt communications, and map digital attack vectors across global infrastructure."
                        />
                        <UseCaseCard
                            icon={<svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                            title="Financial Fraud Detection"
                            description="Track cryptocurrency flows, analyze transaction patterns, identify money laundering schemes with AI anomaly detection."
                        />
                        <UseCaseCard
                            icon={<svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
                            title="Organized Crime Networks"
                            description="Map criminal hierarchies, visualize communication patterns, identify key operatives with social network analysis algorithms."
                        />
                        <UseCaseCard
                            icon={<svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>}
                            title="Mobile Device Forensics"
                            description="Extract encrypted data, recover deleted content, analyze app artifacts, and reconstruct user activity from iOS/Android devices."
                        />
                        <UseCaseCard
                            icon={<svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
                            title="Email Intelligence"
                            description="Decode headers, trace message paths, analyze phishing patterns, and recover permanently deleted communications."
                        />
                        <UseCaseCard
                            icon={<svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
                            title="Corporate Compliance"
                            description="Conduct internal investigations, monitor policy violations, analyze employee communications with privacy-preserving analytics."
                        />
                    </div>
                </section>

                {/* Testimonials Section */}
                <section className="py-20 border-t border-cyan-500/20">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-extrabold text-white mb-4 tracking-tight">Trusted by Elite Investigators</h2>
                        <p className="text-lg text-gray-400 font-medium">Real results from forensic professionals worldwide</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="rounded-xl border border-cyan-500/20 p-8 bg-gray-900/60 backdrop-blur-xl hover:border-cyan-400/40 transition-all hover:shadow-[0_0_25px_rgba(6,182,212,0.2)]">
                            <div className="flex gap-1 mb-4">
                                {[...Array(5)].map((_, i) => (
                                    <svg key={i} className="h-5 w-5 text-cyan-400 drop-shadow-[0_0_5px_rgba(6,182,212,0.8)]" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                ))}
                            </div>
                            <p className="text-gray-300 mb-6 leading-relaxed">"ForensicFlow reduced our investigation time by 70%. The AI-powered analysis is frighteningly accurate and reports are courtroom-ready instantly."</p>
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 border-2 border-cyan-400/50 flex items-center justify-center text-white font-bold shadow-[0_0_15px_rgba(6,182,212,0.5)]">
                                    JD
                                </div>
                                <div>
                                    <div className="font-bold text-white">Suryansh Tripathi</div>
                                    <div className="text-sm text-cyan-400 font-semibold">Senior Investigator</div>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-xl border border-cyan-500/20 p-8 bg-gray-900/60 backdrop-blur-xl hover:border-cyan-400/40 transition-all hover:shadow-[0_0_25px_rgba(6,182,212,0.2)]">
                            <div className="flex gap-1 mb-4">
                                {[...Array(5)].map((_, i) => (
                                    <svg key={i} className="h-5 w-5 text-cyan-400 drop-shadow-[0_0_5px_rgba(6,182,212,0.8)]" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                ))}
                            </div>
                            <p className="text-gray-300 mb-6 leading-relaxed">"The network visualization exposed a criminal network we didn't know existed. This platform is a complete game-changer for digital forensics."</p>
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 border-2 border-cyan-400/50 flex items-center justify-center text-white font-bold shadow-[0_0_15px_rgba(6,182,212,0.5)]">
                                    SR
                                </div>
                                <div>
                                    <div className="font-bold text-white">Sarah</div>
                                    <div className="text-sm text-cyan-400 font-semibold">Detective</div>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-xl border border-cyan-500/20 p-8 bg-gray-900/60 backdrop-blur-xl hover:border-cyan-400/40 transition-all hover:shadow-[0_0_25px_rgba(6,182,212,0.2)]">
                            <div className="flex gap-1 mb-4">
                                {[...Array(5)].map((_, i) => (
                                    <svg key={i} className="h-5 w-5 text-cyan-400 drop-shadow-[0_0_5px_rgba(6,182,212,0.8)]" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                ))}
                            </div>
                            <p className="text-gray-300 mb-6 leading-relaxed">"Finally, a forensic tool that's actually intuitive. My entire team was fully productive on day one. Zero learning curve required."</p>
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 border-2 border-cyan-400/50 flex items-center justify-center text-white font-bold shadow-[0_0_15px_rgba(6,182,212,0.5)]">
                                    MK
                                </div>
                                <div>
                                    <div className="font-bold text-white">Aurora de</div>
                                    <div className="text-sm text-cyan-400 font-semibold">Forensic Lead</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Final CTA Section */}
                <section className="py-20 border-t border-cyan-500/20">
                    <div className="relative rounded-2xl overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 blur-3xl"></div>
                        <div className="relative bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-xl border-2 border-cyan-500/40 rounded-2xl p-12 md:p-16 text-center">
                            {/* Holographic corners */}
                            <div className="absolute top-0 left-0 w-20 h-20 border-l-2 border-t-2 border-cyan-400/60"></div>
                            <div className="absolute top-0 right-0 w-20 h-20 border-r-2 border-t-2 border-cyan-400/60"></div>
                            <div className="absolute bottom-0 left-0 w-20 h-20 border-l-2 border-b-2 border-cyan-400/60"></div>
                            <div className="absolute bottom-0 right-0 w-20 h-20 border-r-2 border-b-2 border-cyan-400/60"></div>
                            
                            <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">
                                Ready to <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(6,182,212,0.5)]">Transform</span> Your Investigations?
                            </h2>
                            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto font-medium">
                                Join 500+ law enforcement agencies solving cases faster with AI-powered forensics
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <button 
                                    onClick={handleTryDemo}
                                    className="group relative px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-lg shadow-[0_0_40px_rgba(6,182,212,0.4)] transition-all transform hover:scale-105 flex items-center justify-center gap-2 overflow-hidden"
                                >
                                    <EyeIcon className="h-5 w-5 relative z-10" />
                                    <span className="relative z-10">Try Demo Now</span>
                                    <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500"></div>
                                </button>
                                <button 
                                    onClick={handleRegister}
                                    className="px-8 py-4 border-2 border-cyan-500/50 hover:border-cyan-400 bg-gray-900/60 text-white font-bold rounded-lg backdrop-blur-md hover:bg-cyan-500/10 transition-all hover:shadow-[0_0_25px_rgba(6,182,212,0.3)]"
                                >
                                    Start Free Trial
                                </button>
                            </div>
                            <p className="mt-6 text-sm text-gray-400 font-semibold">Enterprise-grade security • Full compliance • 24/7 support</p>
                        </div>
                    </div>
                </section>
            </main>
            
            {/* Footer */}
            <footer className="border-t border-cyan-500/20 py-12 mt-20 bg-black/40">
                <div className="container mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                        <div>
                            <ForensicFlowLogo />
                            <p className="mt-4 text-sm text-gray-400 font-medium">
                                AI-powered digital forensics for modern investigations
                            </p>
                        </div>
                        <div>
                            <h4 className="font-bold text-white mb-4 tracking-wide">Product</h4>
                            <ul className="space-y-2 text-sm text-gray-400">
                                <li><button onClick={() => setActiveTab('features')} className="hover:text-cyan-400 transition-colors font-medium">Features</button></li>
                                <li><button onClick={() => setActiveTab('demo')} className="hover:text-cyan-400 transition-colors font-medium">Demo</button></li>
                                <li><a href="#" className="hover:text-cyan-400 transition-colors font-medium">Documentation</a></li>
                                <li><a href="#" className="hover:text-cyan-400 transition-colors font-medium">Security</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold text-white mb-4 tracking-wide">Company</h4>
                            <ul className="space-y-2 text-sm text-gray-400">
                                <li><a href="#" className="hover:text-cyan-400 transition-colors font-medium">About</a></li>
                                <li><a href="#" className="hover:text-cyan-400 transition-colors font-medium">Blog</a></li>
                                <li><a href="#" className="hover:text-cyan-400 transition-colors font-medium">Careers</a></li>
                                <li><a href="#" className="hover:text-cyan-400 transition-colors font-medium">Contact</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold text-white mb-4 tracking-wide">Legal</h4>
                            <ul className="space-y-2 text-sm text-gray-400">
                                <li><a href="#" className="hover:text-cyan-400 transition-colors font-medium">Privacy Policy</a></li>
                                <li><a href="#" className="hover:text-cyan-400 transition-colors font-medium">Terms of Service</a></li>
                                <li><a href="#" className="hover:text-cyan-400 transition-colors font-medium">Compliance</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-cyan-500/20 pt-8 text-center text-sm text-gray-400 font-medium">
                        <p>&copy; {new Date().getFullYear()} ForensicFlow. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default PublicLandingPage;
