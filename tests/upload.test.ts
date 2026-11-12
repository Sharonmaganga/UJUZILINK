import { describe, expect, it } from "vitest";
import { sniffImageType } from "@/lib/upload";

const bytes = (...parts: (number[] | string)[]) =>
  new Uint8Array(parts.flatMap((p) => (typeof p === "string" ? [...p].map((c) => c.charCodeAt(0)) : p)));

describe("sniffImageType", () => {
  it("recognises real image signatures", () => {
    expect(sniffImageType(bytes([0xff, 0xd8, 0xff, 0xe0], "JFIF"))).toBe("image/jpeg");
    expect(sniffImageType(bytes([0x89], "PNG", [0x0d, 0x0a, 0x1a, 0x0a]))).toBe("image/png");
    expect(sniffImageType(bytes("RIFF", [0, 0, 0, 0], "WEBPVP8 "))).toBe("image/webp");
    expect(sniffImageType(bytes([0, 0, 0, 24], "ftypheic"))).toBe("image/heic");
  });

  it("rejects files that only claim to be images", () => {
    expect(sniffImageType(bytes("<html><script>alert(1)</script>"))).toBeNull();
    expect(sniffImageType(bytes("%PDF-1.7"))).toBeNull();
    expect(sniffImageType(new Uint8Array())).toBeNull();
  });
});
