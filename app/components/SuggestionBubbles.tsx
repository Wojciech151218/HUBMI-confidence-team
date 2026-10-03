"use client";

import {
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
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

type BubbleState = "idle" | "active" | "related" | "muted";

type BubbleNode = SimulationNodeDatum & {
  r: number;
  group: number;
  state: BubbleState;
  // Animated scale, driven by a small spring so bubbles bounce when their state changes.
  scale: number;
  scaleVelocity: number;
  // Jelly stretch of the dragged bubble along its direction of travel.
  stretch: number;
  stretchAngle: number;
  // Offset for the idle drift, so bubbles don't bob in sync.
  phase: number;
};
type BubbleLink = SimulationLinkDatum<BubbleNode>;

type DragState = {
  index: number;
  startX: number;
  startY: number;
  lastX: number;
  lastY: number;
  lastTime: number;
  moved: boolean;
};

// Idle motion: the simulation never fully cools, groups orbit the centre and bubbles bob.
const IDLE_ALPHA = 0.1;
const DRAG_ALPHA = 0.3;
const ORBIT_SPEED = (2 * Math.PI) / (180 * 60); // one full turn every ~3 minutes at 60fps
const DRIFT_FORCE = 0.01;

const STATE_SCALE: Record<BubbleState, number> = {
  idle: 1,
  active: 1.12,
  related: 1.05,
  muted: 0.9,
};

type SuggestionBubblesProps = {
  groups: SuggestionGroup[];
  className?: string;
};

// Each topic gets its own anchor on a ring around the centre, so groups settle apart.
function groupCenters(count: number, width: number, height: number) {
  const compact = width < 640;
  const radiusX = width * (compact ? 0.22 : 0.28);
  const radiusY = height * (compact ? 0.24 : 0.26);
  return Array.from({ length: count }, (_, i) => {
    const angle = (2 * Math.PI * i) / count - Math.PI / 2;
    return { x: width / 2 + Math.cos(angle) * radiusX, y: height / 2 + Math.sin(angle) * radiusY };
  });
}

function rotateAround(point: { x: number; y: number }, cx: number, cy: number, angle: number) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const dx = point.x - cx;
  const dy = point.y - cy;
  return { x: cx + dx * cos - dy * sin, y: cy + dx * sin + dy * cos };
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
  // Group centres are stored unrotated; the slow orbit rotates them around the container centre.
  const orbitAngleRef = useRef(0);
  const sizeRef = useRef({ width: 0, height: 0 });
  const idleAlphaRef = useRef(IDLE_ALPHA);
  const reduceMotionRef = useRef(false);
  const targetStretchRef = useRef(0);
  const items = groups.flatMap((group, groupIndex) =>
    group.labels.map((label) => ({ label, group: groupIndex })),
  );
  const groupsKey = JSON.stringify(groups);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    reduceMotionRef.current = reduceMotion;
    idleAlphaRef.current = reduceMotion ? 0 : IDLE_ALPHA;
    let width = container.clientWidth;
    let height = container.clientHeight;

    const compact = width < 640;
    const minDiameter = compact ? 72 : 136;
    const labelPadding = compact ? 18 : 56;
    const gap = compact ? 4 : 8;

    sizeRef.current = { width, height };
    centersRef.current = groupCenters(groups.length, width, height);
    orbitAngleRef.current = 0;
    const centers = () => centersRef.current;
    const orbitCenter = (group: number) =>
      rotateAround(centers()[group], width / 2, height / 2, orbitAngleRef.current);

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
        state: "idle",
        scale: 1,
        scaleVelocity: 0,
        stretch: 0,
        stretchAngle: 0,
        // Mostly shared within a group, so a topic drifts together.
        phase: group * 2.1 + Math.random() * 0.6,
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

        if (reduceMotion) {
          node.scale = STATE_SCALE[node.state];
        } else {
          node.scaleVelocity += (STATE_SCALE[node.state] - node.scale) * 0.25;
          node.scaleVelocity *= 0.65;
          node.scale += node.scaleVelocity;
          const targetStretch = node.state === "active" ? targetStretchRef.current : 0;
          node.stretch += (targetStretch - node.stretch) * 0.25;
        }

        const sx = node.scale * (1 + node.stretch);
        const sy = node.scale * (1 - node.stretch * 0.6);
        const angle = node.stretchAngle;
        button.style.transform =
          `translate3d(${node.x - node.r}px, ${node.y - node.r}px, 0) ` +
          `rotate(${angle}rad) scale(${sx}, ${sy}) rotate(${-angle}rad)`;
      });
      // The stretch relaxes whenever the pointer stops moving.
      targetStretchRef.current *= 0.85;
      container.dataset.ready = "true";
    };

    // Pulls each bubble toward its (orbiting) group centre. The dragged bubble's group is
    // released from its anchor so its links can pull it along.
    const anchorForce = (alpha: number) => {
      for (const node of nodes) {
        if (node.group === draggingGroupRef.current) continue;
        const center = orbitCenter(node.group);
        node.vx = (node.vx ?? 0) + (center.x - (node.x ?? 0)) * 0.05 * alpha;
        node.vy = (node.vy ?? 0) + (center.y - (node.y ?? 0)) * 0.05 * alpha;
      }
    };

    // Gentle per-bubble bobbing while idle.
    let tick = 0;
    const driftForce = () => {
      if (reduceMotion) return;
      tick += 1;
      for (const node of nodes) {
        node.vx = (node.vx ?? 0) + Math.cos(tick * 0.01 + node.phase) * DRIFT_FORCE;
        node.vy = (node.vy ?? 0) + Math.sin(tick * 0.013 + node.phase) * DRIFT_FORCE;
      }
    };

    const sim = forceSimulation(nodes)
      .force(
        "link",
        forceLink<BubbleNode, BubbleLink>(links)
          .distance((link) => {
            const source = link.source as BubbleNode;
            const target = link.target as BubbleNode;
            return source.r + target.r + gap * 2;
          })
          .strength(0.6),
      )
      .force("charge", forceManyBody<BubbleNode>().strength(-40))
      .force("anchor", anchorForce)
      .force("drift", driftForce)
      .force("collide", forceCollide<BubbleNode>((d) => d.r + gap).strength(0.9))
      .alphaTarget(idleAlphaRef.current)
      .on("tick", () => {
        if (!reduceMotion && draggingGroupRef.current === null) {
          orbitAngleRef.current += ORBIT_SPEED;
        }
        render();
      });
    simRef.current = sim;

    if (reduceMotion) {
      sim.stop();
      sim.tick(300);
      render();
    }

    const resizeObserver = new ResizeObserver(() => {
      width = container.clientWidth;
      height = container.clientHeight;
      sizeRef.current = { width, height };
      centersRef.current = groupCenters(groups.length, width, height);
      orbitAngleRef.current = 0;
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

  function setStates(activeIndex: number | null) {
    const nodes = nodesRef.current;
    const activeGroup = activeIndex === null ? null : nodes[activeIndex]?.group;
    nodes.forEach((node, i) => {
      node.state =
        activeIndex === null
          ? "idle"
          : i === activeIndex
            ? "active"
            : node.group === activeGroup
              ? "related"
              : "muted";
      const button = buttonRefs.current[i];
      if (button) button.dataset.state = node.state;
    });
  }

  function localPoint(event: React.PointerEvent) {
    const rect = containerRef.current!.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  function onPointerDown(index: number, event: React.PointerEvent<HTMLButtonElement>) {
    const node = nodesRef.current[index];
    if (!node) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      index,
      startX: event.clientX,
      startY: event.clientY,
      lastX: event.clientX,
      lastY: event.clientY,
      lastTime: event.timeStamp,
      moved: false,
    };
    node.fx = node.x;
    node.fy = node.y;
    draggingGroupRef.current = node.group;
    setStates(index);
    simRef.current?.alphaTarget(DRAG_ALPHA).restart();
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

    if (!reduceMotionRef.current) {
      const now = event.timeStamp;
      const dx = event.clientX - drag.lastX;
      const dy = event.clientY - drag.lastY;
      const speed = Math.hypot(dx, dy) / Math.max(now - drag.lastTime, 1);
      if (speed > 0.05) {
        node.stretchAngle = Math.atan2(dy, dx);
        targetStretchRef.current = Math.min(speed * 0.06, 0.22);
      }
      drag.lastX = event.clientX;
      drag.lastY = event.clientY;
      drag.lastTime = now;
    }
  }

  function onPointerUp() {
    const drag = dragRef.current;
    if (!drag) return;
    const node = nodesRef.current[drag.index];
    node.fx = null;
    node.fy = null;
    // Re-anchor the group where it was dropped (stored unrotated, so it keeps orbiting from there).
    const members = nodesRef.current.filter((n) => n.group === node.group);
    const dropped = {
      x: members.reduce((sum, n) => sum + (n.x ?? 0), 0) / members.length,
      y: members.reduce((sum, n) => sum + (n.y ?? 0), 0) / members.length,
    };
    const { width, height } = sizeRef.current;
    centersRef.current[node.group] = rotateAround(dropped, width / 2, height / 2, -orbitAngleRef.current);
    draggingGroupRef.current = null;
    setStates(null);
    simRef.current?.alphaTarget(idleAlphaRef.current);
    if (!reduceMotionRef.current) simRef.current?.restart();
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
      className={`group/bubbles relative w-full touch-none select-none ${className}`.trim()}
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
          data-state="idle"
          className="bubble liquid-bubble absolute left-0 top-0 flex cursor-grab items-center justify-center rounded-full text-xs font-bold text-foreground opacity-0 will-change-transform group-data-[ready=true]/bubbles:opacity-100 hover:border-accent/40 hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:cursor-grabbing sm:text-lg"
        >
          <span className="relative z-[1] whitespace-nowrap">{label}</span>
        </button>
      ))}
    </div>
  );
}
