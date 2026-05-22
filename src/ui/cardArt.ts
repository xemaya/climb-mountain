export const cardArtMap: Record<string, string> = {
  "march-to-death": "card_march_to_death.png",
  "armata-stare": "card_armata_stare.png",
  "sasna-anomaly": "card_sasna_anomaly.png",
  "continuous-pain": "card_continuous_pain.png",
  "black-ice-traverse": "card_sasna_anomaly.png",
  "thin-air": "card_continuous_pain.png",
  "dead-camp": "card_march_to_death.png",
  "mirror-crevasse": "card_armata_stare.png",
  "choir-in-snow": "card_continuous_pain.png",
  "ashen-ladder": "card_sasna_anomaly.png",
  hastur: "card_hastur.png",
  ithaqua: "card_ithaqua.png",
  "drowned-bell": "card_ithaqua.png",
  "red-aurora": "card_hastur.png",
  "salt-idol": "card_armata_stare.png",
  "starless-summit": "card_hastur.png",
};

export function cardArtUrl(cardId: string): string | null {
  const file = cardArtMap[cardId];
  return file ? `/src/assets/${file}` : null;
}
