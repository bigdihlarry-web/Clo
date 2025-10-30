// Clo — Dice Duel game logic

(() => {
  // DOM elements
  const preRollBtn = document.getElementById('preRollBtn');
  const resetBtn = document.getElementById('resetBtn');
  const p1RollBtn = document.getElementById('p1RollBtn');
  const p2RollBtn = document.getElementById('p2RollBtn');
  const p1Pre = document.getElementById('p1Pre');
  const p2Pre = document.getElementById('p2Pre');
  const p1RollText = document.getElementById('p1RollText');
  const p2RollText = document.getElementById('p2RollText');
  const messages = document.getElementById('messages');
  const roundNumEl = document.getElementById('roundNum');
  const roundResult = document.getElementById('roundResult');
  const cheatBtn = document.getElementById('cheatBtn');

  // Game state
  let state = {
    round: 0,
    phase: 'pre-roll', // 'pre-roll' -> 'main' -> 'round-resolved'
    firstToRoll: null, // 1 or 2
    player: {
      1: { pre: null, lastRoll: null, lastEval: null, cheatedThisRound: false },
      2: { pre: null, lastRoll: null, lastEval: null, cheatedThisRound: false }
    },
    currentTurn: null, // 1 or 2
    cheatFlags: { // set when a player clicks the discreet button before their roll
      1: {pre: false, main: false},
      2: {pre: false, main: false}
    }
  };

  // Utility: roll n dice
  function rollDice(n = 1) {
    const arr = [];
    for (let i = 0; i < n; i++) arr.push(1 + Math.floor(Math.random() * 6));
    return arr;
  }

  // Evaluate a 3-dice roll according to rules and return ranking info
  // returns {type, rank, desc, dice}
  // type: 'instantWin','instantLose','triple','pair','single'
  function evaluateThreeDice(dice) {
    dice = dice.slice().sort((a,b)=>a-b);
    const [a,b,c] = dice;
    // instant checks
    // 4-5-6
    if ((a===4 && b===5 && c===6) || (new Set(dice).size===3 && dice.includes(4) && dice.includes(5) && dice.includes(6))) {
      return { type:'instantWin', rank: 1000, desc:'4-5-6 (instant win)', dice };
    }
    // 1-2-3
    if ((a===1 && b===2 && c===3) || (new Set(dice).size===3 && dice.includes(1) && dice.includes(2) && dice.includes(3))) {
      return { type:'instantLose', rank: -1000, desc:'1-2-3 (instant lose)', dice };
    }
    // triples
    if (a===b && b===c) {
      // triple 1 is special (re-roll)
      const value = a;
      const rank = 800 + value; // triple 6 highest
      return { type:'triple', triple:value, rank, desc:`Triple ${value}`, dice };
    }
    // pairs
    if (a===b || b===c || a===c) {
      // find pair value and singleton
      let pairVal, singleVal;
      if (a===b) { pairVal = a; singleVal = c; }
      else if (b===c) { pairVal = b; singleVal = a; }
      else { pairVal = a; singleVal = b; } // a===c
      // The singleton is the score per your rule
      // Rank pairs by singleton value (higher is better)
      const rank = 200 + singleVal;
      return { type:'pair', pair:pairVal, single:singleVal, rank, desc:`Pair ${pairVal} with singleton ${singleVal}`, dice };
    }
    // no pairs -> single highest die is the score
    const highest = Math.max(...dice);
    const rank = 100 + highest;
    return { type:'single', highest, rank, desc:`No pair. Highest die ${highest}`, dice };
  }

  // Compare two evaluated roll objects. Returns 1 if evalA > evalB, -1 if less, 0 if equal.
  function compareEval(evalA, evalB) {
    if (evalA.rank > evalB.rank) return 1;
    if (evalA.rank < evalB.rank) return -1;
    // same rank -> tie
    return 0;
  }

  // Format dice array to string
  function diceToStr(dice) {
    return `[${dice.join(', ')}]`;
  }

  // UI helpers
  function setMessage(txt) { messages.textContent = txt; }
  function updateUI() {
    p1Pre.textContent = state.player[1].pre ?? '—';
    p2Pre.textContent = state.player[2].pre ?? '—';
    p1RollText.textContent = state.player[1].lastEval ? `${state.player[1].lastEval.desc} ${diceToStr(state.player[1].lastRoll)}` : '—';
    p2RollText.textContent = state.player[2].lastEval ? `${state.player[2].lastEval.desc} ${diceToStr(state.player[2].lastRoll)}` : '—';
    roundNumEl.textContent = state.round;
    roundResult.textContent = state.lastRoundResult ?? '—';
    // enable/disable roll buttons by current phase/turn
    if (state.phase === 'pre-roll') {
      preRollBtn.disabled = false;
      p1RollBtn.disabled = true;
      p2RollBtn.disabled = true;
    } else if (state.phase === 'main') {
      preRollBtn.disabled = true;
      // enable only the current turn's roll button, unless already rolled
      if (state.currentTurn === 1) {
        p1RollBtn.disabled = false;
        p2RollBtn.disabled = true;
      } else if (state.currentTurn === 2) {
        p1RollBtn.disabled = true;
        p2RollBtn.disabled = false;
      } else {
        p1RollBtn.disabled = true;
        p2RollBtn.disabled = true;
      }
    }
  }

  // Reset everything
  function resetGame() {
    state = {
      round: 0,
      phase: 'pre-roll',
      firstToRoll: null,
      player: {
        1: { pre: null, lastRoll: null, lastEval: null, cheatedThisRound: false },
        2: { pre: null, lastRoll: null, lastEval: null, cheatedThisRound: false }
      },
      currentTurn: null,
      cheatFlags: {1:{pre:false,main:false},2:{pre:false,main:false}},
      lastRoundResult: null
    };
    setMessage('Click "Pre-roll" to determine who goes first.');
    updateUI();
  }

  // Pre-roll single die for both players to determine who goes first
  function doPreRoll() {
    setMessage('Pre-roll for Player 1...');
    // Player 1 pre-roll (with cheat effect if set)
    let p1val;
    if (state.cheatFlags[1].pre) {
      // forced 5 or 6
      p1val = 5 + Math.floor(Math.random()*2); // 5 or 6
      state.cheatFlags[1].pre = false;
    } else {
      p1val = rollDice(1)[0];
    }
    state.player[1].pre = p1val;
    setMessage(`Player 1 rolled ${p1val}. Now Player 2 pre-roll...`);
    updateUI();

    // Player 2
    let p2val;
    if (state.cheatFlags[2].pre) {
      p2val = 5 + Math.floor(Math.random()*2);
      state.cheatFlags[2].pre = false;
    } else {
      p2val = rollDice(1)[0];
    }
    state.player[2].pre = p2val;
    setMessage(`Player 1: ${p1val} — Player 2: ${p2val}`);
    if (p1val === p2val) {
      setMessage(`Tie on pre-roll (${p1val}). Re-roll pre-rolls.`);
      // clear and call recursively after a short delay
      setTimeout(()=> {
        state.player[1].pre = null;
        state.player[2].pre = null;
        updateUI();
        doPreRoll();
      }, 800);
      return;
    }
    state.firstToRoll = p1val > p2val ? 1 : 2;
    state.currentTurn = state.firstToRoll;
    state.phase = 'main';
    state.round = 1;
    setMessage(`Player ${state.firstToRoll} goes first. Player ${state.currentTurn}, press your Roll button.`);
    updateUI();
  }

  // Generate a main 3-dice roll honoring cheat flags for that player (main cheat)
  // If the player's main cheat flag is set, we force a favorable roll (for player1: favorable; for player2: better than player1's roll if needed)
  // For the "forced worse for the opponent after player1 used cheat" logic, that will be handled externally by passing an option.
  function generateMainRollFor(playerId, options = {}) {
    // options:
    // - favor: 'player1' or 'player2' or null
    // - mustBeBetterThanEval: eval object or null
    // - mustBeWorseThanEval: eval object or null
    const preferCheat = state.cheatFlags[playerId].main;
    state.cheatFlags[playerId].main = false; // consume

    // Helper to produce a random roll that satisfies an evaluator predicate
    function findRollMatching(predicate, maxAttempts=5000) {
      for (let i=0;i<maxAttempts;i++) {
        const dice = rollDice(3);
        const ev = evaluateThreeDice(dice);
        if (predicate(ev,dice)) return {dice, ev};
      }
      // fallback to plain roll if not found
      const fallbackDice = rollDice(3);
      return { dice: fallbackDice, ev: evaluateThreeDice(fallbackDice) };
    }

    // If mustBeBetterThanEval is requested (e.g., player2 cheat to beat player1), find a roll with strictly higher rank
    if (options.mustBeBetterThanEval) {
      const target = options.mustBeBetterThanEval;
      return findRollMatching(ev => compareEval(ev, target) === 1);
    }

    // If mustBeWorseThanEval is requested (ensure opponent loses)
    if (options.mustBeWorseThanEval) {
      const target = options.mustBeWorseThanEval;
      return findRollMatching(ev => compareEval(ev, target) === -1);
    }

    // If player used cheat (favor), and it is player1: produce a favorable outcome: instantWin/strongTriple/pair-high
    if (preferCheat) {
      // For Player1: prefer instantWin, then triples 6..2, then pair with singleton 6/5
      if (playerId === 1) {
        return findRollMatching(ev => {
          if (ev.type === 'instantWin') return true;
          if (ev.type === 'triple' && ev.triple >= 2) return true;
          if (ev.type === 'pair' && (ev.single === 6 || ev.single === 5)) return true;
          return false;
        });
      } else {
        // For Player2 cheat used proactively (not specified vs reactive): produce a very strong roll (instantWin or triple6 or triple5 or pair single 6)
        return findRollMatching(ev => {
          if (ev.type === 'instantWin') return true;
          if (ev.type === 'triple' && ev.triple >= 5) return true;
          if (ev.type === 'pair' && ev.single === 6) return true;
          return false;
        });
      }
    }

    // Default: just roll
    const dice = rollDice(3);
    const ev = evaluateThreeDice(dice);
    return {dice, ev};
  }

  // Player performs their main roll
  function playerRollMain(playerId) {
    setMessage(`Player ${playerId} rolling...`);
    // Check if player used cheat BEFORE it gets consumed by generateMainRollFor
    const playerUsedCheat = state.cheatFlags[playerId].main;
    
    // Determine options for generator based on cheat interplay
    let options = {};

    // If player 1 used cheat earlier this round, our logic: player1 gets favored roll, and player2 will be forced worse later.
    // If player 2 used cheat earlier, they should get a roll *better* than player1 (if player1 already rolled).
    // We'll support both reactive and proactive cheat usage.
    // If the active player is 2 and they have a main cheat flag, and player1 has already rolled this round, we will ensure player2's roll is better than player1's eval.
    if (playerUsedCheat && playerId === 2 && state.player[1].lastEval) {
      options.mustBeBetterThanEval = state.player[1].lastEval;
    }

    // If the opponent used cheat before and is player1 and active is player2 and the opponent's cheat should force player2 to lose:
    if (playerId === 2 && state.player[1].lastEval && state.player[1].cheatedThisRound) {
      // Force player2 to be worse than player1's eval
      options.mustBeWorseThanEval = state.player[1].lastEval;
    }

    // If active player is player1 and they used cheat, they should get favorable roll
    if (playerId === 1 && playerUsedCheat) {
      options.favor = 'player1';
    }

    // If active player is player2 and they used cheat but player1 hasn't rolled yet, we will still try to give them a strong roll (handled in generator)
    const result = generateMainRollFor(playerId, options);
    const dice = result.dice;
    const ev = result.ev;

    // Record
    state.player[playerId].lastRoll = dice;
    state.player[playerId].lastEval = ev;
    // Mark whether they cheated this round (used to trigger opponent constraints)
    if (playerUsedCheat) {
      state.player[playerId].cheatedThisRound = true;
    }

    // Display
    updateUI();

    // Handle special three-dice outcomes
    if (ev.type === 'triple' && ev.triple === 1) {
      // triple 1: re-roll for both players for that round
      setMessage(`Player ${playerId} rolled Triple 1. This round is a re-roll for both players.`);
      state.player[1].lastRoll = null;
      state.player[1].lastEval = null;
      state.player[2].lastRoll = null;
      state.player[2].lastEval = null;
      // reset cheated flags for round (they can try again next round)
      state.player[1].cheatedThisRound = false;
      state.player[2].cheatedThisRound = false;
      state.round += 0; // same round number
      state.currentTurn = state.firstToRoll; // re-start round with first to roll
      updateUI();
      return;
    }

    // If instant win/lose happens, we can resolve immediately
    if (ev.type === 'instantWin') {
      // immediate win for this player
      state.lastRoundResult = `Player ${playerId} rolled 4-5-6 and wins instantly!`;
      setMessage(state.lastRoundResult);
      roundResult.textContent = state.lastRoundResult;
      // disable further rolls
      state.phase = 'round-resolved';
      p1RollBtn.disabled = true;
      p2RollBtn.disabled = true;
      return;
    }
    if (ev.type === 'instantLose') {
      // immediate lose for this player: other player wins instantly
      const other = playerId === 1 ? 2 : 1;
      state.lastRoundResult = `Player ${playerId} rolled 1-2-3 and loses instantly. Player ${other} wins!`;
      setMessage(state.lastRoundResult);
      roundResult.textContent = state.lastRoundResult;
      state.phase = 'round-resolved';
      p1RollBtn.disabled = true;
      p2RollBtn.disabled = true;
      return;
    }

    // If both players have rolled (or the opponent had already rolled), compare and resolve
    const other = playerId === 1 ? 2 : 1;
    if (state.player[other].lastEval) {
      // both have rolls — compare
      const compare = compareEval(state.player[playerId].lastEval, state.player[other].lastEval);
      if (compare === 1) {
        state.lastRoundResult = `Player ${playerId} wins: ${state.player[playerId].lastEval.desc} ${diceToStr(state.player[playerId].lastRoll)} vs ${state.player[other].lastEval.desc} ${diceToStr(state.player[other].lastRoll)}`;
        setMessage(state.lastRoundResult);
        state.phase = 'round-resolved';
        roundResult.textContent = state.lastRoundResult;
        p1RollBtn.disabled = true;
        p2RollBtn.disabled = true;
      } else if (compare === -1) {
        state.lastRoundResult = `Player ${other} wins: ${state.player[other].lastEval.desc} ${diceToStr(state.player[other].lastRoll)} vs ${state.player[playerId].lastEval.desc} ${diceToStr(state.player[playerId].lastRoll)}`;
        setMessage(state.lastRoundResult);
        state.phase = 'round-resolved';
        roundResult.textContent = state.lastRoundResult;
        p1RollBtn.disabled = true;
        p2RollBtn.disabled = true;
      } else {
        // tie -> both re-roll for this round
        setMessage(`Tie this round (${state.player[1].lastEval.desc} vs ${state.player[2].lastEval.desc}). Re-roll the round.`);
        state.player[1].lastRoll = null;
        state.player[1].lastEval = null;
        state.player[2].lastRoll = null;
        state.player[2].lastEval = null;
        // keep same firstToRoll and reset currentTurn to first
        state.currentTurn = state.firstToRoll;
        updateUI();
      }
    } else {
      // other player hasn't rolled yet: switch turn
      state.currentTurn = other;
      setMessage(`Player ${other}, it's your turn to roll.`);
      updateUI();
    }
  }

  // Handle cheat button click
  function handleCheat(playerId) {
    if (state.phase === 'pre-roll') {
      // Set pre-roll cheat flag for the player
      state.cheatFlags[playerId].pre = true;
      setMessage(`Player ${playerId} cheat activated for pre-roll.`);
    } else if (state.phase === 'main' && state.currentTurn === playerId) {
      // Set main roll cheat flag for the current player
      state.cheatFlags[playerId].main = true;
      setMessage(`Player ${playerId} cheat activated for main roll.`);
    }
  }

  // Button event handlers
  preRollBtn.addEventListener('click', () => {
    if (state.phase !== 'pre-roll') return;
    doPreRoll();
  });

  resetBtn.addEventListener('click', () => {
    resetGame();
  });

  p1RollBtn.addEventListener('click', () => {
    if (state.phase !== 'main' || state.currentTurn !== 1) return;
    playerRollMain(1);
  });

  p2RollBtn.addEventListener('click', () => {
    if (state.phase !== 'main' || state.currentTurn !== 2) return;
    playerRollMain(2);
  });

  if (cheatBtn) {
    cheatBtn.addEventListener('click', () => {
      // Determine which player is using cheat based on current turn
      if (state.phase === 'pre-roll') {
        // Could be either player, but typically would need separate buttons
        // For now, assume it's for the current context
        handleCheat(state.currentTurn || 1);
      } else if (state.phase === 'main' && state.currentTurn) {
        handleCheat(state.currentTurn);
      }
    });
  }

  // Initialize UI
  resetGame();
})();
