let testStarted = false;
let startTime = null;
let finishTime = null;
let timer = null;
let trialCount = 0;
let successfulClicks = 0;
const reactionTimes = [];

const clickarea = document.querySelector('.clickarea');
const message = document.querySelector('.message');
const note = document.querySelector('.note');

const randomNumber = (min, max, int = false) => {
  return int ? Math.floor(Math.random() * (max - min + 1)) + min : Math.random() * (max - min) + min;
};

const updateText = (messageText, noteText) => {
  message.textContent = messageText;
  note.textContent = noteText;
};

const handleClick = event => {
  event.preventDefault();
  event.stopPropagation();

  if (trialCount < 20) {
    if (!testStarted) {
      if (trialCount === 0) {
        updateText('Lakukan 5 kali percobaan terlebih dahulu', ''); // Teks khusus pada percobaan pertama
      } else if (trialCount >= 1 && trialCount <= 4) {
        updateText('Tunggu warna hijau', ''); // Teks khusus untuk percobaan 2-5
      } else if (trialCount === 5) {
        updateText('Mulai Test', ''); // Teks khusus pada percobaan ke-6
      } else {
        updateText('Tunggu warna hijau', ''); // Teks khusus untuk percobaan 7-20
      }
      const msUntilGreen = randomNumber(2, 4);
      startTime = new Date();
      finishTime = new Date(startTime.getTime() + (msUntilGreen * 1000));

      clickarea.classList.add('red');
      clickarea.classList.remove('green');
      
      testStarted = true;

      timer = setTimeout(() => {
        clickarea.classList.remove('red');
        clickarea.classList.add('green');
        message.textContent = 'Klik!';
      }, msUntilGreen * 1000);
    } else {
      testStarted = false;

      if (new Date() < finishTime) {
        clearTimeout(timer);
        clickarea.classList.remove('red');
        updateText('Terlalu cepat!', 'Klik untuk mencoba lagi');
      } else {
        const reactionTime = new Date() - finishTime;

        if (reactionTime > 580) {
          // Ulang percobaan jika waktu reaksi lebih dari 580ms
          updateText('Waktu lebih dari 580ms - Ulangi percobaan', '');
        } else {
          trialCount++;
          successfulClicks++;
          reactionTimes.push(reactionTime);
          clickarea.classList.remove('green');
          updateText(`${reactionTime}ms`, `Klik untuk melanjutkan - Percobaan ${trialCount}`);
        }
      }
    }
  } else {
    const averageReactionTime = reactionTimes.slice(5).reduce((acc, time) => acc + time, 0) / (reactionTimes.length - 5);

    let resultText = '';
    if (averageReactionTime >= 150 && averageReactionTime <= 240) {
      resultText = 'Normal';
    } else if (averageReactionTime > 240 && averageReactionTime <= 410) {
      resultText = 'Kelelahan Ringan';
    } else if (averageReactionTime > 410 && averageReactionTime <= 580) {
      resultText = 'Kelelahan Sedang';
    } else {
      resultText = 'Kelelahan Berat';
    }

    updateText(`Rata-rata Waktu Reaksi: ${averageReactionTime.toFixed(2)}ms - ${resultText}`, 'Test selesai');
    clickarea.removeEventListener('mousedown', handleClick);
    clickarea.removeEventListener('touchstart', handleClick);

    // Memainkan suara berdasarkan hasil percobaan
    if (resultText === 'Normal') {
      document.getElementById('audio-normal').play();
    } else if (resultText === 'Kelelahan Ringan') {
      document.getElementById('audio-kelelahan-ringan').play();
    } else if (resultText === 'Kelelahan Sedang') {
      document.getElementById('audio-kelelahan-sedang').play();
    } else if (resultText === 'Kelelahan Berat') {
      document.getElementById('audio-kelelahan-berat').play();
    }
  }
};

clickarea.addEventListener('mousedown', handleClick);
clickarea.addEventListener('touchstart', handleClick);
