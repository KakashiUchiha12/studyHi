"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { BookOpen, Target, TrendingUp, Clock, ChevronRight, Users, Calendar, CheckCircle2, LogIn, Rocket } from "lucide-react"
import { StudyHiLogo } from "@/components/ui/studyhi-logo"

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground overflow-x-hidden">

      {/* Navbar Placeholder - assuming Navbar is in layout or we build a simple one here for the landing */}
      <header className="py-6 px-4 sm:px-6 lg:px-8 border-b border-border bg-white sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between">
          <StudyHiLogo size="default" />
          <div className="flex items-center gap-2 sm:gap-4">
            <Link href="/auth/login">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary transition-colors">
                <LogIn className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Log in</span>
              </Button>
            </Link>
            <Link href="/auth/signup">
              <Button size="sm" className="bg-primary hover:bg-primary/90 text-white rounded-md px-3 sm:px-6">
                <Rocket className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Get Started</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-12 sm:py-20 lg:py-32 bg-white">
          <div className="container mx-auto px-6 sm:px-6 lg:px-8 text-center max-w-5xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-3xl sm:text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900 mb-4 sm:mb-6 leading-tight px-2">
                Organize Your Studies.<br />
                <span className="text-primary">Master Your Future.</span>
              </h1>
              <p className="text-base sm:text-xl text-slate-600 mb-8 sm:mb-10 max-w-2xl mx-auto leading-relaxed px-2">
                The professional platform for students who take their education seriously. Track subjects, manage syllabi, and analyze your performance with enterprise-grade tools.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4 sm:px-0">
                <Link href="/auth/signup" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto px-8 h-12 text-base font-semibold shadow-lg shadow-primary/20">
                    Start Free Trial
                    <ChevronRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
                <Link href="#features" className="w-full sm:w-auto">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto px-8 h-12 text-base border-slate-300 text-slate-700 hover:bg-slate-50">
                    View Features
                  </Button>
                </Link>
              </div>
            </motion.div>

            {/* Hero Image / Dashboard Mockup */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.7 }}
              className="mt-10 sm:mt-16 rounded-lg sm:rounded-xl border border-slate-200 shadow-xl sm:shadow-2xl overflow-hidden bg-slate-50 mx-2 sm:mx-0">
              <img
                src="/dashboard-preview.png"
                alt="StudyHi Dashboard"
                className="w-full h-auto object-cover"
                onError={(e) => {
                  e.currentTarget.src = "https://placehold.co/1200x600/f1f5f9/3b82f6?text=Professional+Dashboard+Preview";
                }}
              />
            </motion.div>
          </div>
        </section>

        {/* Social Proof / Trust Banner */}
        <section className="py-8 sm:py-10 bg-slate-50 border-y border-slate-100">
          <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-center gap-4 sm:gap-8 md:gap-16 text-slate-500">
            <p className="font-semibold text-xs sm:text-sm uppercase tracking-wider text-slate-400 text-center">Trusted by students from</p>
            <div className="flex items-center gap-4 sm:gap-6 md:gap-8 opacity-70 grayscale hover:grayscale-0 transition-all flex-wrap justify-center">
              <span className="text-base sm:text-xl font-bold font-serif">Harvard</span>
              <span className="text-base sm:text-xl font-bold font-serif">MIT</span>
              <span className="text-base sm:text-xl font-bold font-serif">Stanford</span>
              <span className="text-base sm:text-xl font-bold font-serif">Oxford</span>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section id="features" className="py-16 sm:py-24 bg-white">
          <div className="container mx-auto px-6 sm:px-6 lg:px-8">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3 sm:mb-4 px-4">Everything You Need to Excel</h2>
              <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto px-4">
                Comprehensive tools designed to streamline your academic workflow and boost productivity.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {/* Feature 1 */}
              <div className="p-8 rounded-xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition-shadow group">
                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mb-6 group-hover:bg-blue-100 transition-colors">
                  <BookOpen className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Subject Management</h3>
                <p className="text-slate-600 leading-relaxed">
                  Keep all your courses organized in one place. Track attendance, manage resources, and stay on top of your schedule.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="p-8 rounded-xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition-shadow group">
                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mb-6 group-hover:bg-blue-100 transition-colors">
                  <Target className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Syllabus Tracking</h3>
                <p className="text-slate-600 leading-relaxed">
                  Break down complex syllabi into manageable topics. Track completion status and visual progress bars.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="p-8 rounded-xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition-shadow group">
                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mb-6 group-hover:bg-blue-100 transition-colors">
                  <TrendingUp className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Performance Analytics</h3>
                <p className="text-slate-600 leading-relaxed">
                  Gain insights into your study habits. Visualize grades, study hours, and efficiency with professional charts.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="p-8 rounded-xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition-shadow group">
                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mb-6 group-hover:bg-blue-100 transition-colors">
                  <Clock className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Session Logging</h3>
                <p className="text-slate-600 leading-relaxed">
                  Log your study sessions with precision. Tag subjects, add notes, and reflect on your productivity.
                </p>
              </div>

              {/* Feature 5 */}
              <div className="p-8 rounded-xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition-shadow group">
                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mb-6 group-hover:bg-blue-100 transition-colors">
                  <Calendar className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Smart Scheduling</h3>
                <p className="text-slate-600 leading-relaxed">
                  Plan your week with an intelligent calendar. Set reminders for exams, assignments, and study blocks.
                </p>
              </div>

              {/* Feature 6 */}
              <div className="p-8 rounded-xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition-shadow group">
                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mb-6 group-hover:bg-blue-100 transition-colors">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Collaboration Ready</h3>
                <p className="text-slate-600 leading-relaxed">
                  Share resources and study plans. Built for individual focus but ready for team collaboration.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Value Proposition */}
        <section className="py-16 sm:py-24 bg-slate-900 text-white">
          <div className="container mx-auto px-6 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 sm:gap-16 items-center">
              <div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 px-2 sm:px-0">Why Top Students Choose StudyHi</h2>
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-primary flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-bold text-base sm:text-lg mb-1">Distraction-Free Environment</h4>
                      <p className="text-sm sm:text-base text-slate-400">Clean, professional interface composed to minimize cognitive load and maximize focus.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-primary flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-bold text-base sm:text-lg mb-1">Data-Driven Insights</h4>
                      <p className="text-sm sm:text-base text-slate-400">Make informed decisions about your study strategy based on real performance metrics, not guesses.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-primary flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-bold text-base sm:text-lg mb-1">Universal Compatibility</h4>
                      <p className="text-sm sm:text-base text-slate-400">Seamless Experience across all your devices. Your academic life, synchronized everywhere.</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full"></div>
                <div className="relative bg-slate-800 border border-slate-700 rounded-xl sm:rounded-2xl p-6 sm:p-8 shadow-2xl">
                  {/* Mockup Stat Card */}
                  <div className="flex items-center justify-between mb-4 sm:mb-6 border-b border-slate-700 pb-3 sm:pb-4">
                    <h3 className="font-bold text-sm sm:text-base">Weekly Performance</h3>
                    <span className="text-green-400 font-mono text-xs sm:text-sm">↑ 12% vs last week</span>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-xs sm:text-sm mb-1 text-slate-300">
                        <span>Mathematics</span>
                        <span>85%</span>
                      </div>
                      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 w-[85%]"></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs sm:text-sm mb-1 text-slate-300">
                        <span>Computer Science</span>
                        <span>92%</span>
                      </div>
                      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500 w-[92%]"></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs sm:text-sm mb-1 text-slate-300">
                        <span>Physics</span>
                        <span>78%</span>
                      </div>
                      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 w-[78%]"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 sm:py-24 bg-white text-center">
          <div className="container mx-auto px-6 sm:px-4 max-w-4xl">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-4 sm:mb-6 px-2">Ready to Transform Your Academic Journey?</h2>
            <p className="text-base sm:text-xl text-slate-600 mb-8 sm:mb-10 max-w-2xl mx-auto px-2">
              Join thousands of students who have elevated their study game with StudyHi's professional planner.
            </p>
            <Link href="/auth/signup">
              <Button size="lg" className="px-8 sm:px-10 h-12 sm:h-14 text-base sm:text-lg font-bold shadow-xl shadow-primary/20">
                Get Started for Free
              </Button>
            </Link>
            <p className="mt-4 sm:mt-6 text-xs sm:text-sm text-slate-500">
              No credit card required. 14-day free trial on Pro plan.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-50 border-t border-slate-200 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-2">
              <StudyHiLogo size="sm" />
              <p className="mt-4 text-slate-500 max-w-xs leading-relaxed">
                Empowering students with professional tools to achieve academic excellence.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 mb-4">Product</h4>
              <ul className="space-y-3 text-sm text-slate-600">
                <li><Link href="#" className="hover:text-primary">Features</Link></li>
                <li><Link href="#" className="hover:text-primary">Pricing</Link></li>
                <li><Link href="#" className="hover:text-primary">Download</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 mb-4">Company</h4>
              <ul className="space-y-3 text-sm text-slate-600">
                <li><Link href="#" className="hover:text-primary">About</Link></li>
                <li><Link href="#" className="hover:text-primary">Blog</Link></li>
                <li><Link href="#" className="hover:text-primary">Careers</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-500">
            <p>© {new Date().getFullYear()} StudyHi. All rights reserved.</p>
            <div className="flex gap-6">
              <Link href="#" className="hover:text-primary">Privacy Policy</Link>
              <Link href="#" className="hover:text-primary">Terms of Service</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
