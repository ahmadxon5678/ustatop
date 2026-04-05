// Requires Fuse.js loaded via CDN before this file

function createWorkerSearch(workers) {
  if (typeof Fuse === 'undefined') return null;
  return new Fuse(workers, {
    keys: ['name', 'profession', 'city', 'region', 'description'],
    threshold: 0.4,
    includeScore: true
  });
}

function createProductSearch(products) {
  if (typeof Fuse === 'undefined') return null;
  return new Fuse(products, {
    keys: ['product_name', 'seller', 'product_type', 'description'],
    threshold: 0.4,
    includeScore: true
  });
}

function fuzzySearch(fuseInstance, query, allItems) {
  if (!fuseInstance || !query || !query.trim()) return allItems;
  var results = fuseInstance.search(query.trim());
  return results.map(function(r) { return r.item; });
}
