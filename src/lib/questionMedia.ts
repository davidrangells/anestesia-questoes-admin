import { db, storage } from "@/lib/firebase";
import { addDoc, collection, getDocs, limit, orderBy, query, serverTimestamp } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

export type QuestionMediaKind = "prompt" | "option" | "attachment";

export type QuestionGalleryItem = {
  id: string;
  url: string;
  label?: string | null;
  name?: string | null;
};

function safeExt(name: string) {
  const ext = (name.split(".").pop() || "jpg").toLowerCase();
  if (!/^[a-z0-9]+$/.test(ext)) return "jpg";
  if (ext.length > 6) return "jpg";
  return ext;
}

export async function uploadQuestionAsset(file: File, folder: string) {
  const ext = safeExt(file.name);
  const path = `${folder}/${Date.now()}-${Math.random().toString(16).slice(2)}.${ext}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);
  return { url, path };
}

export async function registerQuestionMedia(params: {
  url: string;
  path: string;
  origin?: string;
  kind: QuestionMediaKind;
  label?: string;
}) {
  await addDoc(collection(db, "midias"), {
    url: params.url,
    path: params.path,
    origin: params.origin || "questionsBank",
    kind: params.kind,
    label: params.label || null,
    createdAt: serverTimestamp(),
  });
}

export async function loadQuestionMediaGallery(maxItems = 24): Promise<QuestionGalleryItem[]> {
  const snap = await getDocs(
    query(collection(db, "midias"), orderBy("createdAt", "desc"), limit(maxItems))
  );

  return snap.docs
    .map((item) => ({
      id: item.id,
      url: String(item.data().url ?? ""),
      label: (item.data().label as string | null) ?? null,
      name: (item.data().name as string | null) ?? null,
    }))
    .filter((item) => item.url);
}
