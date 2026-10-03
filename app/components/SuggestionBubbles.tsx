"use client";

import {
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY,
  type Simulation,
  type SimulationLinkDatum,
  type SimulationNodeDatum,
} from "d3-force";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

export type SuggestionGroup = {
  topic: string;
  labels: string[];
};

type BubbleNode = SimulationNodeDatum & { r: number; group: number };
type BubbleLink = SimulationLinkDatum<BubbleNode>;

type DragState = { index: number; startX: number; startY: number; moved: boolean };

const PADDING = 8;

type SuggestionBubblesProps = {
  groups: SuggestionGroup[];
  className?: string;
};

// Each topic gets its own anchor on a ring around the centre, so groups settle apart.
function groupCenters(count: number, width: number, height: number) {
  const radiusX = width * 0.28;
  const radiusY = height * 0.26;
  return Array.from({ length: count }, (_, i) => {
    const angle = (2 * Math.PI * i) / count - Math.PI / 2;
    return { x: width / 2 + Math.cos(angle) * radiusX, y: height / 2 + Math.sin(angle) * radiusY };
  });
}

export function SuggestionBubbles({ groups, className = "" }: SuggestionBubblesProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const nodesRef = useRef<BubbleNode[]>([]);
  const simRef = useRef<Simulation<BubbleNode, undefined> | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const suppressClickRef = useRef(false);
  const centersRef = useRef<{ x: number; y: number }[]>([]);
  const draggingGroupRef = useRef<number | null>(null);
  const applyAnchorsRef = useRef<() => void>(() => {});
  const items = groups.flatMap((group, groupIndex) =>
    group.labels.map((label) => ({ label, group: groupIndex })),
  );
  const groupsKey = JSON.stringify(groups);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let width = container.clientWidth;
    let height = container.clientHeight;

    const compact = width < 640;
    const minDiameter = compact ? 104 : 136;
    const labelPadding = compact ? 32 : 56;

    centersRef.current = groupCenters(groups.length, width, height);
    const centers = () => centersRef.current;

    const nodes: BubbleNode[] = buttonRefs.current.map((button, i) => {
      const group = items[i].group;
      const label = button?.firstElementChild as HTMLElement | null;
      const diameter = Math.max((label?.offsetWidth ?? 0) + labelPadding, minDiameter);
      if (button) {
        button.style.width = `${diameter}px`;
        button.style.height = `${diameter}px`;
      }
      return {
        r: diameter / 2,
        group,
        x: centers()[group].x + (Math.random() - 0.5) * 40,
        y: centers()[group].y + (Math.random() - 0.5) * 40,
      };
    });
    nodesRef.current = nodes;

    // Link every pair inside a topic, so dragging one bubble pulls the rest of its group.
    const links: BubbleLink[] = [];
    nodes.forEach((a, i) => {
      nodes.forEach((b, j) => {
        if (j > i && a.group === b.group) links.push({ source: i, target: j });
      });
    });

    const render = () => {
      nodes.forEach((node, i) => {
        node.x = Math.max(node.r, Math.min(width - node.r, node.x ?? 0));
        node.y = Math.max(node.r, Math.min(height - node.r, node.y ?? 0));
        const button = buttonRefs.current[i];
        if (!button) return;
        button.style.transform = `translate3d(${node.x - node.r}px, ${node.y - node.r}px, 0)`;
        button.style.opacity = "1";
      });
    };

    // The dragged bubble's group is released from its anchor so its links can pull it along.
    const anchorStrength = (d: BubbleNode) => (d.group === draggingGroupRef.current ? 0 : 0.05);
    const anchorX = () => forceX<BubbleNode>((d) => centers()[d.group].x).strength(anchorStrength);
    const anchorY = () => forceY<BubbleNode>((d) => centers()[d.group].y).strength(anchorStrength);

    const sim = forceSimulation(nodes)
      .force(
        "link",
        forceLink<BubbleNode, BubbleLink>(links)
          .distance((link) => {
            const source = link.source as BubbleNode;
            const target = link.target as BubbleNode;
            return source.r + target.r + PADDING * 2;
          })
          .strength(0.6),
      )
      .force("charge", forceManyBody<BubbleNode>().strength(-40))
      .force("x", anchorX())
      .force("y", anchorY())
      .force("collide", forceCollide<BubbleNode>((d) => d.r + PADDING).strength(0.9))
      .on("tick", render);
    simRef.current = sim;
    applyAnchorsRef.current = () => {
      sim.force("x", anchorX());
      sim.force("y", anchorY());
    };

    if (reduceMotion) {
      sim.stop();
      sim.tick(300);
      render();
    }

    const resizeObserver = new ResizeObserver(() => {
      width = container.clientWidth;
      height = container.clientHeight;
      centersRef.current = groupCenters(groups.length, width, height);
      applyAnchorsRef.current();
      if (reduceMotion) {
        sim.tick(300);
        render();
      } else {
        sim.alpha(0.5).restart();
      }
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      sim.stop();
      simRef.current = null;
    };
    // groupsKey captures every change to groups/items.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupsKey]);

  function localPoint(event: React.PointerEvent) {
    const rect = containerRef.current!.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  function onPointerDown(index: number, event: React.PointerEvent<HTMLButtonElement>) {
    const node = nodesRef.current[index];
    if (!node) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { index, startX: event.clientX, startY: event.clientY, moved: false };
    node.fx = node.x;
    node.fy = node.y;
    draggingGroupRef.current = node.group;
    applyAnchorsRef.current();
    simRef.current?.alphaTarget(0.3).restart();
  }

  function onPointerMove(event: React.PointerEvent<HTMLButtonElement>) {
    const drag = dragRef.current;
    if (!drag) return;
    if (Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) > 4) {
      drag.moved = true;
    }
    const node = nodesRef.current[drag.index];
    const point = localPoint(event);
    node.fx = point.x;
    node.fy = point.y;
  }

  function onPointerUp() {
    const drag = dragRef.current;
    if (!drag) return;
    const node = nodesRef.current[drag.index];
    node.fx = null;
    node.fy = null;
    // Re-anchor the group where it was dropped, so it stays there.
    const members = nodesRef.current.filter((n) => n.group === node.group);
    centersRef.current[node.group] = {
      x: members.reduce((sum, n) => sum + (n.x ?? 0), 0) / members.length,
      y: members.reduce((sum, n) => sum + (n.y ?? 0), 0) / members.length,
    };
    draggingGroupRef.current = null;
    applyAnchorsRef.current();
    simRef.current?.alphaTarget(0);
    suppressClickRef.current = drag.moved;
    dragRef.current = null;
  }

  function onClick(label: string) {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    router.push(`/search?q=${encodeURIComponent(label)}`);
  }

  return (
    <div
      ref={containerRef}
      role="group"
      aria-label="Popularne wyszukiwania"
      className={`relative w-full touch-none select-none ${className}`.trim()}
    >
      {items.map(({ label }, i) => (
        <button
          key={label}
          ref={(el) => {
            buttonRefs.current[i] = el;
          }}
          type="button"
          onClick={() => onClick(label)}
          onPointerDown={(event) => onPointerDown(i, event)}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          style={{ opacity: 0 }}
          className="liquid-glass-chip absolute left-0 top-0 flex cursor-grab items-center justify-center rounded-full text-sm font-medium text-foreground sm:text-lg transition-[color,border-color,opacity] duration-300 will-change-transform hover:border-accent/40 hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:cursor-grabbing"
        >
          <span className="whitespace-nowrap">{label}</span>
        </button>
      ))}
    </div>
  );
}
