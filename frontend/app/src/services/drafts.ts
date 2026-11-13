import { Directory, File, Paths } from 'expo-file-system';
import { getAccessToken } from './session';
import { getCurhatHistory, getCurhatHistoryDetail } from './api';

export type Draft = {
  kind: 'text' | 'audio'; text?: string; uri?: string; duration?: number;
  revision: number; baseline?: number[]; uploadName?: string;
};
export async function draftOwner() {
  const token = await getAccessToken();
  if (!token) throw new Error('Silakan masuk kembali untuk membuka cerita akunmu.');
  const encoded = token.split('.')[1]?.replace(/-/g, '+').replace(/_/g, '/');
  const payload = JSON.parse(atob(encoded.padEnd(Math.ceil(encoded.length / 4) * 4, '=')));
  const id = String(payload.user_id ?? payload.sub ?? '');
  if (!/^[a-zA-Z0-9_-]+$/.test(id)) throw new Error('Identitas akun belum tersedia. Silakan masuk kembali.');
  return id;
}
function directory(owner: string) {
  const dir = new Directory(Paths.document, 'curhat-drafts', owner);
  dir.create({ intermediates: true, idempotent: true });
  return dir;
}
// Dua salinan bergantian: tulisan terputus tidak merusak salinan sebelumnya.
export function readDraft(owner: string, kind: Draft['kind']): Draft | null {
  const drafts: Draft[] = [];
  for (const slot of [0, 1]) {
    const file = new File(directory(owner), `${kind}-${slot}.json`);
    if (!file.exists) continue;
    try {
      const draft = JSON.parse(file.textSync());
      if (draft.kind === kind && Number.isFinite(draft.revision)) drafts.push(draft);
    } catch { /* Gunakan salinan lain jika penulisan terputus. */ }
  }
  return drafts.sort((a, b) => b.revision - a.revision)[0] ?? null;
}
export function writeDraft(owner: string, value: Omit<Draft, 'revision'>): Draft {
  const previous = readDraft(owner, value.kind);
  const revision = previous ? previous.revision + 1 : Date.now();
  const draft = { ...value, revision };
  new File(directory(owner), `${value.kind}-${revision % 2}.json`).write(JSON.stringify(draft));
  return draft;
}
export function removeDraft(owner: string, kind: Draft['kind']) {
  for (const slot of [0, 1]) {
    const file = new File(directory(owner), `${kind}-${slot}.json`);
    if (file.exists) file.delete();
  }
}
export function validAnalysis(result: any): boolean {
  return !!result && typeof result === 'object' && !Array.isArray(result) &&
    ['emosi', 'ringkasan_cerita', 'akar_masalah', 'rekomendasi', 'waktu'].every(
      key => typeof result[key] === 'string' && result[key].trim().length > 0);
}
async function history(token: string) {
  const items: any[] = [];
  for (let page = 1; ; page++) {
    const response = await getCurhatHistory(token, page);
    if (response?.success !== true || !Array.isArray(response.data?.results)) {
      throw new Error('Riwayat belum dapat diperiksa. Ceritamu tetap tersimpan. Coba lagi setelah koneksi pulih.');
    }
    items.push(...response.data.results);
    if (!response.data.next) return items;
  }
}
export async function prepareAnalysis(owner: string, kind: Draft['kind'], token: string) {
  const draft = readDraft(owner, kind);
  if (!draft) throw new Error('Draft belum tersimpan. Silakan coba lagi.');
  const items = await history(token);
  if (draft.baseline) {
    const candidates = items.filter(item => !draft.baseline!.includes(item.id))
      .sort((a, b) => Number(b.audio_name === draft.uploadName) - Number(a.audio_name === draft.uploadName));
    for (const item of candidates) {
      if (kind === 'audio') {
        if (draft.uploadName && item.audio_name === draft.uploadName) {
          const response = await getCurhatHistoryDetail(item.id, token);
          if (response?.success === true && validAnalysis(response.data)) return response.data;
          throw new Error('Rekamanmu sudah ada di Riwayat, tetapi analisis belum lengkap. Draft tetap tersimpan.');
        }
        if (item.jenis === 'audio' || item.audio_name) {
          // API tidak memiliki ID pengiriman audio: jangan menebak hasil atau mengirim ganda.
          throw new Error('Ada rekaman baru di Riwayat yang mungkin sudah berhasil dianalisis. Periksa Riwayat sebelum mengirim lagi. Draft tetap tersimpan.');
        }
        continue;
      }
      const response = await getCurhatHistoryDetail(item.id, token);
      if (response?.success !== true) throw new Error('Riwayat belum dapat diperiksa. Coba lagi nanti.');
      if (response.data?.teks?.trim() === draft.text?.trim()) {
        if (validAnalysis(response.data)) return response.data;
        throw new Error('Ceritamu sudah ada di Riwayat, tetapi analisis belum lengkap. Draft tetap tersimpan.');
      }
    }
  }
  writeDraft(owner, { ...draft, baseline: items.map(item => item.id),
    uploadName: kind === 'audio' ? draft.uploadName ?? `curhat-draft-${Date.now()}-${Math.random().toString(36).slice(2)}.m4a` : undefined });
  return null;
}
