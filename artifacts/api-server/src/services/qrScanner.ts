import jsQR from "jsqr";
import { logger } from "../lib/logger.js";

export async function decodeQRFromBuffer(imageBuffer: Buffer): Promise<string | null> {
  try {
    const { Jimp } = await import("jimp");
    const image = await Jimp.fromBuffer(imageBuffer);

    const width = image.bitmap.width;
    const height = image.bitmap.height;
    const data = new Uint8ClampedArray(image.bitmap.data);

    const code = jsQR(data, width, height, { inversionAttempts: "dontInvert" });

    if (code?.data) {
      return code.data;
    }

    const codeInverted = jsQR(data, width, height, { inversionAttempts: "onlyInvert" });
    return codeInverted?.data ?? null;
  } catch (err) {
    logger.warn({ err }, "QR decode failed");
    return null;
  }
}

export function isUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}
