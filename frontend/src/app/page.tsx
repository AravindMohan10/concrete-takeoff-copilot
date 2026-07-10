import Link from "next/link";
import { TakeoffDemo } from "@/components/TakeoffDemo";

const PROBLEM = {
  manual: [
    "Open each structural PDF page by page",
    "Find the footing schedule sheet (often buried in the set)",
    "Copy F1, F2, F3 rows into a spreadsheet by hand",
    "Convert feet-inches to decimal, then calculate CY (÷ 27)",
    "Double-check before dropping numbers into the bid",
  ],
  withApp: [
    "Upload the PDF once",
    "Jump to the schedule sheet",
    "Extract all footing rows in one pass",
    "Edit anything wrong, then export CSV",
  ],
};

const SHIPPED = [
  { title: "PDF upload and page viewer", detail: "Multi-page structural sets, flip between sheets" },
  { title: "Footing schedule extraction", detail: "Reads marks, L/W/D, rebar from schedule tables" },
  { title: "Automatic CY calculation", detail: "L × W × D ÷ 27 on every row" },
  { title: "Editable review table", detail: "Override any value before export, add or remove rows" },
  { title: "CSV export", detail: "Bid-ready file with totals, includes your edits" },
  { title: "Full-stack pipeline", detail: "FastAPI backend + Next.js frontend, runs locally" },
];

const EXAMPLE_ROWS = [
  { mark: "F1", l: 4, w: 4, d: 1, cy: 0.59, rebar: "#4 @ 12 O.C." },
  { mark: "F2", l: 5, w: 5, d: 1.5, cy: 1.39, rebar: "#5 @ 10 O.C." },
  { mark: "F3", l: 6, w: 6, d: 2, cy: 2.67, rebar: "-" },
];

const STEPS = [
  {
    num: "1",
    title: "Upload your PDF",
    body: "Any foundation plan set works. Use the arrows to find the page titled FOOTING SCHEDULE.",
  },
  {
    num: "2",
    title: "Extract the table",
    body: "Hit Extract Schedule. The app pulls every footing row off the sheet.",
  },
  {
    num: "3",
    title: "Review and fix",
    body: "Click a row to select it. Edit dimensions if anything looks off. Add or delete rows.",
  },
  {
    num: "4",
    title: "Export CSV",
    body: "Download a file with all footings and total CY. Ready for your estimating workflow.",
  },
];

const LEARNINGS = [
  {
    title: "Schedule tables first, plan views later",
    body: "Schedules have clean rows with dimensions. Detecting footings on a plan view is a harder problem. This demo starts where the data is most structured.",
  },
  {
    title: "Render PDFs before reading them",
    body: "Drawings are rendered at 200 DPI so small text like 4'-0\" stays legible during extraction.",
  },
  {
    title: "Estimators need to edit before export",
    body: "No one trusts raw output on a bid. The editable table is the core workflow, not an afterthought.",
  },
  {
    title: "Cross-sheet matching is next",
    body: "Linking F1 on the plan to F1 in the schedule across different sheets is the harder problem worth solving next.",
  },
];

