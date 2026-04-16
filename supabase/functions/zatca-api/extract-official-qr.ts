function looksLikeBase64TLV(value: string): boolean {
  if (!/^[A-Za-z0-9+/=\s]+$/.test(value) || value.length < 20) return false;
  try {
    const binary = atob(value.replace(/\s+/g, ''));
    const firstTag = binary.charCodeAt(0);
    return firstTag >= 1 && firstTag <= 9;
  } catch {
    return false;
  }
}

function collectStrings(value: unknown, acc: string[] = []): string[] {
  if (typeof value === 'string') {
    acc.push(value);
    return acc;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectStrings(item, acc);
    return acc;
  }
  if (value && typeof value === 'object') {
    for (const nested of Object.values(value as Record<string, unknown>)) {
      collectStrings(nested, acc);
    }
  }
  return acc;
}

function tryDecodeBase64Xml(value: string): string | null {
  if (!/^[A-Za-z0-9+/=\s]+$/.test(value)) return null;
  try {
    const binary = atob(value.replace(/\s+/g, ''));
    const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
    const decoded = new TextDecoder().decode(bytes);
    return decoded.includes('<') ? decoded : null;
  } catch {
    return null;
  }
}

function extractQrFromXml(xml: string): string | null {
  const patterns = [
    /<cbc:ID>QR<\/cbc:ID>[\s\S]*?<cbc:EmbeddedDocumentBinaryObject[^>]*>([\s\S]*?)<\/cbc:EmbeddedDocumentBinaryObject>/i,
    /<cbc:EmbeddedDocumentBinaryObject[^>]*>([\s\S]*?)<\/cbc:EmbeddedDocumentBinaryObject>/i,
  ];

  for (const pattern of patterns) {
    const match = xml.match(pattern);
    const candidate = match?.[1]?.trim();
    if (candidate && looksLikeBase64TLV(candidate)) {
      return candidate;
    }
  }

  return null;
}

export function extractOfficialQrFromZatcaResponse(payload: unknown): string | null {
  const textCandidates = collectStrings(payload);

  for (const value of textCandidates) {
    const trimmed = value.trim();
    if (!trimmed) continue;

    if (looksLikeBase64TLV(trimmed)) {
      return trimmed;
    }

    const decodedXml = tryDecodeBase64Xml(trimmed);
    if (decodedXml) {
      const qrFromXml = extractQrFromXml(decodedXml);
      if (qrFromXml) return qrFromXml;
    }

    if (trimmed.startsWith('<')) {
      const qrFromXml = extractQrFromXml(trimmed);
      if (qrFromXml) return qrFromXml;
    }
  }

  return null;
}
