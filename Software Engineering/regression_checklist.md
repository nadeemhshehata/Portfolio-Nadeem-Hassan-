# DragRace.io — Sprint 3 Regression Checklist

## Pre-Flight
- [ ] Backend running: `uvicorn main:app --reload`
- [ ] Frontend running: `npm run dev`
- [ ] SQLite database seeded: `python seed.py`

## Core Flow (Sprint 1)
- [ ] Home page loads with vehicle grid (150+ records)
- [ ] Search "ford" → only Ford vehicles shown
- [ ] Type filter "motorcycle" → only motorcycles shown
- [ ] Select Vehicle A → slot fills + Checkmark
- [ ] Select Vehicle B → slot fills + Checkmark
- [ ] Same vehicle A & B → warning text shown
- [ ] Press Race → animation plays
- [ ] Skip animation → results shown
- [ ] Winner banner shows correct winner
- [ ] Side-by-side comparison has green winner glow
- [ ] "New Matchup" returns to Home

## Sprint 2 Features
- [ ] ARIA labels on all buttons and inputs (inspect DOM)
- [ ] Keyboard Tab navigation through all interactive elements
- [ ] Focus ring (purple outline) appears on Tab focus
- [ ] Reduced-motion: animation is suppressed

## Sprint 3 Features
- [ ] Nav bar visible on all pages (Home, Detail, Leaderboard, History)
- [ ] Click vehicle card title → Detail page loads with correct specs
- [ ] Detail page: make, model, trim, year, type, quarter-mile time, source all shown
- [ ] Detail page: "Race This Vehicle" button navigates to Home
- [ ] Detail page: Back button works
- [ ] Leaderboard: vehicles ranked by quarter-mile time (fastest first)
- [ ] Leaderboard: filter toggle (All / Cars / Motorcycles) works
- [ ] Leaderboard: top 3 have gold/silver/bronze highlighting
- [ ] Leaderboard: click row → navigates to vehicle detail page
- [ ] History: race result appears after running a race
- [ ] History: shows vehicle names (not IDs), winner, time diff, date
- [ ] History: empty state shows "No race history yet" message
- [ ] History: newest race appears at the top

## Cross-Page Integration
- [ ] Full flow: Home → Detail → Home → Select → Race → Results → History
- [ ] Leaderboard ranking is consistent with race predictions
- [ ] History records match actual race results

## Responsive Layout
- [ ] Desktop (1280px): 3-column grid, side-by-side comparison
- [ ] Tablet (768px): 2-column grid, responsive nav bar
- [ ] Mobile (375px): single column, stacked matchup, full-width inputs

## Error Handling
- [ ] Disconnect backend → error state shown on all pages
- [ ] Navigate to /vehicles/999 → "Vehicle not found" message
- [ ] Navigate to /results directly → redirect to Home
