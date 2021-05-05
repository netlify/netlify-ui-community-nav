# Use https://www.zachleat.com/unicode-range-interchange/ to operate on these

UNICODE_RANGE=`npx glyphhanger demo.html`

echo "Found $UNICODE_RANGE on demo.html"

# Roboto
cd assets
echo "Roboto Bold: WOFF2, Aggressive Subset, without hinting, no ligatures."
pyftsubset "Roboto-Bold.ttf" --output-file="Roboto-subset.woff2" --flavor=woff2 --layout-features=kern,salt --no-hinting --desubroutinize --unicodes=$UNICODE_RANGE

echo "Roboto Bold: WOFF2, Aggressive Subset, with hinting and all layout features."
pyftsubset "Roboto-Bold.ttf" --output-file="Roboto-subset-hint.woff2" --flavor=woff2 --layout-features="*" --unicodes=$UNICODE_RANGE

#npx datauri ./assets/Roboto-subset-hint.woff2 --copy