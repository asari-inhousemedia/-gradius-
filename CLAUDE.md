# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Gradius Browser Edition - a horizontal-scrolling shooter (shoot 'em up) inspired by the classic 1985 Konami arcade game. Built with vanilla HTML5 Canvas, JavaScript, and Web Audio API.

## Running the Game

Open `index.html` in a browser. No build step or server required.

For local development with live reload:
```bash
npx serve .
```

## Architecture

**Single-page game with three files:**
- `index.html` - Game container, UI overlay, start/game-over screens
- `styles.css` - Retro arcade styling, power-up bar, screen overlays
- `game.js` - All game logic (~700 lines)

**game.js structure:**
- `SoundFX` object - Procedural sound generation via Web Audio API oscillators
- `game` state - Score, lives, power level, difficulty
- `powerUps` state - Speed, missile, double, laser, options, shield
- `player` object - Position, movement, shooting cooldown, invincibility frames
- Game object arrays: `bullets`, `missiles`, `enemies`, `enemyBullets`, `particles`, `powerCapsules`, `stars`
- `gameLoop()` - Main 60fps loop: update → draw → requestAnimationFrame

**Power-up system (Gradius-style):**
Collecting red capsules advances power meter. Press ENTER to activate selected power-up:
0=Speed, 1=Missile, 2=Double, 3=Laser, 4=Option, 5=Shield

**Enemy types:**
- `basic` - Diamond shape, straight movement
- `wave` - Circular, sine-wave pattern
- `shooter` - Rectangular, fires at player
- `big` - Hexagonal, 10 HP, high score value

## Controls

- Arrow keys / WASD - Move
- Space - Shoot
- Enter - Activate power-up
