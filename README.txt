AwaisGames - Poki-style UI update
=================================
Copy the contents of the "src" folder into your repo's "src" folder (overwrite when asked).

Changed files (overwrite):
  src/App.tsx
  src/index.css
  src/components/Navbar.tsx
  src/components/GameGrid.tsx

New files:
  src/components/Sidebar.tsx
  src/components/ThemeToggle.tsx
  src/utils/theme.ts
  src/utils/categoryIcons.ts

Then:  npm run build   (check it passes)  ->  git add . && git commit -m "feat(ui): Poki-style layout + light/dark theme" && git push origin main
