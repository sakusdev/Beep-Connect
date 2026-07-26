# Beep-Connect Protocol Draft 0

This document describes the independently designed experimental protocol currently implemented by Beep-Connect.
It is not stable and must not yet be used for interoperability commitments.

## Physical layer

The prototype uses four-frequency shift keying.

| Symbol | Frequency |
| --- | ---: |
| `00` | 4000 Hz |
| `01` | 4500 Hz |
| `10` | 5000 Hz |
| `11` | 5500 Hz |

Each symbol lasts 40 ms and carries two bits. The theoretical raw rate is 50 bit/s.
A short amplitude envelope is applied at each symbol boundary to reduce clicks.

## Byte encoding

Bytes are transmitted most-significant symbol first:

```text
bits 7..6, bits 5..4, bits 3..2, bits 1..0
```

Text payloads are encoded as UTF-8.

## Preamble

The prototype preamble is:

```text
00 01 10 11 00 01 10 11
```

The current receiver searches for this sequence before interpreting subsequent symbols as payload bytes.

## Known limitations

- no packet length field
- no checksum or forward error correction
- no clock recovery
- no carrier-frequency offset estimation
- receiver timing is driven by a browser timer
- no acknowledgement or retransmission

The next protocol revision will add framing, CRC, explicit payload length, symbol-clock synchronization, and test vectors.
