import React, { useState, useEffect } from 'react';
import ResultCard from '../ResultCard';
import { evidenceApi, casesApi } from '@/lib/api.ts';
import { EvidenceSnippet } from '../../types';
import { 
    CheckBadgeIcon, 
    ShieldCheckIcon, 
    GlobeAltIcon, 
    SearchIcon, 
    ShareIcon, 
    DocumentReportIcon, 
    FolderIcon, 
    ClockIcon, 
    ChartBarIcon,
    SparklesIcon,
    BoltIcon,
    LockClosedIcon
} from '../icons';
import { ForensicFlowLogo } from '../Logo';
import { AppView } from '../../types';
import TopNav from '../TopNav';
import UserProfileWidget from '../UserProfileWidget';
import LoadingSkeleton from '../LoadingSkeleton';
import { useDemo } from '@/contexts/DemoContext.tsx';

interface LandingPageProps {
  onEnterApp: (view: AppView) => void;
}

const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
    <div className="group rounded-xl border border-white/10 p-6 shadow-2xl shadow-black/40 backdrop-blur-lg bg-gradient-to-br from-white/5 to-white/0 h-full hover:border-cyan-500/30 transition-all duration-300 hover:shadow-cyan-500/10">
        <div className="flex items-center gap-4">
            <div className="flex-shrink-0 rounded-lg bg-cyan-500/20 p-2 text-cyan-300 group-hover:bg-cyan-500/30 transition-colors">
                {icon}
            </div>
            <h3 className="text-lg font-semibold text-white">{title}</h3>
        </div>
        <p className="mt-3 text-sm text-slate-300 leading-relaxed">{children}</p>
    </div>
);

const QuickAccessCard: React.FC<{ 
  icon: React.ReactNode; 
  title: string; 
  description: string; 
  count?: number;
  onClick: () => void;
}> = ({ icon, title, description, count, onClick }) => (
    <button 
        onClick={onClick}
        className="group rounded-xl border border-white/10 p-6 shadow-xl backdrop-blur-lg bg-gradient-to-br from-white/5 to-white/0 hover:from-cyan-500/10 hover:to-purple-500/10 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-cyan-500/20 hover:border-cyan-500/30 text-left w-full"
    >
        <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
                <div className="flex-shrink-0 rounded-lg bg-cyan-500/20 p-3 text-cyan-300 group-hover:bg-cyan-500/30 transition-colors group-hover:scale-110">
                    {icon}
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-white">{title}</h3>
                    <p className="mt-1 text-sm text-slate-400">{description}</p>
                </div>
            </div>
            {count !== undefined && (
                <div className="rounded-lg bg-slate-800/50 px-3 py-1 group-hover:bg-cyan-500/10 transition-colors">
                    <span className="text-2xl font-bold text-cyan-300">{count}</span>
                </div>
            )}
        </div>
    </button>
);

const StatCard: React.FC<{ 
  icon: React.ReactNode; 
  value: string | number; 
  label: string;
  gradient?: string;
}> = ({ icon, value, label, gradient = "from-cyan-500 to-blue-500" }) => (
    <div className="relative group">
        <div className={`absolute inset-0 bg-gradient-to-r ${gradient} opacity-0 group-hover:opacity-20 rounded-lg blur transition-opacity`}></div>
        <div className="relative flex items-center gap-3 rounded-lg bg-slate-800/50 px-6 py-4 backdrop-blur-sm border border-white/10 group-hover:border-white/20 transition-all">
            <div className="text-cyan-400 group-hover:scale-110 transition-transform">{icon}</div>
            <div>
                <div className="text-3xl font-bold text-white">{value}</div>
                <div className="text-xs text-slate-400">{label}</div>
            </div>
        </div>
    </div>
);

const StatCardSkeleton: React.FC = () => (
    <div className="relative">
        <div className="relative flex items-center gap-3 rounded-lg bg-slate-800/50 px-6 py-4 backdrop-blur-sm border border-white/10 animate-pulse">
            <div className="w-6 h-6 bg-slate-700 rounded"></div>
            <div>
                <div className="h-8 w-16 bg-slate-700 rounded mb-1"></div>
                <div className="h-3 w-24 bg-slate-700 rounded"></div>
            </div>
        </div>
    </div>
);

