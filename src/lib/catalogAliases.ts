export const CATALOG_ALIASES: ReadonlyMap<string, readonly string[]> = new Map([
  ['L01-sets-maps-proofs', ['map', 'maps', 'function', 'functions', 'set', 'sets']],
  ['L02-groups-modular-arithmetic', ['group', 'groups', 'group theory']],
  ['L03-finite-fields-gf2-gfp', ['finite field', 'finite fields']],
  ['L04-vector-spaces-finite-fields', ['vector space', 'vector spaces']],
  ['L05-linear-maps-matrices', ['linear map', 'linear maps']],
  ['L09-complex-inner-products-hilbert', ['inner product', 'inner products']],
  ['L16-n-qubit-pauli-strings', ['pauli group', 'pauli groups']],
  ['L88-dft-fast-fourier-transform', ['fft']],
  ['L92-markov-chains-mixing-mcmc', ['mcmc']],
  ['L98-np-completeness-reductions', ['np complete']],
  ['L99-randomized-complexity-amplification', ['bpp']],
  ['L102-grover-search-query-bounds', ['grover']],
  ['L103-quantum-phase-estimation', ['quantum phase estimation']],
  ['L104-quantum-order-finding', ['shor s algorithm']],
  ['L105-bqp-circuit-complexity', ['bqp']],
  ['L106-qma-local-hamiltonian', ['qma']]
]);

export function normalizeCatalogName(value: string) {
  return value
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}
