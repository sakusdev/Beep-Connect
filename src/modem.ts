/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

export const CARRIERS = [4000, 4500, 5000, 5500] as const;
export const SYMBOL_DURATION_MS = 40;

export function bytesToSymbols(bytes: Uint8Array): number[] {
  const symbols: number[] = [];
  for (const byte of bytes) {
    symbols.push((byte >> 6) & 0b11, (byte >> 4) & 0b11, (byte >> 2) & 0b11, byte & 0b11);
  }
  return symbols;
}

export function symbolsToBytes(symbols: number[]): Uint8Array {
  const completeLength = symbols.length - (symbols.length % 4);
  const output = new Uint8Array(completeLength / 4);
  for (let index = 0; index < completeLength; index += 4) {
    output[index / 4] =
      ((symbols[index] & 0b11) << 6) |
      ((symbols[index + 1] & 0b11) << 4) |
      ((symbols[index + 2] & 0b11) << 2) |
      (symbols[index + 3] & 0b11);
  }
  return output;
}

export async function transmitText(text: string): Promise<void> {
  const context = new AudioContext();
  await context.resume();

  const payload = new TextEncoder().encode(text);
  const symbols = [0, 1, 2, 3, 0, 1, 2, 3, ...bytesToSymbols(payload)];
  const symbolSeconds = SYMBOL_DURATION_MS / 1000;
  const gain = context.createGain();
  gain.gain.value = 0.12;
  gain.connect(context.destination);

  const start = context.currentTime + 0.08;
  symbols.forEach((symbol, index) => {
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    const begin = start + index * symbolSeconds;
    const end = begin + symbolSeconds;

    oscillator.type = "sine";
    oscillator.frequency.value = CARRIERS[symbol];
    envelope.gain.setValueAtTime(0, begin);
    envelope.gain.linearRampToValueAtTime(1, begin + 0.003);
    envelope.gain.setValueAtTime(1, end - 0.003);
    envelope.gain.linearRampToValueAtTime(0, end);

    oscillator.connect(envelope).connect(gain);
    oscillator.start(begin);
    oscillator.stop(end);
  });

  const totalDuration = symbols.length * symbolSeconds + 0.2;
  await new Promise((resolve) => setTimeout(resolve, totalDuration * 1000));
  await context.close();
}

export function nearestCarrier(frequency: number): number {
  let bestIndex = 0;
  let bestDistance = Number.POSITIVE_INFINITY;
  CARRIERS.forEach((carrier, index) => {
    const distance = Math.abs(carrier - frequency);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestIndex = index;
    }
  });
  return bestIndex;
}
