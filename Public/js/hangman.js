/**
 * Hangman Game Logic
 * Classic word guessing game
 * Part of the 9DTTT Game Library
 */

class HangmanGame {
    constructor() {
        this.words = {
            'Animals': ['elephant', 'giraffe', 'penguin', 'dolphin', 'butterfly', 'kangaroo', 'octopus', 'squirrel'],
            'Fruits': ['strawberry', 'pineapple', 'blueberry', 'watermelon', 'pomegranate', 'raspberry', 'tangerine'],
            'Countries': ['australia', 'brazil', 'canada', 'france', 'germany', 'italy', 'japan', 'mexico', 'spain'],
            'Sports': ['basketball', 'volleyball', 'swimming', 'football', 'baseball', 'tennis', 'hockey', 'soccer'],
            'Movies': ['avatar', 'titanic', 'frozen', 'inception', 'gladiator', 'jaws', 'rocky', 'shrek'],
            'Food': ['hamburger', 'spaghetti', 'pancakes', 'chocolate', 'sandwich', 'pizza', 'sushi', 'tacos']
        };
        
        // Educational facts for each word
        this.educationalFacts = {
            // Animals
            'elephant': 'Elephants are the largest land animals! They can recognize themselves in mirrors, showing self-awareness.',
            'giraffe': 'Giraffes have the same number of neck bones as humans (7), but each bone is much longer!',
            'penguin': 'Penguins can drink salt water because special glands filter out the salt!',
            'dolphin': 'Dolphins sleep with one eye open and half their brain awake to watch for predators!',
            'butterfly': 'Butterflies taste with their feet! This helps them find food for their caterpillars.',
            'kangaroo': 'A baby kangaroo (joey) is only about 1 inch long when born - smaller than a cherry!',
            'octopus': 'Octopuses have three hearts and blue blood! Two hearts pump blood to the gills.',
            'squirrel': 'Squirrels plant thousands of trees each year by forgetting where they buried their nuts!',
            
            // Fruits
            'strawberry': 'Strawberries are the only fruit with seeds on the outside - about 200 per berry!',
            'pineapple': 'A pineapple takes 2-3 years to grow! Each plant only produces one pineapple at a time.',
            'blueberry': 'Blueberries are one of the few naturally blue foods. The color comes from anthocyanins!',
            'watermelon': 'Watermelon is 92% water! Ancient Egyptians placed watermelons in tombs for the afterlife.',
            'pomegranate': 'Pomegranates can have over 600 seeds inside! They\'re considered a symbol of prosperity.',
            'raspberry': 'Each raspberry is made up of around 100 tiny fruits called drupelets!',
            'tangerine': 'Tangerines are named after Tangier, Morocco, the port from which they were first shipped!',
            
            // Countries
            'australia': 'Australia is both a country and a continent! It has more kangaroos than people.',
            'brazil': 'Brazil produces about 1/3 of the world\'s coffee! The Amazon rainforest covers much of Brazil.',
            'canada': 'Canada has more lakes than all other countries combined - over 60% of the world\'s lakes!',
            'france': 'The Eiffel Tower was originally meant to be temporary and was almost torn down in 1909!',
            'germany': 'Germany has over 20,000 castles! Many fairy tales were inspired by German forests.',
            'italy': 'Italy has more UNESCO World Heritage Sites than any other country in the world!',
            'japan': 'Japan has the world\'s oldest company (founded in 578 AD) and vending machines everywhere!',
            'mexico': 'Mexico introduced chocolate, chili peppers, and corn to the rest of the world!',
            'spain': 'Spain has a tomato-throwing festival called La Tomatina where 150,000 tomatoes are thrown!',
            
            // Sports
            'basketball': 'Basketball was invented in 1891 using a peach basket! The first games had 9 players per team.',
            'volleyball': 'Volleyball was originally called "Mintonette" and was invented in 1895 for older players!',
            'swimming': 'Swimming is one of the best exercises - it works almost every muscle in your body!',
            'football': 'The first football was made from an inflated pig bladder, which is why it\'s called a "pigskin"!',
            'baseball': 'A baseball has exactly 108 stitches! Each ball is hand-stitched and lasts about 7 pitches.',
            'tennis': 'Tennis players can hit the ball over 150 mph! The longest match lasted 11 hours over 3 days.',
            'hockey': 'Hockey pucks are frozen before games to prevent bouncing on the ice!',
            'soccer': 'Soccer (football) is the most popular sport in the world with over 4 billion fans!',
            
            // Movies
            'avatar': 'Avatar took 15 years to make! Director James Cameron waited for technology to catch up.',
            'titanic': 'The Titanic movie cost more to make than the actual ship cost to build!',
            'frozen': '"Let It Go" from Frozen has been translated into over 40 languages!',
            'inception': 'Inception\'s dream levels were filmed in 6 different countries across 4 continents!',
            'gladiator': 'Real tigers were used in Gladiator! Trainers hid behind fake walls during filming.',
            'jaws': 'The mechanical shark in Jaws broke so often that Spielberg had to suggest the shark instead!',
            'rocky': 'Rocky was written by Sylvester Stallone in just 3 days! He also starred in it.',
            'shrek': 'Shrek was the first winner of the Academy Award for Best Animated Feature in 2002!',
            
            // Food
            'hamburger': 'Americans eat about 50 billion hamburgers per year - that\'s 3 per person per week!',
            'spaghetti': 'Italians eat about 60 pounds of pasta per person each year! Spaghetti means "thin strings".',
            'pancakes': 'The largest pancake ever made was 49 feet wide and weighed 6,614 pounds!',
            'chocolate': 'Chocolate was once used as money by the Aztecs! They called it "food of the gods".',
            'sandwich': 'Sandwiches are named after the Earl of Sandwich who wanted food he could eat while playing cards!',
            'pizza': 'The world\'s first pizzeria opened in Naples, Italy in 1830 and is still open today!',
            'sushi': 'Sushi actually refers to the rice, not the fish! The word means "sour tasting".',
            'tacos': 'Tacos have been eaten for thousands of years - long before the Spanish arrived in Mexico!'
        };
        
        // Phonics learning tips
        this.phonicsTips = [
            'Great job sounding out the letters! Breaking words into sounds helps with reading.',
            'Notice how some letters make different sounds together, like "CH" and "SH".',
            'Practice saying each letter sound as you guess - it helps build reading skills!',
            'Vowels (A, E, I, O, U) are the backbone of words. Try guessing them first!',
            'Double letters often make the same sound as single letters - like "LL" in "butterfly".',
            'Silent letters are tricky! Some words have letters you don\'t pronounce.',
            'Blending sounds together is key to reading. Try it: B-U-T-T-E-R-F-L-Y!',
            'The more words you learn, the better your spelling and reading become!'
        ];
        
        this.currentWord = '';
        this.currentCategory = '';
        this.guessedLetters = [];
        this.wrongGuesses = 0;
        this.maxWrongGuesses = 6;
        this.gameOver = false;
        this.streak = 0;
        this.hintsUsed = 0;
        
        this.bodyParts = ['head', 'body', 'left-arm', 'right-arm', 'left-leg', 'right-leg'];
    }

