import { html, attributes } from "./references.md";

export default function Blog() {
  // Pulling potential frontmatter metadata from your markdown file
  const {
    title = "References",
    date = "July 17, 2026",
    author = "Staff Writer",
  } = attributes;

  return (
    /*
      - bg-slate-950: Ultra-dark base background
      - text-purple-100: Soft, bright lavender text for excellent contrast without pure-white eye strain
    */
    <article className="max-w-3xl mx-auto px-4 py-12 font-serif text-purple-100 antialiased min-h-screen bg-slate-950">
      {/* Editorial Header */}
      <header className="mb-8 font-sans">
        <span className="text-xs font-bold tracking-widest text-purple-400 uppercase">
          Data & Society
        </span>
        {/* text-white ensures maximum contrast for the main heading */}
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          Creating an Optimal World with Data Presentation
        </h1>
        <div className="mt-4 flex items-center text-sm text-purple-300/70 gap-2">
          <span className="font-semibold text-purple-200">{author}</span>
          <span className="text-purple-800">•</span>
          <time dateTime={date}>{date}</time>
        </div>
      </header>

      {/* Responsive Media Container */}
      <div className="my-8 aspect-video w-full overflow-hidden rounded-xl bg-slate-900 shadow-xl border border-purple-900/40">
        <iframe
          className="w-full h-full"
          src="https://embed.figma.com/slides/m32R1HooMTzoAIrW3mn0ZS/Creating-an-optimal-world-with-data-presentation?node-id=160-97&embed-host=share"
          allowFullScreen
          title="Figma Slides: Creating an optimal world with data presentation"
          loading="lazy"
        />
      </div>

      {/* Professional Editorial Content Layout */}
      {/* border-purple-900/40 keeps the divider subtle and thematic */}
      <footer className="mt-12 border-t border-purple-900/40 pt-8">
        <h2 className="font-sans text-xl font-bold tracking-tight text-white mb-6">
          {title}
        </h2>

        {/* Tailwind Prose/Typography emulation for injected HTML in dark mode */}
        <div
          className="prose max-w-none font-serif
                     prose-headings:font-sans prose-headings:font-bold prose-headings:text-white
                     prose-p:text-purple-100 prose-p:leading-relaxed prose-p:mb-4
                     prose-a:text-purple-400 prose-a:underline hover:prose-a:text-purple-300"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </footer>
    </article>
  );
}