const QuickAccessSkeleton: React.FC = () => (
    <div className="rounded-xl border border-white/10 p-6 bg-gradient-to-br from-white/5 to-white/0 animate-pulse">
        <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-slate-700"></div>
                <div>
                    <div className="h-5 w-32 bg-slate-700 rounded mb-2"></div>
                    <div className="h-4 w-48 bg-slate-700 rounded"></div>
                </div>
            </div>
            <div className="rounded-lg bg-slate-800/50 px-3 py-1">
                <div className="h-8 w-8 bg-slate-700 rounded"></div>
            </div>
        </div>
    </div>
);

const FeatureCardSkeleton: React.FC = () => (
    <div className="rounded-xl border border-white/10 p-6 bg-gradient-to-br from-white/5 to-white/0 animate-pulse">
        <div className="flex items-center gap-4 mb-3">
            <div className="w-10 h-10 rounded-lg bg-slate-700"></div>
            <div className="h-5 w-40 bg-slate-700 rounded"></div>
        </div>
        <div className="space-y-2">
            <div className="h-4 w-full bg-slate-700 rounded"></div>
            <div className="h-4 w-full bg-slate-700 rounded"></div>
            <div className="h-4 w-3/4 bg-slate-700 rounded"></div>
        </div>
    </div>
);

