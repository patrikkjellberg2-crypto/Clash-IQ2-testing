# Clash IQ — Visual Design Reference

The canonical visual reference is `/CLASH-IQ-DESIGN-REFERENCE.png` at the repository root.

## Visual direction
- Premium, cinematic dark interface with near-black surfaces and restrained metallic gold accents.
- Rich, detailed game-inspired illustrations for the welcome screen, AI Coach, clan, player, and Capital views.
- Dense but readable dashboards with real statistics, charts, war data, and lists.
- Consistent typography, spacing, cards, borders, navigation, and interaction patterns across every screen.
- A distinctive welcome experience using the existing Clash IQ logo, hero artwork, subtle motion, and Google sign-in.

## Implementation rules
- Treat the image as a visual target, not as a flattened screen or background.
- Build each screen as functional native UI in Jetpack Compose.
- Keep illustrations and UI assets organized by feature; optimize images for Android.
- Use live app data for statistics and game state. Never bake mock values into artwork.
- Preserve performance and accessibility; animations and visual effects must not block core use.

## Reference scope
The image is a multi-screen concept montage. It communicates the overall look and screen composition; individual layouts should be adapted to real device sizes and working app behavior.
