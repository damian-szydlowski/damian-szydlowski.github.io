// Built using Hyperiux Vault: https://vault.hyperiux.com
"use client";

import {
  type CSSProperties,
  useLayoutEffect,
  useRef,
  useSyncExternalStore,
} from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const monthOrder = {
  January: 1,
  February: 2,
  March: 3,
  April: 4,
  May: 5,
  June: 6,
  July: 7,
  August: 8,
  September: 9,
  October: 10,
  November: 11,
  December: 12,
} as const;

type Month = keyof typeof monthOrder;

export type JourneyItem = {
  id: string;
  year: string;
  month?: Month;
  content: string;
  closing?: boolean;
};

export type TimelineProps = {
  /** Owner-supplied entries; the sample storyline is used only by the demo. */
  items?: JourneyItem[];
  title?: string;
  eyebrow?: string;
  headingId?: string;
  textColor?: string;
  mutedTextColor?: string;
  activeColor?: string;
  backgroundColor?: string;
  /** Reveal animation duration, in seconds. */
  duration?: number;
  /** Fallback reveal duration when `duration` is omitted, in seconds. */
  scrollDuration?: number;
};

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeToReducedMotion(callback: () => void) {
  if (typeof window === "undefined") return () => {};

  const mediaQueryList = window.matchMedia(REDUCED_MOTION_QUERY);
  mediaQueryList.addEventListener("change", callback);

  return () => mediaQueryList.removeEventListener("change", callback);
}

function getReducedMotionSnapshot() {
  if (typeof window === "undefined") return false;

  return window.matchMedia?.(REDUCED_MOTION_QUERY)?.matches ?? false;
}

function getServerReducedMotionSnapshot() {
  return false;
}

function usePrefersReducedMotion() {
  return useSyncExternalStore(
    subscribeToReducedMotion,
    getReducedMotionSnapshot,
    getServerReducedMotionSnapshot,
  );
}

const topJourneyData: JourneyItem[] = [
  {
    id: "2020-march",
    year: "2020",
    month: "March",
    content: "Signal research turns scattered notes into a clear product thesis",
  },
  {
    id: "2021-july",
    year: "2021",
    month: "July",
    content: "Founding release ships with the first live customer journeys",
  },
  {
    id: "2023-april",
    year: "2023",
    month: "April",
    content: "Automation layer connects insight, publishing, and sales motion",
  },
  {
    id: "2026-may",
    year: "2026",
    month: "May",
    content: "New markets open with localized launches and faster onboarding",
  },
];

const bottomJourneyData: JourneyItem[] = [
  {
    id: "2020-november",
    year: "2020",
    month: "November",
    content: "Prototype sprint validates the experience with real operators",
  },
  {
    id: "2022-october",
    year: "2022",
    month: "October",
    content: "Community feedback reshapes the roadmap into sharper releases",
  },
  {
    id: "2025-september",
    year: "2025",
    month: "September",
    content: "Companion mobile workflows make the timeline travel-ready",
  },
];

const allJourneyItems: JourneyItem[] = [
  ...topJourneyData,
  ...bottomJourneyData,
].sort((a, b) => {
  const yearDiff = Number(a.year) - Number(b.year);
  if (yearDiff !== 0) return yearDiff;
  return monthOrder[a.month ?? "January"] - monthOrder[b.month ?? "January"];
});

