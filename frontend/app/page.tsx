import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-2xl text-center space-y-8">
        <h1 className="text-5xl font-bold text-slate-900 dark:text-white">
          Next.js + Go
          <br />
          <span className="text-blue-600 dark:text-blue-400">Full-Stack Template</span>
        </h1>

        <p className="text-xl text-slate-600 dark:text-slate-300 leading-relaxed">
          A production-ready boilerplate featuring end-to-end type safety, 
          OpenAPI contracts, and Kubernetes deployment.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
          <FeatureCard
            title="Next.js 16"
            description="App Router, Server Components, and Server Actions for modern React apps."
            icon="⚡"
          />
          <FeatureCard
            title="Go Backend"
            description="High-performance Go 1.26 API with OpenAPI/Swagger documentation."
            icon="🐹"
          />
          <FeatureCard
            title="Kubernetes"
            description="GitOps-ready with ArgoCD, k3s manifests, and automated CI/CD."
            icon="☸️"
          />
        </div>

        <div className="pt-4">
          <Link
            href="/items"
            className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
          >
            View Demo
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>

        <div className="pt-8 text-sm text-slate-500 dark:text-slate-400">
          <p>Built with TypeScript, PostgreSQL, SQLC, and Tailwind CSS</p>
        </div>
      </div>
    </main>
  );
}

function FeatureCard({ title, description, icon }: { title: string; description: string; icon: string }) {
  return (
    <div className="p-6 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
      <div className="text-3xl mb-3">{icon}</div>
      <h3 className="font-semibold text-slate-900 dark:text-white mb-2">{title}</h3>
      <p className="text-sm text-slate-600 dark:text-slate-400">{description}</p>
    </div>
  );
}
