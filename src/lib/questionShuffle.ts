export type ShuffleOptionInput = {
  id: string;
  text: string;
  imageUrl?: string | null;
};

export type DisplayedQuestionOption = {
  id: string;
  originalId: string;
  text: string;
  imageUrl?: string | null;
};

type ShuffleParams = {
  options: ShuffleOptionInput[];
  correctOptionId: string;
  shuffleOptions?: boolean;
  questionId?: string;
  attemptId?: string;
  seed?: string;
};

type ShuffleResult = {
  options: DisplayedQuestionOption[];
  displayedCorrectOptionId: string;
  optionMap: Record<string, string>;
  originalToDisplayedMap: Record<string, string>;
  seed: string;
};

const DISPLAY_OPTION_IDS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

function createSeed(value: string) {
  let h = 1779033703 ^ value.length;
  for (let index = 0; index < value.length; index += 1) {
    h = Math.imul(h ^ value.charCodeAt(index), 3432918353);
    h = (h << 13) | (h >>> 19);
  }

  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return h >>> 0;
  };
}

function createRandom(seedValue: string) {
  let seed = createSeed(seedValue)();
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleList<T>(items: T[], random: () => number) {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
}

export function shuffleQuestionOptions({
  options,
  correctOptionId,
  shuffleOptions = true,
  questionId = "",
  attemptId = "",
  seed = "",
}: ShuffleParams): ShuffleResult {
  const normalizedSeed = String(seed || `${questionId}:${attemptId}`).trim() || "default-seed";
  const randomized = shuffleOptions ? shuffleList(options, createRandom(normalizedSeed)) : [...options];

  const displayedOptions = randomized.map((option, index) => {
    const displayId = DISPLAY_OPTION_IDS[index] ?? String(index + 1);
    return {
      id: displayId,
      originalId: String(option.id).trim().toUpperCase(),
      text: option.text,
      imageUrl: option.imageUrl ?? null,
    };
  });

  const optionMap = Object.fromEntries(
    displayedOptions.map((option) => [option.id, option.originalId])
  ) as Record<string, string>;
  const originalToDisplayedMap = Object.fromEntries(
    displayedOptions.map((option) => [option.originalId, option.id])
  ) as Record<string, string>;

  const normalizedCorrectOptionId = String(correctOptionId).trim().toUpperCase();
  const displayedCorrectOptionId = originalToDisplayedMap[normalizedCorrectOptionId] ?? "";

  return {
    options: displayedOptions,
    displayedCorrectOptionId,
    optionMap,
    originalToDisplayedMap,
    seed: normalizedSeed,
  };
}