    initGame() {
        this.selectRandomWord();
        this.guessedLetters = [];
        this.wrongGuesses = 0;
        this.gameOver = false;
        this.hintsUsed = 0;
        
        this.hideAllBodyParts();
        this.renderWord();
        this.renderKeyboard();
        this.updateUI();
        this.hideEducationalFact();
    }

    selectRandomWord() {
        const categories = Object.keys(this.words);
        this.currentCategory = categories[Math.floor(Math.random() * categories.length)];
        const categoryWords = this.words[this.currentCategory];
        this.currentWord = categoryWords[Math.floor(Math.random() * categoryWords.length)].toLowerCase();
    }

    hideAllBodyParts() {
        this.bodyParts.forEach(part => {
            const el = document.getElementById(part);
            if (el) el.style.display = 'none';
        });
    }

    showBodyPart(index) {
        if (index < this.bodyParts.length) {
            const el = document.getElementById(this.bodyParts[index]);
            if (el) el.style.display = 'block';
        }
    }

    renderWord() {
        const container = document.getElementById('word-display');
        if (!container) return;
        
        container.innerHTML = '';
        
        for (const letter of this.currentWord) {
            if (letter === ' ') {
                const space = document.createElement('div');
                space.className = 'word-space';
                container.appendChild(space);
            } else {
                const slot = document.createElement('div');
                slot.className = 'letter-slot';
                
                if (this.guessedLetters.includes(letter)) {
                    slot.textContent = letter;
                    slot.classList.add('revealed');
                }
                
                container.appendChild(slot);
            }
        }
    }