const LandingPage: React.FC<LandingPageProps> = ({ onEnterApp }) => {
    const { isDemoMode, getSampleData } = useDemo();
    const [heroSnippet, setHeroSnippet] = useState<EvidenceSnippet | null>(null);
    const [stats, setStats] = useState({ cases: 0, evidence: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                let evidenceArray: EvidenceSnippet[] = [];
                let casesArray: any[] = [];
                
                if (isDemoMode) {
                    // Use sample data in demo mode
                    const sampleData = getSampleData();
                    evidenceArray = sampleData.evidence;
                    casesArray = sampleData.cases;
                } else {
                    // Fetch real data
                    const [evidenceData, casesData] = await Promise.all([
                        evidenceApi.list(),
                        casesApi.list()
                    ]);
                    evidenceArray = Array.isArray(evidenceData) ? evidenceData : [];
                    casesArray = Array.isArray(casesData) ? casesData : [];
                }
                
                if (evidenceArray.length > 0) {
                    setHeroSnippet(evidenceArray[0]);
                }
                
                setStats({
                    cases: casesArray.length,
                    evidence: evidenceArray.length
                });
            } catch (error) {
                console.error('Error loading landing page data:', error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [isDemoMode, getSampleData]);

    return (
        <div className="w-full text-white">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-20 bg-slate-900/80 backdrop-blur-md border-b border-white/10">
                <nav className="container mx-auto flex h-16 items-center px-6 py-4">
                    <div className="flex flex-1 justify-start">
                      <button onClick={() => window.location.reload()} aria-label="Go to homepage" className="hover:scale-105 transition-transform">
                        <ForensicFlowLogo />
                      </button>
                    </div>

                    <div className="hidden md:flex justify-center">
                        <TopNav activeView={-1 as AppView} setActiveView={onEnterApp} />
                    </div>
                    
                    <div className="flex flex-1 justify-end items-center gap-4">
                      <button className="rounded-md bg-slate-700/50 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-600/50 border border-slate-600 hover:border-slate-500 transition-all">
                          Contact Sales
                      </button>
                      <UserProfileWidget setActiveView={onEnterApp} />
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
                            AI-Powered Digital Forensics Platform
                        </span>
                    </div>

                    {/* Main Heading */}
                    <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight animate-fade-in-up">
                        <span className="block bg-gradient-to-r from-cyan-300 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                            Accelerate Investigations
                        </span>
                        <span className="block text-slate-100 mt-3">with AI-Powered Forensics</span>
                    </h1>
                    
                    {/* Subheading */}
                    <p className="mt-8 max-w-3xl text-xl text-slate-300 leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                        Transform digital evidence into actionable intelligence. Search millions of records in seconds, 
                        uncover hidden connections, and generate court-ready reports with ForensicFlow.
                    </p>
                    
                    {/* CTA Buttons */}
                    <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                        <button 
                            onClick={() => onEnterApp(AppView.CASES)}
                            className="group w-full sm:w-auto relative rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 px-10 py-4 text-lg font-semibold text-white shadow-2xl shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all transform hover:scale-105 overflow-hidden"
                        >
                            <span className="relative z-10 flex items-center gap-2">
                                <BoltIcon className="h-5 w-5" />
                                Enter Application
                            </span>
                            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        </button>
                        <button 
                            onClick={() => onEnterApp(AppView.SEARCH)}
                            className="w-full sm:w-auto rounded-lg border-2 border-white/20 bg-white/5 px-10 py-4 text-lg font-semibold text-white shadow-lg backdrop-blur-md hover:bg-white/10 hover:border-white/40 transition-all transform hover:scale-105"
                        >
                            Start Searching
                        </button>
                    </div>
                    
                    {/* Stats Display */}
                    <div className="mt-16 flex flex-wrap items-center justify-center gap-6 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                        {loading ? (
                            <>
                                <StatCardSkeleton />
                                <StatCardSkeleton />
                                <StatCardSkeleton />
                            </>
                        ) : (
                            <>
                                <StatCard
                                    icon={<FolderIcon className="h-6 w-6" />}
                                    value={stats.cases}
                                    label="Active Cases"
                                    gradient="from-cyan-500 to-blue-500"
                                />
                                <StatCard
                                    icon={<ChartBarIcon className="h-6 w-6" />}
                                    value={stats.evidence}
                                    label="Evidence Items"
                                    gradient="from-purple-500 to-pink-500"
                                />
                                <StatCard
                                    icon={<ClockIcon className="h-6 w-6" />}
                                    value="99.9%"
                                    label="Uptime"
                                    gradient="from-green-500 to-emerald-500"
                                />
                            </>
                        )}
                    </div>
                    
                    {/* Hero Preview Card */}
                    {loading ? (
                        <div className="mt-20 w-full max-w-5xl animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                            <div className="rounded-xl border border-white/10 bg-slate-800/30 p-8 animate-pulse">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-slate-700 rounded-lg"></div>
                                        <div className="flex-1">
                                            <div className="h-5 w-1/3 bg-slate-700 rounded mb-2"></div>
                                            <div className="h-4 w-1/4 bg-slate-700 rounded"></div>
                                        </div>
                                    </div>
                                    <div className="h-4 w-full bg-slate-700 rounded"></div>
                                    <div className="h-4 w-full bg-slate-700 rounded"></div>
                                    <div className="h-4 w-3/4 bg-slate-700 rounded"></div>
                                    <div className="flex gap-2 mt-4">
                                        <div className="h-8 w-20 bg-slate-700 rounded"></div>
                                        <div className="h-8 w-20 bg-slate-700 rounded"></div>
                                        <div className="h-8 w-20 bg-slate-700 rounded"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : heroSnippet ? (
                        <div className="mt-20 w-full max-w-5xl animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                            <div className="relative">
                                <div className="absolute -inset-4 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 blur-2xl"></div>
                                <div className="relative transition-transform duration-500 hover:scale-[1.02]">
                                    <ResultCard snippet={heroSnippet} isSelected={false} onSelect={() => {}} />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="mt-20 w-full max-w-4xl animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                            <div className="rounded-xl border border-dashed border-white/20 p-16 text-center bg-slate-800/20">
                                <SearchIcon className="h-20 w-20 mx-auto text-slate-600 mb-4" />
                                <p className="text-lg text-slate-400">No evidence data yet. Upload UFDR files to get started.</p>
                                <button 
                                    onClick={() => onEnterApp(AppView.CASES)}
                                    className="mt-6 px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors"
                                >
                                    Upload First Case
                                </button>
                            </div>
                        </div>
                    )}
                </section>

                {/* Trust Badges Section */}
                <section className="py-16 border-t border-white/10">
                    <p className="text-sm uppercase tracking-widest text-slate-500 font-semibold mb-8">Trusted by Law Enforcement Agencies Worldwide</p>
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

                {/* Quick Access Modules */}
                <section className="py-20">
                     <div className="text-center mb-12">
                        <h2 className="text-4xl font-bold text-white mb-4">Powerful Features at Your Fingertips</h2>
                        <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                            Everything you need to conduct thorough digital forensic investigations
                        </p>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {loading ? (
                            <>
                                <QuickAccessSkeleton />
                                <QuickAccessSkeleton />
                                <QuickAccessSkeleton />
                            </>
                        ) : (
                            <>
                                <QuickAccessCard
                                    icon={<SearchIcon className="h-6 w-6" />}
                                    title="Search Evidence"
                                    description="AI-powered natural language search across all cases"
                                    count={stats.evidence}
                                    onClick={() => onEnterApp(AppView.SEARCH)}
                                />
                                <QuickAccessCard
                                    icon={<FolderIcon className="h-6 w-6" />}
                                    title="Case Management"
                                    description="Organize investigations with timelines and network graphs"
                                    count={stats.cases}
                                    onClick={() => onEnterApp(AppView.CASES)}
                                />
                                <QuickAccessCard
                                    icon={<ChartBarIcon className="h-6 w-6" />}
                                    title="Analytics Dashboard"
                                    description="Real-time insights and investigation progress tracking"
                                    onClick={() => onEnterApp(AppView.CASES)}
                                />
                            </>
                        )}
                     </div>
                </section>

                {/* Features Section */}
                <section className="py-20 border-t border-white/10">
                     <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-white mb-4">Built for Modern Investigations</h2>
                        <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                            From evidence intake to courtroom presentation, every step optimized
                        </p>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
                        {loading ? (
                            <>
                                <FeatureCardSkeleton />
                                <FeatureCardSkeleton />
                                <FeatureCardSkeleton />
                            </>
                        ) : (
                            <>
                                <FeatureCard icon={<SearchIcon className="h-7 w-7" />} title="Natural Language Search">
                                    Query terabytes of data with simple, natural language. Our AI understands context, entities, and intent to find critical evidence in seconds, not hours.
                                </FeatureCard>
                                <FeatureCard icon={<ShareIcon className="h-7 w-7" />} title="Visual Analytics">
                                    Automatically map connections between people, devices, locations, and events. Interactive timelines and network graphs reveal hidden patterns instantly.
                                </FeatureCard>
                                <FeatureCard icon={<DocumentReportIcon className="h-7 w-7" />} title="Court-Ready Reports">
                                    Generate comprehensive, court-admissible reports with one click. Cryptographic hashing ensures an unbroken chain-of-custody for every piece of evidence.
                                </FeatureCard>
                            </>
                        )}
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
                                    <div className="text-sm text-slate-400">Senior Investigator, FBI</div>
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
                            <p className="text-slate-300 mb-6">"The network visualization feature helped us uncover a crime ring we didn't even know existed. This tool is a game-changer."</p>
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-bold">
                                    SR
                                </div>
                                <div>
                                    <div className="font-semibold text-white">Sarah Roberts</div>
                                    <div className="text-sm text-slate-400">Detective, Metro PD</div>
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
                            <p className="text-slate-300 mb-6">"Finally, a forensic tool that's actually user-friendly. My team was productive on day one, no lengthy training required."</p>
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold">
                                    MK
                                </div>
                                <div>
                                    <div className="font-semibold text-white">Michael Kumar</div>
                                    <div className="text-sm text-slate-400">Forensic Lead, CBI</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
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
                                    onClick={() => onEnterApp(AppView.CASES)}
                                    className="px-8 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold rounded-lg shadow-xl shadow-cyan-500/30 transition-all transform hover:scale-105"
                                >
                                    Start Free Trial
                                </button>
                                <button className="px-8 py-4 border-2 border-white/20 hover:border-white/40 text-white font-semibold rounded-lg backdrop-blur-md hover:bg-white/5 transition-all">
                                    Schedule Demo
                                </button>
                            </div>
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
                                <li><button onClick={() => onEnterApp(AppView.SEARCH)} className="hover:text-white transition-colors">Features</button></li>
                                <li><button onClick={() => onEnterApp(AppView.CASES)} className="hover:text-white transition-colors">Use Cases</button></li>
                                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
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
                        <p>&copy; {new Date().getFullYear()} ForensicFlow. All rights reserved. Built with ❤️ for investigators.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
