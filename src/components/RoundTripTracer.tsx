import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Play, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CodeBlockLine } from "@/components/ui/code-block";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { TripStop } from "@/content/types";
import { browserClock, createTracer } from "@/motion/player";
import { SampleCode } from "./SampleCode";

const playClass =
  "border-0 bg-gradient-to-r from-indigo-500 to-cyan-400 text-white shadow-sm hover:from-indigo-500 hover:to-cyan-300";

function nodeStatus(at: number, stopAt: number): string {
  if (Math.abs(at - stopAt) < 0.2) return "当前";
  if (at > stopAt) return "已经过";
  return "待到达";
}

export function RoundTripTracer({
  stops,
  initialId,
  prompt,
}: {
  stops: TripStop[];
  initialId: string;
  prompt: string;
}) {
  const initial = stops.find((stop) => stop.id === initialId) ?? stops[0];
  const [at, setAt] = useState(initial.at);
  const [shownId, setShownId] = useState<string>(initial.id);
  const [packet, setPacket] = useState(initial.packet);
  const [playing, setPlaying] = useState(false);
  const [left, setLeft] = useState(0);
  const [log, setLog] = useState<string[]>([initial.id]);
  const stageRef = useRef<HTMLDivElement>(null);
  const seeking = useRef(false);
  const api = useRef<{ play: () => void; seek: (id: string) => void; reset: () => void } | null>(null);

  useEffect(() => {
    const clock = browserClock();
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const tracer = createTracer({
      stops: stops.map((stop) => ({ id: stop.id, at: stop.at, packet: stop.packet })),
      travelMs: reduced ? 1 : 900,
      startId: initial.id,
      clock,
      onChange: (state) => {
        setAt(state.at);
        setPacket(state.packet);
        setPlaying(state.playing);
        if (!state.playing) seeking.current = false;
        if (!seeking.current) setShownId(state.stopId);
      },
    });
    api.current = tracer;
    return () => tracer.stop();
  }, [stops, initial.id]);

  useEffect(() => {
    setLog((previous) => (previous.at(-1) === shownId ? previous : [...previous, shownId]));
  }, [shownId]);

  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const place = () => {
      const nodes = [...stage.querySelectorAll<HTMLElement>("[data-node]")];
      if (nodes.length === 0) return;
      const bounds = stage.getBoundingClientRect();
      const centers = nodes.map((node) => {
        const rect = node.getBoundingClientRect();
        return rect.left - bounds.left + rect.width / 2;
      });
      const max = centers.length - 1;
      const position = Math.min(max, Math.max(0, at));
      const index = Math.floor(position);
      const fraction = position - index;
      const start = centers[index];
      const end = centers[Math.min(max, index + 1)];
      setLeft(start + (end - start) * fraction);
    };
    place();
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, [at]);

  const shown = stops.find((stop) => stop.id === shownId) ?? stops[0];
  const wireLines = shown.wire.split("\n");
  const lastAt = stops.at(-1)?.at ?? 0;
  const arrived = !playing && lastAt > 0 && at >= lastAt - 0.05;
  const tripStatus = playing ? "移动中" : arrived ? "已到达" : "待追踪";

  return (
    <Card className="rounded-2xl border border-slate-200 bg-white shadow-[0_10px_30px_-18px_rgba(15,23,42,0.35)] ring-0">
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle>追踪一次往返</CardTitle>
          <Badge variant="secondary">{tripStatus}</Badge>
        </div>
        <CardDescription>{prompt}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button
            className={playClass}
            disabled={playing}
            onClick={() => {
              seeking.current = false;
              api.current?.play();
            }}
          >
            <Play />
            追踪往返
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              seeking.current = false;
              api.current?.reset();
              setShownId(stops[0].id);
              setLog([stops[0].id]);
            }}
          >
            <RotateCcw />
            重置
          </Button>
        </div>
        <div ref={stageRef} data-testid="trip-stage" className="relative px-2 pt-10 pb-2">
          <div className="absolute top-5 right-10 left-10 h-px bg-slate-200" />
          <div className="relative z-20 grid grid-cols-3 gap-3">
            {stops.map((stop) => {
              const status = nodeStatus(at, stop.at);
              return (
                <button
                  key={stop.id}
                  type="button"
                  data-node
                  data-lit={status === "当前" ? "true" : "false"}
                  className="relative z-20 rounded-2xl border border-slate-200 bg-white px-3 py-4 text-center shadow-sm data-[lit=true]:border-cyan-400 data-[lit=true]:shadow-[0_0_0_3px_rgba(34,211,238,0.2)]"
                  onClick={() => {
                    seeking.current = true;
                    setShownId(stop.id);
                    api.current?.seek(stop.id);
                  }}
                >
                  <span className="block text-sm font-semibold">{stop.label}</span>
                  <Badge variant={status === "当前" ? "default" : "outline"} className="mt-2">
                    {status}
                  </Badge>
                </button>
              );
            })}
          </div>
          <div
            data-testid="trip-packet"
            data-at={at}
            className="pointer-events-none absolute z-10 rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400 px-3 py-1 text-xs font-semibold text-white shadow-md"
            style={{ left, top: 20, transform: "translate(-50%, -50%)", transition: "none" }}
          >
            {packet}
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
          <SampleCode title={shown.title} value={shown.wire}>
            {wireLines.map((line, index) => (
              <CodeBlockLine key={`${shown.id}-${index}`} variant={line.startsWith("#") ? "highlighted" : "default"}>
                {line}
              </CodeBlockLine>
            ))}
          </SampleCode>
          <aside className="rounded-2xl border border-teal-100 border-l-4 border-l-teal-500 bg-teal-50/70 p-4" aria-live="polite">
            <p className="text-xs font-medium tracking-wide text-teal-700">这一站</p>
            <h3 className="mt-1 text-base font-semibold">{shown.label}</h3>
            <p className="mt-3 text-sm leading-6 text-slate-700">{shown.note}</p>
          </aside>
        </div>
        <ScrollArea className="h-36 rounded-2xl border border-slate-200">
          <div className="space-y-2 p-3">
            {log.map((id, index) => {
              const stop = stops.find((item) => item.id === id);
              if (!stop) return null;
              return (
                <div key={`${id}-${index}`} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                  <span className="font-medium">{stop.label}</span>
                  <span className="mt-1 block text-muted-foreground">{stop.note}</span>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
