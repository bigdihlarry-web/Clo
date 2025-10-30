# Clo - Dice Duel

A strategic two-player dice game where players compete by rolling dice and achieving the best combinations.

## How to Play

1. Open `index.html` in your web browser
2. Click "Pre-roll" to determine which player goes first
3. Players take turns rolling three dice
4. The player with the better roll wins the round!

## Game Rules

### Pre-roll Phase
- Each player rolls one die
- Highest roll goes first
- If tied, re-roll until there's a winner

### Main Roll Phase
Players roll three dice and are ranked by these combinations (best to worst):

1. **4-5-6** - Instant win! 🎉
2. **Triples** - Three of a kind (Triple 6 is best, Triple 2 is lowest)
   - **Special: Triple 1** - Forces both players to re-roll the round
3. **Pairs** - Two of a kind, ranked by the singleton die
   - Example: [3,3,6] beats [5,5,4] because 6 > 4
4. **Singles** - No pairs, ranked by highest die value
5. **1-2-3** - Instant lose! 💀

### Special Features
- **Ties**: Both players re-roll the round
- **Cheat Button**: A secret advantage button for testing purposes 🎭

## Files

- `index.html` - Game interface
- `game.js` - Complete game logic
- `style.css` - Beautiful modern styling

## Technical Details

The game implements a complete state machine with three phases:
- `pre-roll` - Determining first player
- `main` - Active gameplay
- `round-resolved` - Round complete

Includes sophisticated roll evaluation and ranking system with special case handling for instant wins/loses, triples, pairs, and singles. 
