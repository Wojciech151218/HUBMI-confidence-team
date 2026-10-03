"use client";

import {
  forceCollide,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY,
  type Simulation,
  type SimulationNodeDatum,
} from "d3-force";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

type BubbleNode = SimulationNodeDatum & { r: number };

type DragState = { index: number; startX: number; startY: number; moved: boolean };

const PADDING = 8;

type SuggestionBubblesProps = {
  labels: string[];
  className?: string;
};

export function SuggestionBubbles({ labels, className = "" }: SuggestionBubblesProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const nodesRef = useRef<BubbleNode[]>([]);
  const simRef = useRef<Simulation<BubbleNode, undefined> | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const suppressClickRef = useRef(false);
  const labelsKey = labels.join("|");

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let width = container.clientWidth;
    let height = container.clientHeight;

    const compact = width < 640;
    const minDiameter = compact ? 104 : 136;
    const labelPadding = compact ? 32 : 56;

    const nodes: BubbleNode[] = buttonRefs.current.map((button) => {
      const label = button?.firstElementChild as HTMLElement | null;
      const diameter = Math.max((label?.offsetWidth ?? 0) + labelPadding, minDiameter);
      if (button) {
        button.style.width = `${diameter}px`;
        button.style.height = `${diameter}px`;
      }
      return {
        r: diameter / 2,
        x: width / 2 + (Math.random() - 0.5) * width * 0.6,
        y: height / 2 + (Math.random() - 0.5) * height * 0.4,
      };
    });
    nodesRef.current = nodes;

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

    const sim = forceSimulation(nodes)
      .force("charge", forceManyBody<BubbleNode>().strength(-12))
      .force("x", forceX<BubbleNode>(width / 2).strength(0.04))
      .force("y", forceY<BubbleNode>(height / 2).strength(0.1))
      .force("collide", forceCollide<BubbleNode>((d) => d.r + PADDING).strength(0.9))
      .on("tick", render);
    simRef.current = sim;

    if (reduceMotion) {
      sim.stop();
      sim.tick(300);
      render();
    }

    const resizeObserver = new ResizeObserver(() => {
      width = container.clientWidth;
      height = container.clientHeight;
      sim.force("x", forceX<BubbleNode>(width / 2).strength(0.04));
      sim.force("y", forceY<BubbleNode>(height / 2).strength(0.1));
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
  }, [labelsKey]);

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
      {labels.map((label, i) => (
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
          className="liquid-glass-chip absolute left-0 top-0 flex cursor-grab items-center justify-center rounded-full text-sm font-semibold text-foreground sm:text-lg transition-[color,border-color,opacity] duration-300 will-change-transform hover:border-accent/40 hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:cursor-grabbing"
        >
          <span className="whitespace-nowrap">{label}</span>
        </button>
      ))}
    </div>
  );
}
