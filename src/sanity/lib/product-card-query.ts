// Keep initial render, faceted pagination, collections and search on the same contract.
export const PRODUCT_CARD_FIELDS = `
  _id, title, price, currency, pricingModel, maxPrice, priceTiers,
  compareAtPrice, tags, sold, stock, inStock, hasVariants,
  options[]{name, values},
  variants[]{
    _key, sku, title, price, compareAtPrice, stock,
    options[]{name, value},
    image{..., asset->}
  },
  "slug": coalesce(metadata.slug.current, slug.current, ""),
  images[]{..., asset->},
  categories[]->{title, "slug": slug.current},
  _createdAt
`

// Use the same effective price as the card before slicing a sorted page.
export const PRODUCT_CARD_SORT_PRICE = `coalesce(
  select(
    count(variants) > 0 => math::min((variants[]{"value": coalesce(price, ^.price)})[].value),
    pricingModel == "tiered" => math::min(priceTiers[isCustomQuote != true].unitPrice)
  ),
  price,
  0
)`
