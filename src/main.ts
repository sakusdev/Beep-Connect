/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import "./style.css";
import { CARRIERS, nearestCarrier, symbolsToBytes, transmitText } from "./modem";

const app = document.querySelector<HTMLElement>("#app");
if (!app) throw new Error("Application root was not found");

app.innerHTML = `
  <section class="hero">
    <span class="badge">Early prototype</span>
    <h1>Beep-Connect</h1>
    <p>Send small pieces of data between nearby browsers using sound.</p>
  </section>
  <section class="grid">
    <article class="panel">
      <h2>Transmit</h2>
      <textarea id="message" maxlength="160">Hello from Beep-Connect!</textarea>
      <button id="send">Send acoustic message</button>
      <p id="send-status" class="status">Ready</p>
    </article>
    <article class="panel">
      <h2>Receive diagnostics</h2>
      <button id="listen">Start microphone</button>
      <dl>
        <div><dt>Dominant frequency</dt><dd id="frequency">—</dd></div>
        <div><dt>Nearest symbol</dt><dd id="symbol">—</dd></div>
        <div><dt>Signal level</dt><dd id="level">—</dd></div>
      </dl>
      <p id="receive-status" class="status">Microphone stopped</p>
    </article>
  </section>
  <section class="panel decoded">
    <h2>Experimental symbol capture</h2>
    <p>Press capture while another device transmits. This receiver is intentionally simple and will be replaced with synchronized AudioWorklet DSP.</p>
    <button id="capture" disabled>Capture 8 seconds</button>
    <pre id="output">No capture yet.</pre>
  </section>
`;

const message = document.querySelector<HTMLTextAreaElement>("#message")!;
const sendButton = document.querySelector<HTMLButtonElement>("#send")!;
const sendStatus = document.querySelector<HTMLElement>("#send-status")!;
const listenButton = document.querySelector<HTMLButtonElement>("#listen")!;
const captureButton = document.querySelector<HTMLButtonElement>("#capture")!;
const receiveStatus = document.querySelector<HTMLElement>("#receive-status")!;
const frequencyOutput = document.querySelector<HTMLElement>("#frequency")!;
const symbolOutput = document.querySelector<HTMLElement>("#symbol")!;
const levelOutput = document.querySelector<HTMLElement>("#level")!;
const captureOutput = document.querySelector<HTMLElement>("#output")!;

sendButton.addEventListener("click", async () => {
  sendButton.disabled = true;
  sendStatus.textContent = "Transmitting…";
  try {
    await transmitText(message.value);
    sendStatus.textContent = "Transmission complete";
  } catch (error) {
    sendStatus.textContent = error instanceof Error ? error.message : "Transmission failed";
  } finally {
    sendButton.disabled = false;
  }
});

let context: AudioContext | null = null;
let stream: MediaStream | null = null;
let analyser: AnalyserNode | null = null;
let animationFrame = 0;
let currentSymbol = 0;

function inspectSpectrum(): void {
  if (!context || !analyser) return;
  const bins = new Float32Array(analyser.frequencyBinCount);
  analyser.getFloatFrequencyData(bins);

  let peakBin = 0;
  let peakValue = -Infinity;
  for (let index = 0; index < bins.length; index += 1) {
    if (bins[index] > peakValue) {
      peakValue = bins[index];
      peakBin = index;
    }
  }

  const frequency = (peakBin * context.sampleRate) / analyser.fftSize;
  currentSymbol = nearestCarrier(frequency);
  frequencyOutput.textContent = `${Math.round(frequency)} Hz`;
  symbolOutput.textContent = `${currentSymbol.toString(2).padStart(2, "0")} (${CARRIERS[currentSymbol]} Hz)`;
  levelOutput.textContent = `${peakValue.toFixed(1)} dB`;
  animationFrame = requestAnimationFrame(inspectSpectrum);
}

async function stopListening(): Promise<void> {
  cancelAnimationFrame(animationFrame);
  stream?.getTracks().forEach((track) => track.stop());
  stream = null;
  analyser = null;
  if (context) await context.close();
  context = null;
  listenButton.textContent = "Start microphone";
  captureButton.disabled = true;
  receiveStatus.textContent = "Microphone stopped";
}

listenButton.addEventListener("click", async () => {
  if (context) {
    await stopListening();
    return;
  }

  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
    });
    context = new AudioContext();
    analyser = context.createAnalyser();
    analyser.fftSize = 4096;
    analyser.smoothingTimeConstant = 0.15;
    context.createMediaStreamSource(stream).connect(analyser);
    listenButton.textContent = "Stop microphone";
    captureButton.disabled = false;
    receiveStatus.textContent = "Listening";
    inspectSpectrum();
  } catch (error) {
    receiveStatus.textContent = error instanceof Error ? error.message : "Microphone access failed";
  }
});

captureButton.addEventListener("click", async () => {
  const symbols: number[] = [];
  captureButton.disabled = true;
  captureOutput.textContent = "Capturing…";

  for (let index = 0; index < 200; index += 1) {
    symbols.push(currentSymbol);
    await new Promise((resolve) => setTimeout(resolve, 40));
  }

  const preamble = "01230123";
  const raw = symbols.join("");
  const start = raw.indexOf(preamble);
  if (start < 0) {
    captureOutput.textContent = `Preamble not found.\nRaw symbols: ${raw}`;
  } else {
    const payloadSymbols = symbols.slice(start + preamble.length);
    const bytes = symbolsToBytes(payloadSymbols);
    captureOutput.textContent = new TextDecoder().decode(bytes).replace(/\0+$/g, "");
  }
  captureButton.disabled = false;
});
