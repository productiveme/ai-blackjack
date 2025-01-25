import './style.css';

    const dealerCardsDiv = document.getElementById('dealer-cards');
    const playerCardsDiv1 = document.getElementById('player-cards-1');
    const playerCardsDiv2 = document.getElementById('player-cards-2');
    const dealerValueDiv = document.getElementById('dealer-value');
    const playerValueDiv1 = document.getElementById('player-value-1');
    const playerValueDiv2 = document.getElementById('player-value-2');
    const messageDiv = document.getElementById('message');
    const hitButton = document.getElementById('hit-button');
    const standButton = document.getElementById('stand-button');
    const newGameButton = document.getElementById('new-game-button');
    const balanceSpan = document.getElementById('balance');
    const betAmountInput = document.getElementById('bet-amount');
    const placeBetButton = document.getElementById('place-bet-button');
    const deckCountSpan = document.getElementById('deck-count');
    const addDeckButton = document.getElementById('add-deck-button');
    const splitButton = document.getElementById('split-button');
    const playerHandDiv2 = document.getElementById('player-hand-2');
    const controlsDiv = document.querySelector('.controls');

    let deck = [];
    let dealerHand = [];
    let playerHand1 = [];
    let playerHand2 = [];
    let gameStarted = false;
    let balance = 100;
    let currentBet = 0;
    let dealerHiddenCard = null;
    let decksInUse = 1;
    let isSplit = false;
    let currentPlayerHand = 1;

    function createDeck() {
        const suits = ['H', 'D', 'C', 'S'];
        const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
        deck = [];
        for (let i = 0; i < decksInUse; i++) {
            for (let suit of suits) {
                for (let value of values) {
                    deck.push({ suit, value });
                }
            }
        }
        shuffleDeck();
        updateDeckCountDisplay();
    }

    function shuffleDeck() {
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
    }

    function dealCard(hand) {
        if (deck.length === 0) {
            messageDiv.textContent = 'Out of cards! Adding a new deck and reshuffling.';
            decksInUse++;
            createDeck();
        }
        const card = deck.pop();
        hand.push(card);
        updateDeckCountDisplay();
        return card;
    }

    function calculateHandValue(hand) {
        let value = 0;
        let aceCount = 0;
        for (const card of hand) {
            if (['J', 'Q', 'K'].includes(card.value)) {
                value += 10;
            } else if (card.value === 'A') {
                aceCount++;
                value += 11;
            } else {
                value += parseInt(card.value);
            }
        }
        while (value > 21 && aceCount > 0) {
            value -= 10;
            aceCount--;
        }
        return value;
    }

    function renderCard(card, targetDiv, isHidden = false, animation = null) {
        const cardDiv = document.createElement('div');
        cardDiv.classList.add('card');
        if (isHidden) {
            cardDiv.textContent = '?';
        } else {
            cardDiv.textContent = `${card.value}${card.suit}`;
        }
        if (animation) {
            cardDiv.classList.add(animation);
            cardDiv.addEventListener('animationend', () => {
                cardDiv.classList.remove(animation);
            });
        }
        targetDiv.appendChild(cardDiv);
    }

    function renderHand(hand, targetDiv, isDealer = false, animation = null) {
        targetDiv.innerHTML = '';
        if (isDealer && hand.length > 1 && gameStarted) {
            renderCard(hand[0], targetDiv, false, animation);
            renderCard({value: '?', suit: ''}, targetDiv, true, animation);
        } else {
            for (let card of hand) {
                renderCard(card, targetDiv, false, animation);
            }
        }
    }

    function updateHandValues(isDealerHitting = false) {
        if (gameStarted && !isDealerHitting) {
            dealerValueDiv.textContent = `Value: ${calculateHandValue([dealerHand[0]])}`;
        } else {
             dealerValueDiv.textContent = `Value: ${calculateHandValue(dealerHand)}`;
        }
        playerValueDiv1.textContent = `Value: ${calculateHandValue(playerHand1)}`;
        if (isSplit) {
            playerValueDiv2.textContent = `Value: ${calculateHandValue(playerHand2)}`;
        }
    }

    function checkBust(hand, handValue, isPlayer) {
        if (handValue > 21) {
            if (isPlayer) {
                messageDiv.textContent = 'You busted! Dealer wins.';
            } else {
                messageDiv.textContent = 'Dealer busted! You win.';
            }
            endGame();
            return true;
        }
        return false;
    }

    async function dealerPlay() {
        renderHand(dealerHand, dealerCardsDiv);
        updateHandValues();
        while (calculateHandValue(dealerHand) < 17) {
            await new Promise(resolve => setTimeout(resolve, 500));
            dealCard(dealerHand);
            renderHand(dealerHand, dealerCardsDiv, null, 'hit-animation');
            updateHandValues(true);
        }
        const dealerValue = calculateHandValue(dealerHand);
        if (checkBust(dealerHand, dealerValue, false)) return;
        const playerValue1 = calculateHandValue(playerHand1);
        let playerValue2 = 0;
        if (isSplit) {
            playerValue2 = calculateHandValue(playerHand2);
        }
        let totalPayout = 0;
        let message = '';
        if (dealerValue > playerValue1) {
            message += 'Hand 1: Dealer wins! ';
            totalPayout -= currentBet;
        } else if (dealerValue < playerValue1) {
            let payout = currentBet;
            if (playerHand1.length === 2 && playerValue1 === 21) {
                payout += currentBet * 1.5;
                message += 'Hand 1: Blackjack! You win! ';
            } else {
                 payout += currentBet * 2;
                message += 'Hand 1: You win! ';
            }
            totalPayout += payout;
        } else {
            message += 'Hand 1: Push! ';
        }
        if (isSplit) {
            if (dealerValue > playerValue2) {
                message += 'Hand 2: Dealer wins! ';
                totalPayout -= currentBet;
            } else if (dealerValue < playerValue2) {
                let payout = currentBet;
                if (playerHand2.length === 2 && playerValue2 === 21) {
                    payout += currentBet * 1.5;
                    message += 'Hand 2: Blackjack! You win! ';
                } else {
                    payout += currentBet * 2;
                    message += 'Hand 2: You win! ';
                }
                totalPayout += payout;
            } else {
                message += 'Hand 2: Push! ';
            }
        }
        messageDiv.textContent = message;
        balance += totalPayout;
        endGame();
        updateBalanceDisplay();
    }

    function endGame() {
        gameStarted = false;
        hitButton.disabled = true;
        standButton.disabled = true;
        placeBetButton.disabled = false;
        splitButton.style.display = 'none';
        isSplit = false;
        playerHandDiv2.style.display = 'none';
        currentPlayerHand = 1;
        controlsDiv.style.flexDirection = 'row';
    }

    function updateBalanceDisplay() {
        balanceSpan.textContent = balance;
    }

    function updateDeckCountDisplay() {
        deckCountSpan.textContent = deck.length;
    }

    function startGame() {
        if (currentBet <= 0 || currentBet > balance) {
            messageDiv.textContent = 'Invalid bet amount.';
            return;
        }
        gameStarted = true;
        messageDiv.textContent = '';
        hitButton.disabled = false;
        standButton.disabled = false;
        placeBetButton.disabled = true;
        dealerHand = [];
        playerHand1 = [];
        playerHand2 = [];
        dealerCardsDiv.innerHTML = '';
        playerCardsDiv1.innerHTML = '';
        playerCardsDiv2.innerHTML = '';
        playerHandDiv2.style.display = 'none';
        controlsDiv.style.flexDirection = 'row';
        dealCard(playerHand1);
        dealCard(dealerHand);
        dealCard(playerHand1);
        dealerHiddenCard = dealCard(dealerHand);
        renderHand(dealerHand, dealerCardsDiv, true, 'deal-animation');
        renderHand(playerHand1, playerCardsDiv1, null, 'deal-animation');
        updateHandValues();
        if (playerHand1.length === 2 && playerHand1[0].value === playerHand1[1].value) {
            splitButton.style.display = 'inline-block';
        } else {
            splitButton.style.display = 'none';
        }
    }

    placeBetButton.addEventListener('click', () => {
        currentBet = parseInt(betAmountInput.value);
        startGame();
    });

    hitButton.addEventListener('click', () => {
        if (!gameStarted) return;
        let hand = currentPlayerHand === 1 ? playerHand1 : playerHand2;
        let targetDiv = currentPlayerHand === 1 ? playerCardsDiv1 : playerCardsDiv2;
        dealCard(hand);
        renderHand(hand, targetDiv, null, 'hit-animation');
        updateHandValues();
        const playerValue = calculateHandValue(hand);
        if (checkBust(hand, playerValue, true)) {
            if (isSplit && currentPlayerHand === 1) {
                currentPlayerHand = 2;
            }
        }
    });

    standButton.addEventListener('click', () => {
        if (!gameStarted) return;
        if (isSplit && currentPlayerHand === 1) {
            currentPlayerHand = 2;
            updateHandValues(true);
        } else {
            dealerPlay();
            updateHandValues(true);
        }
    });

    newGameButton.addEventListener('click', () => {
        if (!gameStarted) {
            startGame();
        }
    });

    addDeckButton.addEventListener('click', () => {
        decksInUse++;
        createDeck();
    });

    splitButton.addEventListener('click', () => {
        if (!gameStarted || playerHand1.length !== 2 || playerHand1[0].value !== playerHand1[1].value) return;
        isSplit = true;
        playerHand2.push(playerHand1.pop());
        playerHandDiv2.style.display = 'block';
        dealCard(playerHand1);
        dealCard(playerHand2);
        renderHand(playerHand1, playerCardsDiv1, null, 'deal-animation');
        renderHand(playerHand2, playerCardsDiv2, null, 'deal-animation');
        updateHandValues();
        splitButton.style.display = 'none';
        controlsDiv.style.flexDirection = 'column';
    });

    createDeck();
    updateBalanceDisplay();
