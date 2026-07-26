"use client";

import { useEffect, useRef, useState } from "react";

interface VisualizerProps {
  audioRef: React.RefObject<HTMLAudioElement | null>;
}

type VisualizerMode = "bars" | "waveform" | "particles";
type AudioContextConstructor = typeof AudioContext;
type WindowWithWebkitAudioContext = Window & { webkitAudioContext?: AudioContextConstructor };
type AudioGraph = {
  analyser: AnalyserNode;
  audioContext: AudioContext;
  dataArray: Uint8Array<ArrayBuffer>;
};

const audioGraphs = new WeakMap<HTMLAudioElement, AudioGraph>();

export async function resumeAudioGraph(audioElement: HTMLAudioElement) {
  const graph = audioGraphs.get(audioElement);
  if (graph?.audioContext.state === "suspended") {
    await graph.audioContext.resume();
  }
}

function drawBars(ctx: CanvasRenderingContext2D, dataArray: Uint8Array<ArrayBuffer>, canvas: HTMLCanvasElement) {
  const barWidth = (canvas.width / dataArray.length) * 2.5;
  let x = 0;

  for (let index = 0; index < dataArray.length; index++) {
    const barHeight = (dataArray[index] / 255) * canvas.height;
    const hue = (index / dataArray.length) * 360;
    ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
    ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
    x += barWidth + 1;
  }
}

function drawWaveform(ctx: CanvasRenderingContext2D, dataArray: Uint8Array<ArrayBuffer>, canvas: HTMLCanvasElement) {
  ctx.strokeStyle = "#a855f7";
  ctx.lineWidth = 2;
  ctx.beginPath();

  const sliceWidth = canvas.width / dataArray.length;
  let x = 0;

  for (let index = 0; index < dataArray.length; index++) {
    const y = ((dataArray[index] / 128) * canvas.height) / 2;
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
    x += sliceWidth;
  }

  ctx.lineTo(canvas.width, canvas.height / 2);
  ctx.stroke();
}

function drawParticles(ctx: CanvasRenderingContext2D, dataArray: Uint8Array<ArrayBuffer>, canvas: HTMLCanvasElement) {
  const particleCount = 50;
  const averageFrequency = dataArray.reduce((total, value) => total + value, 0) / dataArray.length;

  for (let index = 0; index < particleCount; index++) {
    const angle = (index / particleCount) * Math.PI * 2;
    const radius = (averageFrequency / 255) * 100 + 50;
    const x = canvas.width / 2 + Math.cos(angle) * radius;
    const y = canvas.height / 2 + Math.sin(angle) * radius;
    const size = (dataArray[index % dataArray.length] / 255) * 10;
    const hue = (index / particleCount) * 360;

    ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
}

export default function Visualizer({ audioRef }: VisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<VisualizerMode>("bars");
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const dataArrayRef = useRef<Uint8Array<ArrayBuffer> | null>(null);

  useEffect(() => {
    const audioElement = audioRef.current;
    if (!audioElement) return;

    let graph = audioGraphs.get(audioElement);
    if (!graph) {
      const AudioContextClass = window.AudioContext || (window as WindowWithWebkitAudioContext).webkitAudioContext;
      if (!AudioContextClass) return;

      const audioContext = new AudioContextClass();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;

      const source = audioContext.createMediaElementSource(audioElement);
      source.connect(analyser);
      analyser.connect(audioContext.destination);

      graph = {
        analyser,
        audioContext,
        dataArray: new Uint8Array(analyser.frequencyBinCount),
      };
      audioGraphs.set(audioElement, graph);
    }

    analyserRef.current = graph.analyser;
    audioContextRef.current = graph.audioContext;
    dataArrayRef.current = graph.dataArray;

    const resumeAudioContext = () => void graph.audioContext.resume();
    audioElement.addEventListener("play", resumeAudioContext);

    return () => audioElement.removeEventListener("play", resumeAudioContext);
  }, [audioRef]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !analyserRef.current) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    let animationFrameId = 0;
    const draw = () => {
      const analyser = analyserRef.current!;
      const dataArray = dataArrayRef.current!;

      analyser.getByteFrequencyData(dataArray);

      ctx.fillStyle = "rgba(15, 23, 42, 0.1)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (mode === "bars") {
        drawBars(ctx, dataArray, canvas);
      } else if (mode === "waveform") {
        drawWaveform(ctx, dataArray, canvas);
      } else if (mode === "particles") {
        drawParticles(ctx, dataArray, canvas);
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => cancelAnimationFrame(animationFrameId);
  }, [mode]);

  return (
    <div className="space-y-4">
      <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl overflow-hidden">
        <canvas
          ref={canvasRef}
          className="w-full h-96 bg-gradient-to-b from-slate-900 to-purple-900"
        />
      </div>

      <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-4">
        <p className="text-sm text-slate-400 mb-3">Visualizer Mode</p>
        <div className="flex gap-3">
          {(["bars", "waveform", "particles"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors capitalize ${
                mode === m
                  ? "bg-purple-600 text-white"
                  : "bg-slate-700 text-slate-300 hover:bg-slate-600"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
