# Katalog rostlin

- Stav: rozpracováno
- Verze: nevydáno
- Poslední ověření: 2026-08-18

## Účel

Samostatný výběr sortimentu v nekonečném hybridním carouselu s kompaktním
detailem v nativním dialogu. Je vhodný pro menší, kurátorovaný katalog;
nenahrazuje rozsáhlý e-shop ani databázi rostlin.

## Použití

1. Připojit `plant-catalog.css`.
2. Vložit markup z `plant-catalog.html`.
3. Před koncem `body` připojit `plant-catalog.js` s atributem `defer`.

Komponenta nemá frameworkovou ani balíčkovou závislost. Třídy i datové atributy
s prefixem `ss-plant-` jsou její veřejné API.

## Závislosti

- CSS: `plant-catalog.css`
- JavaScript: `plant-catalog.js`, pouze přepínání společného detailu
- Font: CoFo Gothic s povolenou webovou licencí, nebo systémový fallback Arial
- Obrázky, SVG motiv a piktogramy podle cest uvedených v HTML

## Přístupnost a fallback

Položky sortimentu jsou nativní tlačítka s `aria-expanded`; detail používá
HTML `<dialog>`, zavírá se tlačítkem, klávesou Escape nebo kliknutím na pozadí.
Bez JavaScriptu zůstane viditelný a čitelný katalog.

## Responsivní chování

- Široké obrazovky: přibližně 4 celé karty a části sousedních karet.
- Střední obrazovky: přibližně 2,5–3 karty.
- Mobil: přibližně 1,3 karty, dialog s obrazem nad obsahem.

Carousel se pomalu automaticky posouvá. Hover, focus, tažení a otevřený dialog
jej pozastaví. Při `prefers-reduced-motion` zůstává pouze ruční horizontální
posouvání.

Karty používají mezery a vlastní jemný rám; nespojují se do tabulkové mřížky.
Pozadí sekce tvoří dekorativní `structure.svg`, které nenese obsahový význam.

## Nepoužívat

- Externí modal nebo Fancybox knihovna: přidává zbytečnou runtime závislost.
- Vysoký inline detail pod katalogem: neúměrně prodlužuje homepage.
- Externí carousel knihovna: pro deset položek nemá přínos odpovídající své
  velikosti a komplikuje přenos komponenty.
- Vkládání originálních 24MB PNG přímo do stránky.
