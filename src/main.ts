import './index.css';
import { WORDS } from './data/wordsList';
import { GameData } from './types/models';
const rows = 6;
const columns = 5;
const cellSize = '62px';
const successColor = '#538D4E';
const includeColor = '#B59F3B';
const missedColor = '#3A3A3D';

let grid = document.getElementById('grid');
let keyboard = document.getElementById('keyboard');

// const timer = (ms: number) => {
//   return new Promise((res) => setTimeout(res, ms));
// };

const buildGrid = () => {
  for (let i = 0; i < rows; i++) {
    let row = document.createElement('div');
    row.className = 'flex flex-row justify-center mx-5 my-1';
    for (let k = 0; k < columns; k++) {
      let cell = document.createElement('div');
      cell.style.width = cellSize;
      cell.style.height = cellSize;
      cell.style.border = '1px solid #3A3A3D';
      cell.className = 'tile mx-0.5 inline-block text-center text-3xl font-bold py-3 uppercase';
      row.appendChild(cell);
    }
    grid?.appendChild(row);
  }
};

const buildKeyboard = () => {
  buildKeyboardRow('qwertyuiop');
  buildKeyboardRow('asdfghjkl');
  buildKeyboardRow('zxcvbnm', true);
};

const buildKeyboardRow = (letters: string, addControls?: boolean) => {
  let row = document.createElement('div');
  row.className = 'flex flex-row justify-center mx-5 my-1';
  if (addControls) {
    buttonCreation(row, 'Enter');
  }
  for (let k = 0; k < letters.length; k++) {
    buttonCreation(row, letters[k]);
  }
  if (addControls) {
    buttonCreation(row, 'backspace');
  }
  keyboard?.appendChild(row);
};

function buttonCreation(row: HTMLDivElement, letter: string) {
  let button = document.createElement('button');
  button.style.width = 'min-content';
  button.style.height = cellSize;
  button.style.backgroundColor = '#818384';
  button.className = 'mx-1 inline-block text-center text-1xl font-bold p-3 uppercase rounded';
  button.textContent = letter;
  button.onclick = () => handleKey(letter);
  keyboardLetters.set(letter, button);
  row.appendChild(button);
}

const getData = (): GameData | null => {
  const data = localStorage.getItem('wordle');
  return data ? (JSON.parse(data) as GameData) : null;
};

function saveData() {
  let data = JSON.stringify({ secret: secret, historyState: historyWords });
  localStorage.setItem('wordle', data);
}

function clearData() {
  localStorage.removeItem('wordle');
}

let randomIndex = Math.floor(Math.random() * WORDS.length);
let savedGame = getData();
let secret = savedGame?.secret ?? WORDS[randomIndex];
let historyWords: string[] = savedGame?.historyState ?? [];
let currentAttempt = '';
let successLetters = new Set();
let includeLetters = new Set();
let keyboardLetters = new Map();

const updateGrid = () => {
  let row = grid?.children[0];
  historyWords.map((attempt) => {
    drawAttempt(row, attempt, false);
    row = row?.nextElementSibling ?? undefined;
  });
  if (row) {
    drawAttempt(row, currentAttempt, true);
  }
};

const drawAttempt = (row: Element | undefined, attempt: string, isCurrent: boolean) => {
  for (let i = 0; i < columns; i++) {
    let cell = row?.children[i] as HTMLElement | undefined;
    if (cell) {
      cell.textContent = attempt[i];
      cell.style.borderColor = isCurrent && attempt[i] ? 'rgb(86, 87, 88)' : getCellColor(attempt, i);
      if (!isCurrent) {
        cell.setAttribute('data-animation', 'flip-in');
        cell.setAttribute('data-animation', 'flip-out');
        cell.style.backgroundColor = getCellColor(attempt, i);
      }
    }
  }
};

const animatePress = (index: number) => {
  let row = grid?.childNodes[historyWords.length];
  let cell = row?.childNodes[index] as HTMLElement;
  cell.setAttribute('data-animation', 'pop');
};

const removeAnimatePress = (index: number) => {
  let row = grid?.childNodes[historyWords.length];
  let cell = row?.childNodes[index] as HTMLElement;
  cell.setAttribute('data-animation', '');
};

const updateKeyboard = () => {
  for (let [key, button] of keyboardLetters) {
    if (successLetters.has(key)) {
      button.style.backgroundColor = successColor;
    } else if (includeLetters.has(key)) {
      button.style.backgroundColor = includeColor;
    }
  }
};

const getCellColor = (attempt: string, index: number): string => {
  const correctLetter = secret[index];
  const attemptLetter = attempt[index];
  if (attemptLetter === correctLetter) {
    successLetters.add(attemptLetter);
    if (includeLetters.has(attemptLetter)) {
      includeLetters.delete(attemptLetter);
    }
    return successColor;
  }

  if (secret.indexOf(attemptLetter) >= 0) {
    if (!successLetters.has(attemptLetter)) {
      includeLetters.add(attemptLetter);
    }
    return includeColor;
  }

  return missedColor;
};

function stopGame() {
  clearData();
  window.removeEventListener('keydown', handleKeyDown);
}

function handleKeyDown(e: KeyboardEvent) {
  if (e.ctrlKey || e.key === 'Tab' || e.altKey) {
    e.preventDefault();
    return;
  }
  handleKey(e.key);
}

function handleKey(code: string) {
  if (historyWords.length > 0 && historyWords[historyWords.length - 1] === secret) {
    return;
  }
  let letter = code.toLowerCase();
  if (letter === 'enter') {
    if (currentAttempt.length < 5) {
      return;
    }
    if (historyWords.length > 6) {
      return;
    }
    if (!WORDS.includes(currentAttempt)) {
      alert('Not in my dictionary');
      return;
    }
    if (historyWords.length === 5 && currentAttempt !== secret) {
      setTimeout(() => {
        alert(secret);
      }, 100);
    }
    historyWords.push(currentAttempt);
    saveData();
    if (currentAttempt === secret) {
      stopGame();
    }
    currentAttempt = '';
  } else if (letter === 'backspace') {
    if (currentAttempt.length === 0) return;
    currentAttempt = currentAttempt.slice(0, currentAttempt.length - 1);
    removeAnimatePress(currentAttempt.length);
  } else if (/^[a-z]$/.test(letter)) {
    animatePress(currentAttempt.length);
    if (currentAttempt.length < 5) {
      currentAttempt += letter;
    }
  }
  updateGrid();
  updateKeyboard();
}
if (grid && keyboard) {
  buildKeyboard();
  buildGrid();
  updateGrid();
  updateKeyboard();
}
window.addEventListener('keydown', handleKeyDown);
