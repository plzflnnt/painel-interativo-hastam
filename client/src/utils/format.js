/**
 * Formats a value in cents to BRL currency string.
 * @param {number} cents 
 * @returns {string}
 */
export function formatCentsToBRL(cents) {
  if (cents === undefined || cents === null || isNaN(cents)) {
    return 'R$ 0,00';
  }
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(cents / 100);
}
