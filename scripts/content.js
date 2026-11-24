/**
 * Edit this file to curate the portfolio. These entries are labelled placeholders,
 * not claims about completed projects or photographs. See README.md for examples.
 * Paths are relative to the HTML page. Keep IDs unique and stable.
 * An image: { src, width, height, alt, variants?: [{ src, width }] }.
 */
export const projectContexts = { work: "Work", school: "School", personal: "Personal" };
export const photoCategories = { portraits: "Portraits", products: "Products", events: "Events" };

export const projects = [
  {
    id: "work-placeholder", title: "From the workbench", context: "work",
    summary: "A space for the projects shaped by professional experience.",
    organization: "Company details coming soon", date: "", tags: [], placeholder: true,
    cover: { src: "assets/placeholders/project-work.svg", width: 960, height: 660, alt: "Abstract circuit illustration, a placeholder for a work project" },
    overview: "The story behind a work project will live here. Project details and images are being prepared.",
    contribution: "Details of my role and contribution are coming soon.",
    approach: "The design process, tools, and engineering decisions will be added here.",
    outcome: "Results and lessons will be shared with the finished project story.",
    images: [], links: [], model: null,
  },
  {
    id: "school-placeholder", title: "Theory into practice", context: "school",
    summary: "A space for ideas explored through coursework and collaboration.",
    organization: "Education details coming soon", date: "", tags: [], placeholder: true,
    cover: { src: "assets/placeholders/project-school.svg", width: 960, height: 660, alt: "Abstract mechanical drawing, a placeholder for a school project" },
    overview: "An academic project story is coming soon, including its brief and the work that went into it.",
    contribution: "My contribution and any collaborators will be described here.",
    approach: "The process from the initial idea to the final design is coming soon.",
    outcome: "Project results and lessons learned are coming soon.",
    images: [], links: [], model: null,
  },
  {
    id: "personal-placeholder", title: "Following a what-if", context: "personal",
    summary: "A space for independent experiments and curiosity-led projects.",
    organization: "", date: "", tags: [], placeholder: true,
    cover: { src: "assets/placeholders/project-personal.svg", width: 960, height: 660, alt: "Abstract orbital drawing, a placeholder for a personal project" },
    overview: "A personal project story will be added here, from the spark of an idea to the things learned along the way.",
    contribution: "Details of what I designed and built are coming soon.",
    approach: "Experiments, tools, and iterations will be shared here.",
    outcome: "The finished work and what comes next will be added soon.",
    images: [], links: [], model: null,
  },
  {
    id: "work-study-placeholder", title: "An engineering study", context: "work",
    summary: "A second space for a work project. Details are coming soon.",
    organization: "", date: "", tags: [], placeholder: true,
    cover: { src: "assets/placeholders/project-work.svg", width: 960, height: 660, alt: "Abstract circuit illustration, a placeholder for another work project" },
    overview: "This is a placeholder for a future project story. The brief, my contribution, and the finished work will be added here.",
    images: [], links: [], model: null,
  },
  {
    id: "school-study-placeholder", title: "A design exploration", context: "school",
    summary: "A second space for a school project. Details are coming soon.",
    organization: "", date: "", tags: [], placeholder: true,
    cover: { src: "assets/placeholders/project-school.svg", width: 960, height: 660, alt: "Abstract mechanical drawing, a placeholder for another school project" },
    overview: "This is a placeholder for a future project story. The design process and lessons learned will be added with the actual project details.",
    images: [], links: [], model: null,
  },
  {
    id: "personal-study-placeholder", title: "The next experiment", context: "personal",
    summary: "A second space for a personal project. Details are coming soon.",
    organization: "", date: "", tags: [], placeholder: true,
    cover: { src: "assets/placeholders/project-personal.svg", width: 960, height: 660, alt: "Abstract orbital drawing, a placeholder for another personal project" },
    overview: "This is a placeholder for a future project story. Original images and the story behind the experiment will be added here.",
    images: [], links: [], model: null,
  },
];

// A photograph can belong to multiple categories. Array order is gallery order.
// The photography introduction uses the first featured real photo, or a featured placeholder.
export const photos = [
  { id: "portrait-study", title: "Portraits / 01", categories: ["portraits"], featured: false, placeholder: true,
    caption: "Placeholder artwork · Original portrait coming soon",
    image: { src: "assets/placeholders/study-01.svg", width: 1000, height: 1000, alt: "Circle and reference lines; square portrait photograph placeholder" } },
  { id: "product-study", title: "Objects / 01", categories: ["products"], featured: true, placeholder: true,
    caption: "Placeholder artwork · Original product photograph coming soon",
    image: { src: "assets/placeholders/study-02.svg", width: 1200, height: 800, alt: "Isometric object outline; landscape product photograph placeholder" } },
  { id: "event-study", title: "Moments / 01", categories: ["events"], featured: true, placeholder: true,
    caption: "Placeholder artwork · Original event photograph coming soon",
    image: { src: "assets/placeholders/study-03.svg", width: 1200, height: 800, alt: "Three circles and horizontal guides; landscape event photograph placeholder" } },
  { id: "product-light", title: "Objects / 02", categories: ["products"], featured: true, placeholder: true,
    caption: "Placeholder artwork · Original product photograph coming soon",
    image: { src: "assets/placeholders/study-04.svg", width: 1000, height: 1000, alt: "Rectangle and circle study; square product photograph placeholder" } },
  { id: "portrait-light", title: "Portraits / 02", categories: ["portraits"], featured: true, placeholder: true,
    caption: "Placeholder artwork · Original portrait coming soon",
    image: { src: "assets/placeholders/study-05.svg", width: 750, height: 1000, alt: "Framing study; vertical portrait photograph placeholder" } },
  { id: "event-light", title: "Moments / 02", categories: ["events"], featured: true, placeholder: true,
    caption: "Placeholder artwork · Original event photograph coming soon",
    image: { src: "assets/placeholders/study-06.svg", width: 1200, height: 800, alt: "Horizon line study; landscape event photograph placeholder" } },
];
