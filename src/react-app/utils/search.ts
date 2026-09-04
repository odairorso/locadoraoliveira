const normalizeSearchText = (value: unknown) =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

/**
 * Pesquisa todos os termos digitados em conjunto, ignorando acentos e pontuação.
 * Assim, por exemplo, "joao silva", "123.456" e "abc-1d23" funcionam mesmo
 * quando os dados estão formatados de outra maneira.
 */
export const matchesSearch = (searchTerm: string, values: unknown[]) => {
  const terms = normalizeSearchText(searchTerm).split(/\s+/).filter(Boolean);
  if (terms.length === 0) return true;

  const searchableText = normalizeSearchText(values.join(' '));
  const compactSearchableText = searchableText.replace(/\s/g, '');

  return terms.every((term) => {
    const compactTerm = term.replace(/\s/g, '');
    return searchableText.includes(term) || compactSearchableText.includes(compactTerm);
  });
};
