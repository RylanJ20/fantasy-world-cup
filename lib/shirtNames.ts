// ──────────────────────────────────────────────────────────────────────────
//  Shirt / broadcast display names for the pitch graphic.
//
//  By default a player's pitch node shows their plain surname (the last word
//  of their name). Many footballers, though, are shown differently on the back
//  of the shirt or on TV lower-thirds — a single popular name (Vini Jr., Son),
//  an abbreviated first name where the surname is too common (L. Martínez), a
//  multi-word surname kept whole (van Dijk), or first + surname when the
//  surname alone is ambiguous (Bruno Fernandes). Those exceptions live here;
//  every other player falls back to their surname automatically, so only the
//  special cases need an entry.
// ──────────────────────────────────────────────────────────────────────────

/** Plain surname — the last whitespace-separated token of a full name. */
export function lastName(name: string): string {
  const parts = name.split(/\s+/);
  return parts[parts.length - 1];
}

/** Overrides keyed by the exact full name as it appears in data/league.ts. */
const SHIRT_NAMES: Record<string, string> = {
  // Rylan
  "Luis Díaz": "L. Díaz",
  "Dani Olmo": "Dani Olmo",
  "Enzo Fernández": "Enzo",
  "Kevin De Bruyne": "De Bruyne",
  // Terrick
  "Vinícius Júnior": "Vini Jr.",
  "Son Heung-min": "Son",
  "Bernardo Silva": "Bernardo Silva",
  "Bruno Fernandes": "Bruno Fernandes",
  "Theo Hernández": "T. Hernández",
  "Virgil van Dijk": "van Dijk",
  "Diogo Costa": "Diogo Costa",
  // Zach
  "Ferran Torres": "Ferran",
  "Fabián Ruiz": "Fabián",
  "Nuno Mendes": "Nuno Mendes",
  "Gabriel Magalhães": "Gabriel",
  // Ben
  "Lautaro Martínez": "L. Martínez",
  // Grayson
  "João Félix": "João Félix",
  "Lamine Yamal": "Lamine Yamal",
  // Travis
  "Julián Álvarez": "J. Álvarez",
  "Frenkie de Jong": "F. de Jong",
  "Micky van de Ven": "van de Ven",
  "Emiliano Martínez": "E. Martínez",
  // Alejandro
  "Alexis Mac Allister": "Mac Allister",
  "Rúben Dias": "Rúben Dias",
};

/** Name to print on a player's pitch node. */
export function shirtName(name: string): string {
  return SHIRT_NAMES[name] ?? lastName(name);
}