export default function Timeline({
  items,
  title = "Product Storyline",
  eyebrow = "Journey",
  headingId = "journey-title",
  textColor = "var(--color-foreground, #000000)",
  mutedTextColor = "var(--color-muted-foreground, #3f3f46)",
  activeColor = "#ff5f00",
  backgroundColor = "var(--color-background, #ffffff)",
  duration,
  scrollDuration = 0.45,
}: TimelineProps) {
  const journeyItems = items ?? allJourneyItems;
  const sectionRef = useRef<HTMLElement>(null);
  const wholeSliderRef = useRef<HTMLDivElement>(null);
  const reducedMotion = usePrefersReducedMotion();
  const fadeDuration = Math.min(0.6, Math.max(0.2, duration ?? scrollDuration));
  const sectionStyle = {
    color: textColor,
    backgroundColor,
    "--journey-accent": activeColor,
    "--journey-muted": mutedTextColor,
    "--journey-steps": Math.max(0, journeyItems.length - 1),
  } as CSSProperties;

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const track = wholeSliderRef.current;
    if (!section || !track || reducedMotion) return;

    const viewport = section.querySelector<HTMLElement>("[data-journey-viewport]")!;
    const heading = section.querySelector<HTMLHeadingElement>("h2")!;
    const first = section.querySelector<HTMLElement>("[data-journey-item]");
    const last = section.querySelector<HTMLElement>("[data-journey-item]:last-child");
    const endStar = track.querySelector<HTMLElement>(".journey-end-star");
    const headerHeight = () => parseFloat(getComputedStyle(viewport).top) || 0;
    // Keep one intentional stop immediately before the timeline starts drawing.
    const hold = () => Math.min(100, viewport.clientHeight * 0.12);
    const endHold = () => Math.min(160, viewport.clientHeight * 0.18);
    const opening = () => Math.min(320, window.innerWidth * 0.45);
    // Give the same horizontal travel twice as much vertical scroll room.
    const scrollPace = 2;
    const openingTravel = () => opening() * scrollPace;
    const trackOffset = (entry: HTMLElement) => entry.getBoundingClientRect().left - track.getBoundingClientRect().left;
    const origin = () => heading.getBoundingClientRect().right - track.getBoundingClientRect().left + Math.min(32, Math.max(16, window.innerWidth * 0.04));
    const offset = (entry: HTMLElement) => trackOffset(entry) - origin();
    const distance = () => {
      if (!last) return 0;
      const gutter = parseFloat(getComputedStyle(track).paddingLeft);
      // Finish with the closing entry on the right, rather than sweeping it
      // across to the left and leaving the rest of the screen empty.
      const finalGutter = last.classList.contains("journey-item-closing") ? 20 : gutter;
      const finalPosition = Math.max(gutter, viewport.clientWidth - finalGutter - last.clientWidth);
      return Math.max(0, trackOffset(last) - finalPosition);
    };
    const railTravel = () => distance() * scrollPace;
    const totalTravel = () => openingTravel() + railTravel();
    const firstOffset = () => first ? offset(first) : 0;
    const lineLength = () => last ? offset(last) + (last.classList.contains("journey-item-closing") ? 0 : last.clientWidth * 0.75) : 0;
    const start = () => section.getBoundingClientRect().top + window.scrollY - headerHeight() + hold();
    const measure = () => {
      // CSS does the pinning; native scrolling supplies the travel distance.
      track.style.setProperty("--journey-origin-x", `${origin()}px`);
      section.style.height = `${viewport.clientHeight + hold() + totalTravel() + endHold()}px`;
      // Stop at the same pinned frame reached by the section's navigation link.
      section.dataset.scrollPauseStart = String(hold() - headerHeight());
      // Let wheel scrolling catch the exact completed drawing position before
      // momentum can carry the visitor straight into Projects.
      section.dataset.scrollPauseEnd = String(hold() + totalTravel() - headerHeight());
    };

    measure();
    let finalStarGrowth: Animation | undefined;
    const context = gsap.context(() => {
      const unfold = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: section,
          start,
          end: () => start() + totalTravel(),
          scrub: true,
          invalidateOnRefresh: true,
        },
      });
      // First draw out from the orange origin while the heading holds still.
      // Then extend the rail and pan together, opening each branch in turn.
      unfold.fromTo(".journey-line", { width: 0 }, {
        width: firstOffset,
        duration: openingTravel(),
      }, 0).to(".journey-line", {
        width: lineLength,
        duration: railTravel(),
      }, openingTravel()).fromTo(track, { x: 0 }, {
        x: () => -distance(),
        duration: railTravel(),
      }, openingTravel());

      section.querySelectorAll<HTMLElement>("[data-journey-item]").forEach(entry => {
        const text = entry.querySelector<HTMLElement>(".journey-copy")!;
        const stem = entry.querySelector<HTMLElement>(".journey-stem");
        const dot = entry.querySelector<HTMLElement>(".journey-dot");
        const closing = entry.classList.contains("journey-item-closing");
        const branchStart = () => openingTravel() + railTravel() * (offset(entry) - firstOffset()) / Math.max(1, lineLength() - firstOffset());
        const branchTravel = Math.min(140 * scrollPace, window.innerWidth * 0.25 * scrollPace, Math.max(1, (totalTravel() - branchStart()) * 0.8));
        if (stem && dot) {
          unfold.fromTo(stem, { scaleY: 0 }, {
            scaleY: 1, duration: branchTravel,
          }, branchStart()).fromTo(dot, { scale: 0 }, {
            scale: 1, duration: branchTravel * 0.4,
          }, branchStart() + branchTravel * 0.6);
        }
        if (endStar) {
          const pulsePosition = () => closing
            ? start() + totalTravel() - Math.min(80 * scrollPace, railTravel() * 0.15)
            : start() + branchStart();
          const pulse = closing ? undefined : gsap.fromTo(endStar, { scale: 1 }, {
            scale: 1.8,
            duration: 0.16,
            yoyo: true,
            repeat: 1,
            ease: "power2.out",
            paused: true,
            overwrite: "auto",
          });
          ScrollTrigger.create({
            trigger: section,
            start: pulsePosition,
            end: () => pulsePosition() + 1,
            invalidateOnRefresh: true,
            onEnter: () => {
              if (closing) {
                endStar.classList.add("journey-end-star--future");
                finalStarGrowth?.cancel();
                finalStarGrowth = endStar.animate(
                  [{ transform: "scale(1)" }, { transform: "scale(2.2)" }],
                  { duration: 300, easing: "ease-out", fill: "forwards" },
                );
              } else pulse?.restart();
            },
            onEnterBack: () => {
              if (closing) {
                endStar.classList.add("journey-end-star--future");
                finalStarGrowth?.cancel();
                finalStarGrowth = endStar.animate(
                  [{ transform: "scale(1)" }, { transform: "scale(2.2)" }],
                  { duration: 300, easing: "ease-out", fill: "forwards" },
                );
              } else pulse?.restart();
            },
            onLeaveBack: () => {
              if (closing) {
                endStar.classList.remove("journey-end-star--future");
                finalStarGrowth?.cancel();
                finalStarGrowth = undefined;
              }
            },
          });
        }

        // Geometry follows scroll position; text fades as one complete block
        // in real time, so a slow scroll never leaves clipped text lines.
        gsap.fromTo(text, { opacity: 0 }, {
          opacity: 1,
          duration: fadeDuration,
          ease: "power1.out",
          scrollTrigger: {
            trigger: section,
            start: () => closing
              ? start() + totalTravel() - Math.min(80 * scrollPace, railTravel() * 0.15)
              : start() + branchStart() + branchTravel * 0.6,
            toggleActions: "play none none reverse",
          },
        });
      });
    }, section);

    ScrollTrigger.addEventListener("refreshInit", measure);
    return () => {
      ScrollTrigger.removeEventListener("refreshInit", measure);
      finalStarGrowth?.cancel();
      context.revert();
      section.style.removeProperty("height");
      delete section.dataset.scrollPauseStart;
      delete section.dataset.scrollPauseEnd;
    };
  }, [fadeDuration, journeyItems, reducedMotion]);

  return (
    <section ref={sectionRef} id="journey" className="journey" style={sectionStyle} aria-labelledby={headingId}>
      <div data-journey-viewport className="journey-viewport">
        <div ref={wholeSliderRef} data-journey-track className="journey-track">
          <div className="journey-line" aria-hidden="true">
            <span className="journey-star-anchor"><span className="journey-end-star" /></span>
          </div>
          <div className="journey-intro">
            <p className="eyebrow">{eyebrow}</p>
            <h2 id={headingId}>{title}</h2>
            <ol className="sr-only">
              {journeyItems.map(item => <li key={item.id}>{[item.year, item.month, item.content].filter(Boolean).join(" · ")}</li>)}
            </ol>
          </div>
          <div className="journey-body" aria-hidden="true">
            {journeyItems.map((item, index) => (
              <div
                key={item.id}
                data-journey-item={item.id}
                className={`journey-item ${item.closing ? "journey-item-closing" : index % 2 ? "journey-item-bottom" : "journey-item-top"}`}
                style={{ "--journey-index": index } as CSSProperties}
              >
                {!item.closing && <><div className="journey-stem" /><div className="journey-dot" /></>}
                <div className="journey-copy">
                  <h3 className={`title-${item.id}`}>{item.closing ? item.content : <>{item.year} {item.month}</>}</h3>
                  {!item.closing && <p className={`description-${item.id}`}>{item.content}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="journey-footer shell">
          <a className="text-link" href="#work">Continue to projects <span aria-hidden="true">↓</span></a>
        </div>
      </div>
    </section>
  );
}
