export const cardArtMap: Record<string, string> = {
  "march-to-death": "card_march_to_death.png",
  "armata-stare": "card_armata_stare.png",
  "sasna-anomaly": "card_sasna_anomaly.png",
  "continuous-pain": "card_continuous_pain.png",
  hastur: "card_hastur.png",
  ithaqua: "card_ithaqua.png",
};

export function cardArtUrl(cardId: string): string | null {
  const file = cardArtMap[cardId];
  return file ? `/src/assets/${file}` : null;
}