    renderKeyboard() {
        const container = document.getElementById('keyboard');
        if (!container) return;
        
        container.innerHTML = '';
        const letters = 'abcdefghijklmnopqrstuvwxyz';
        
        for (const letter of letters) {
            const btn = document.createElement('button');
            btn.className = 'key-btn';
            btn.textContent = letter.toUpperCase();
            btn.dataset.letter = letter;
            btn.setAttribute('aria-label', `Guess letter ${letter.toUpperCase()}`);
            
            if (this.guessedLetters.includes(letter)) {
                btn.disabled = true;
                btn.classList.add(this.currentWord.includes(letter) ? 'correct' : 'wrong');
            }
            
            btn.addEventListener('click', () => this.guessLetter(letter));
            container.appendChild(btn);
        }
    }

    guessLetter(letter) {
        if (this.gameOver) return;
        if (this.guessedLetters.includes(letter)) return;
        
        this.guessedLetters.push(letter);
        
        if (this.currentWord.includes(letter)) {
            // Correct guess
            this.renderWord();
            this.checkWin();
        } else {
            // Wrong guess
            this.wrongGuesses++;
            this.showBodyPart(this.wrongGuesses - 1);
            this.checkLose();
        }
        
        this.renderKeyboard();
        this.updateUsedLetters();
        this.updateUI();
    }

    checkWin() {
        const allLettersGuessed = this.currentWord
            .split('')
            .filter(l => l !== ' ')
            .every(letter => this.guessedLetters.includes(letter));
        
        if (allLettersGuessed) {
            this.gameOver = true;
            this.streak++;
            this.showWinModal();
        }
    }

    checkLose() {
        if (this.wrongGuesses >= this.maxWrongGuesses) {
            this.gameOver = true;
            this.streak = 0;
            this.showLoseModal();
        }
    }

    useHint() {
        if (this.gameOver) return;
        if (this.wrongGuesses >= this.maxWrongGuesses - 1) return; // Need at least 1 try
        
        // Find an unguessed letter in the word
        const unguessedLetters = this.currentWord
            .split('')
            .filter(l => l !== ' ' && !this.guessedLetters.includes(l));
        
        if (unguessedLetters.length === 0) return;
        
        // Reveal a random unguessed letter
        const randomLetter = unguessedLetters[Math.floor(Math.random() * unguessedLetters.length)];
        this.hintsUsed++;
        this.wrongGuesses++; // Hint costs 1 try
        this.showBodyPart(this.wrongGuesses - 1);
        
        this.guessLetter(randomLetter);
    }

    updateUsedLetters() {
        const container = document.getElementById('used-letters');
        if (!container) return;
        
        const wrongLetters = this.guessedLetters
            .filter(l => !this.currentWord.includes(l))
            .map(l => l.toUpperCase())
            .join(' ');
        
        container.textContent = wrongLetters;
    }

    updateUI() {
        const categoryEl = document.getElementById('category');
        const triesEl = document.getElementById('tries-left');
        const streakEl = document.getElementById('streak');
        const hintBtn = document.getElementById('hint-btn');
        
        if (categoryEl) categoryEl.textContent = this.currentCategory;
        
        if (triesEl) {
            const triesLeft = this.maxWrongGuesses - this.wrongGuesses;
            triesEl.textContent = triesLeft;
            triesEl.className = triesLeft <= 2 ? 'danger' : '';
        }
        
        if (streakEl) streakEl.textContent = this.streak;
        
        if (hintBtn) {
            hintBtn.disabled = this.gameOver || this.wrongGuesses >= this.maxWrongGuesses - 1;
        }
    }

    /**
     * Get educational fact for current word
     */
    getEducationalFact() {
        return this.educationalFacts[this.currentWord] || `The word "${this.currentWord}" is a great vocabulary word!`;
    }