const STACK = ["Next.js", "TypeScript", "FastAPI", "Python", "PyMuPDF", "Pydantic"];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <nav className="sticky top-0 z-50 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <span className="text-sm font-semibold tracking-tight">
            Takeoff <span className="text-orange-500">Copilot</span>
          </span>
          <div className="flex items-center gap-5 text-sm">
            <a href="#built" className="text-zinc-400 hover:text-zinc-200 transition-colors">
              What&apos;s built
            </a>
            <a href="#how" className="text-zinc-400 hover:text-zinc-200 transition-colors">
              How to use
            </a>
            <a
              href="#try"
              className="rounded-lg border border-zinc-700 px-4 py-2 font-medium text-zinc-300 hover:border-zinc-500 hover:bg-zinc-900 transition-colors"
            >
              Local setup
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-5xl px-6 pt-16 pb-12">
        <p className="mb-3 text-sm font-medium uppercase tracking-widest text-orange-500/80">
          Portfolio project · Concrete takeoff
        </p>
        <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
          Footing schedules to{" "}
          <span className="text-orange-500">cubic-yard quantities</span>, with review built in
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-zinc-400">
          I built a working takeoff tool for structural concrete: upload a foundation PDF, extract
          footing rows, edit what the sheet got wrong, and export CSV. One vertical slice, end to
          end. Run it locally to try extraction.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a
            href="https://github.com/AravindMohan10/concrete-takeoff-copilot"
            className="rounded-lg bg-orange-600 px-6 py-3 text-sm font-medium text-white hover:bg-orange-500 transition-colors"
          >
            Clone & run locally
          </a>
          <Link
            href="/try"
            className="rounded-lg border border-zinc-700 px-6 py-3 text-sm font-medium text-zinc-300 hover:border-zinc-500 hover:bg-zinc-900 transition-colors"
          >
            Open workspace
          </Link>
          <a
            href="#built"
            className="rounded-lg px-6 py-3 text-sm font-medium text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            What&apos;s built →
          </a>
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          {STACK.map((tech) => (
            <span
              key={tech}
              className="rounded-full border border-zinc-800 bg-zinc-900/50 px-3 py-1 text-xs text-zinc-400"
            >
              {tech}
            </span>
          ))}
        </div>
      </section>

      {/* Problem / solution */}
      <section className="border-t border-zinc-800/60 bg-zinc-900/20 py-14">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-2xl font-semibold tracking-tight">The problem this solves</h2>
          <p className="mt-3 max-w-2xl text-zinc-500 text-sm">
            Concrete estimators spend hours on footing takeoffs before every bid. This demo automates
            one step of that workflow.
          </p>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-6">
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Today (manual)</p>
              <ul className="mt-4 space-y-2.5">
                {PROBLEM.manual.map((item) => (
                  <li key={item} className="flex gap-2 text-sm text-zinc-500">
                    <span className="text-zinc-600">·</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-6">
              <p className="text-xs font-medium uppercase tracking-wider text-orange-400">With this tool</p>
              <ul className="mt-4 space-y-2.5">
                {PROBLEM.withApp.map((item) => (
                  <li key={item} className="flex gap-2 text-sm text-zinc-300">
                    <span className="text-orange-500">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Example output */}
      <section className="py-14">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-2xl font-semibold tracking-tight">Example output</h2>
          <p className="mt-3 text-sm text-zinc-500">
            What you get after extraction. Every field is editable before export.
          </p>
          <div className="mt-6 overflow-hidden rounded-xl border border-zinc-800">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-900/80 text-xs uppercase tracking-wider text-zinc-500">
                <tr>
                  <th className="px-4 py-3">Mark</th>
                  <th className="px-4 py-3">L (ft)</th>
                  <th className="px-4 py-3">W (ft)</th>
                  <th className="px-4 py-3">D (ft)</th>
                  <th className="px-4 py-3">CY</th>
                  <th className="px-4 py-3">Rebar</th>
                </tr>
              </thead>
              <tbody className="text-zinc-300">
                {EXAMPLE_ROWS.map((row) => (
                  <tr key={row.mark} className="border-t border-zinc-800/80">
                    <td className="px-4 py-2.5 font-mono font-medium text-orange-400">{row.mark}</td>
                    <td className="px-4 py-2.5">{row.l}</td>
                    <td className="px-4 py-2.5">{row.w}</td>
                    <td className="px-4 py-2.5">{row.d}</td>
                    <td className="px-4 py-2.5 font-medium">{row.cy}</td>
                    <td className="px-4 py-2.5 text-xs text-zinc-500">{row.rebar}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t border-zinc-800 bg-zinc-900/40">
                <tr>
                  <td colSpan={4} className="px-4 py-3 text-xs uppercase tracking-wider text-zinc-500">
                    Total concrete
                  </td>
                  <td className="px-4 py-3 font-semibold text-orange-400">4.65 CY</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
          <p className="mt-3 font-mono text-xs text-zinc-600">
            Formula: CY = length × width × depth ÷ 27
          </p>
        </div>
      </section>

      {/* What's built */}
      <section id="built" className="border-t border-zinc-800/60 bg-zinc-900/20 py-14">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-2xl font-semibold tracking-tight">What I shipped</h2>
          <p className="mt-3 text-sm text-zinc-500">
            Not a mockup. A working pipeline I built in 3 days, full stack.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SHIPPED.map((item) => (
              <div key={item.title} className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-5">
                <div className="mb-2 text-orange-500">✓</div>
                <h3 className="font-medium text-zinc-200">{item.title}</h3>
                <p className="mt-1.5 text-sm text-zinc-500">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How to use */}
      <section id="how" className="py-14">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-2xl font-semibold tracking-tight">How to use it</h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step) => (
              <div key={step.num} className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-5">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-500/15 text-xs font-semibold text-orange-400">
                  {step.num}
                </span>
                <h3 className="mt-3 font-medium text-zinc-100">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-500">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Learnings */}
      <section id="learnings" className="border-t border-zinc-800/60 bg-zinc-900/20 py-14">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-2xl font-semibold tracking-tight">What I learned</h2>
          <p className="mt-3 text-sm text-zinc-500">
            Takeaways from building in the concrete takeoff space.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {LEARNINGS.map((item) => (
              <div key={item.title} className="rounded-xl border border-zinc-800/80 bg-zinc-950/50 p-5">
                <h3 className="font-medium text-zinc-200">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-500">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo workspace */}
      <section id="try" className="border-t border-zinc-800 py-14">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-semibold tracking-tight">Try it locally</h2>
            <p className="mt-2 text-sm text-zinc-500">
              Start the backend, then upload a structural PDF with a footing schedule. Extract, edit, export CSV.
            </p>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-4 sm:p-6">
            <TakeoffDemo compact />
          </div>
        </div>
      </section>

      <footer className="border-t border-zinc-800 py-8">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-6 text-xs text-zinc-600">
          <span>
            Built by{" "}
            <a href="https://linkedin.com/in/aravindmohan1007" className="text-zinc-400 hover:text-zinc-200">
              Aravind Mohan
            </a>
            {" · "}MS CS (AI/ML), University at Buffalo
          </span>
          <div className="flex gap-4">
            <a href="https://github.com/AravindMohan10/concrete-takeoff-copilot" className="hover:text-zinc-400 transition-colors">
              GitHub
            </a>
            <Link href="/try" className="hover:text-zinc-400 transition-colors">
              Full-screen demo
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
