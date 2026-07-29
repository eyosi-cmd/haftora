/**
 * Injects dynamic JSON-LD structured schema for FinancialProduct into <head>
 */
export function injectFinancialProductSchema(symbol: string, name: string, price: number, category: string) {
  if (typeof document === 'undefined') return;

  let scriptEl = document.getElementById('json-ld-financial-product') as HTMLScriptElement | null;
  if (!scriptEl) {
    scriptEl = document.createElement('script');
    scriptEl.id = 'json-ld-financial-product';
    scriptEl.type = 'application/ld+json';
    document.head.appendChild(scriptEl);
  }

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FinancialProduct',
    'name': name,
    'tickerSymbol': symbol,
    'category': category,
    'offers': {
      '@type': 'Offer',
      'price': price.toFixed(2),
      'priceCurrency': 'USD',
      'availability': 'https://schema.org/InStock',
    },
  };

  scriptEl.textContent = JSON.stringify(schema);
}

/**
 * Updates document title & meta description dynamically per active view/ticker
 */
export function updatePageMeta(title: string, description?: string) {
  if (typeof document === 'undefined') return;
  document.title = `${title} | Haftora`;

  if (description) {
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', description);
  }
}