    /**
     * Get random phonics tip
     */
    getRandomPhonicsTip() {
        return this.phonicsTips[Math.floor(Math.random() * this.phonicsTips.length)];
    }

    /**
     * Show educational fact card
     */
    showEducationalFact() {
        let factCard = document.getElementById('edu-fact-card');
        
        if (!factCard) {
            factCard = document.createElement('div');
            factCard.id = 'edu-fact-card';
            factCard.className = 'edu-fact-card';
            factCard.innerHTML = `
                <h4>📚 DID YOU KNOW?</h4>
                <p id="edu-fact-text"></p>
                <div class="phonics-tip" style="margin-top: 15px; padding-top: 15px; border-top: 1px solid rgba(57, 255, 20, 0.3);">
                    <h4 style="color: #ffbf00;">✏️ LEARNING TIP</h4>
                    <p id="phonics-tip-text" style="font-size: 0.85rem; color: #ddd;"></p>
                </div>
            `;
            
            // Insert after game-over-modal content
            const modal = document.getElementById('game-over-modal');
            if (modal) {
                const modalContent = modal.querySelector('.modal-content');
                if (modalContent) {
                    modalContent.appendChild(factCard);
                }
            }
        }
        
        const factText = document.getElementById('edu-fact-text');
        const phonicsTip = document.getElementById('phonics-tip-text');
        
        if (factText) factText.textContent = this.getEducationalFact();
        if (phonicsTip) phonicsTip.textContent = this.getRandomPhonicsTip();
        
        factCard.style.display = 'block';
    }

    /**
     * Hide educational fact card
     */
    hideEducationalFact() {
        const factCard = document.getElementById('edu-fact-card');
        if (factCard) factCard.style.display = 'none';
    }

    showWinModal() {
        const modal = document.getElementById('game-over-modal');
        const title = document.getElementById('modal-title');
        const message = document.getElementById('modal-message');
        
        title.textContent = '🎉 You Won!';
        title.className = 'win';
        message.innerHTML = `
            Congratulations! You guessed the word!<br><br>
            <span class="answer">${this.currentWord.toUpperCase()}</span><br><br>
            🔥 Streak: ${this.streak}
        `;
        
        // Show educational fact
        this.showEducationalFact();
        
        modal.classList.add('show');
        
        // Play win sound if retro arcade is available
        if (window.retroArcade) {
            window.retroArcade.playSound('win');
            window.retroArcade.updateProgressStats({ gamesPlayed: 1, gamesWon: 1 });
        }
    }

    showLoseModal() {
        const modal = document.getElementById('game-over-modal');
        const title = document.getElementById('modal-title');
        const message = document.getElementById('modal-message');
        
        title.textContent = '😔 Game Over!';
        title.className = 'lose';
        message.innerHTML = `
            The word was:<br><br>
            <span class="answer">${this.currentWord.toUpperCase()}</span><br><br>
            Better luck next time!
        `;
        
        // Show educational fact even on loss
        this.showEducationalFact();
        
        modal.classList.add('show');
        
        // Play lose sound if retro arcade is available
        if (window.retroArcade) {
            window.retroArcade.playSound('lose');
            window.retroArcade.updateProgressStats({ gamesPlayed: 1, gameLost: true });
        }
    }
}

// Initialize game
document.addEventListener('DOMContentLoaded', () => {
    const game = new HangmanGame();
    
    document.getElementById('new-game-btn')?.addEventListener('click', () => game.initGame());
    document.getElementById('hint-btn')?.addEventListener('click', () => game.useHint());
    document.getElementById('modal-new-game-btn')?.addEventListener('click', () => {
        document.getElementById('game-over-modal').classList.remove('show');
        game.initGame();
    });
    
    document.getElementById('toggle-instructions-btn')?.addEventListener('click', () => {
        const instructions = document.getElementById('instructions');
        instructions.style.display = instructions.style.display === 'none' ? 'block' : 'none';
    });
    
    // Keyboard support
    document.addEventListener('keydown', (e) => {
        if (e.key.length === 1 && e.key.match(/[a-z]/i)) {
            game.guessLetter(e.key.toLowerCase());
        }
    });
    
    game.initGame();
});
