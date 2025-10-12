const quizData = [
    {
        question: "Apa rumus hukum II Newton?",
        options: [
            "F = m × a",
            "F = m + a",
            "F = m / a",
            "F = a / m"
        ],
        correctIndex: 0,
        explanation: "Hukum II Newton menyatakan bahwa gaya (F) sama dengan massa (m) dikalikan percepatan (a)."
    },
    {
        question: "Jika massa benda 5 kg dan percepatan 2 m/s², berapakah gaya yang bekerja?",
        options: [
            "10 N",
            "7 N",
            "3 N",
            "1 N"
        ],
        correctIndex: 0,
        explanation: "Gaya dihitung dengan rumus F = m × a, jadi 5 kg × 2 m/s² = 10 N."
    },
    {
        question: "Apa satuan gaya dalam SI?",
        options: [
            "Newton (N)",
            "Joule (J)",
            "Watt (W)",
            "Pascal (Pa)"
        ],
        correctIndex: 0,
        explanation: "Satuan gaya dalam Sistem Internasional adalah Newton (N)."
    },
    {
        question: "Jika gaya yang bekerja 20 N dan massa benda 4 kg, berapakah percepatan benda?",
        options: [
            "5 m/s²",
            "8 m/s²",
            "4 m/s²",
            "2 m/s²"
        ],
        correctIndex: 0,
        explanation: "Percepatan dihitung dengan rumus a = F / m, jadi 20 N / 4 kg = 5 m/s²."
    },
    {
        question: "Apa yang terjadi jika gaya yang bekerja pada benda nol?",
        options: [
            "Benda diam atau bergerak lurus beraturan",
            "Benda bergerak melingkar",
            "Benda bergerak zig-zag",
            "Benda melambat"
        ],
        correctIndex: 0,
        explanation: "Jika gaya yang bekerja nol, benda akan diam atau bergerak lurus beraturan sesuai hukum I Newton."
    }
];

let currentQuestionIndex = 0;
let userAnswers = new Array(quizData.length).fill(null);

const questionNumberElem = document.getElementById('questionNumber');
const questionTextElem = document.getElementById('questionText');
const optionsContainer = document.getElementById('optionsContainer');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const quizResults = document.getElementById('quizResults');
const quizContent = document.getElementById('quizContent');
const currentQuestionElem = document.getElementById('currentQuestion');
const totalQuestionsElem = document.getElementById('totalQuestions');
const correctCountElem = document.getElementById('correctCount');
const incorrectCountElem = document.getElementById('incorrectCount');
const percentageScoreElem = document.getElementById('percentageScore');
const resultsScoreElem = document.getElementById('resultsScore');
const performanceMessageElem = document.getElementById('performanceMessage');
const restartBtn = document.getElementById('restartBtn');
const reviewBtn = document.getElementById('reviewBtn');
const continueBtn = document.getElementById('continueBtn');
const quizReview = document.getElementById('quizReview');
const reviewContent = document.getElementById('reviewContent');
const closeReviewBtn = document.getElementById('closeReviewBtn');

// Music functionality
const musicAudio = document.getElementById('quizMusic');
const musicToggle = document.getElementById('musicToggle');
let musicEnabled = localStorage.getItem('quizMusicEnabled') === 'true';

function initMusic() {
    if (musicEnabled) {
        musicToggle.textContent = '🔊';
        musicToggle.classList.remove('muted');
        musicAudio.play().catch(e => console.log('Autoplay prevented:', e));
    } else {
        musicToggle.textContent = '🔇';
        musicToggle.classList.add('muted');
        musicAudio.pause();
        musicAudio.currentTime = 0;
    }
}

musicToggle.addEventListener('click', () => {
    musicEnabled = !musicEnabled;
    localStorage.setItem('quizMusicEnabled', musicEnabled);
    initMusic();
});

totalQuestionsElem.textContent = quizData.length;

function loadQuestion(index) {
    const q = quizData[index];
    questionNumberElem.textContent = `Pertanyaan ${index + 1}`;
    questionTextElem.textContent = q.question;
    optionsContainer.innerHTML = '';
    q.options.forEach((option, i) => {
        const label = document.createElement('label');
        label.className = 'option-label';
        label.innerHTML = `
            <input type="radio" name="option" value="${i}" ${userAnswers[index] === i ? 'checked' : ''} />
            ${option}
        `;
        label.querySelector('input').addEventListener('change', () => {
            userAnswers[index] = i;
            updateButtons();
        });
        optionsContainer.appendChild(label);
    });
    currentQuestionElem.textContent = index + 1;
    const progressPercentage = ((index + 1) / quizData.length) * 100;
    document.getElementById('progressFill').style.width = progressPercentage + '%';
    updateButtons();
}

function updateButtons() {
    prevBtn.disabled = currentQuestionIndex === 0;
    nextBtn.disabled = userAnswers[currentQuestionIndex] === null;
    if (currentQuestionIndex === quizData.length - 1) {
        nextBtn.textContent = 'Submit';
    } else {
        nextBtn.textContent = 'Selanjutnya ➡️';
    }
}

prevBtn.addEventListener('click', () => {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        loadQuestion(currentQuestionIndex);
    }
});

nextBtn.addEventListener('click', () => {
    if (userAnswers[currentQuestionIndex] === null) return;
    if (currentQuestionIndex < quizData.length - 1) {
        currentQuestionIndex++;
        loadQuestion(currentQuestionIndex);
    } else {
        showResults();
    }
});

    function showResults() {
        let correctCount = 0;
        quizData.forEach((q, i) => {
            if (userAnswers[i] === q.correctIndex) correctCount++;
        });
        const incorrectCount = quizData.length - correctCount;
        const percentage = Math.round((correctCount / quizData.length) * 100);

        quizContent.style.display = 'none';
        quizResults.style.display = 'block';
        document.getElementById('quizProgress').style.display = 'none';

        // Stop music when quiz is completed
        musicAudio.pause();
        musicAudio.currentTime = 0;

        correctCountElem.textContent = correctCount;
        incorrectCountElem.textContent = incorrectCount;
        percentageScoreElem.textContent = percentage + '%';
        resultsScoreElem.textContent = `${correctCount} / ${quizData.length}`;

        if (percentage >= 80) {
            performanceMessageElem.textContent = 'Pemahaman Anda tentang Hukum Newton II sangat baik!';
        } else if (percentage >= 50) {
            performanceMessageElem.textContent = 'Pemahaman Anda cukup baik, tapi masih bisa ditingkatkan.';
        } else {
            performanceMessageElem.textContent = 'Anda perlu belajar lebih banyak tentang Hukum Newton II.';
        }
    }

    restartBtn.addEventListener('click', () => {
        userAnswers.fill(null);
        currentQuestionIndex = 0;
        quizResults.style.display = 'none';
        quizContent.style.display = 'block';
        document.getElementById('quizProgress').style.display = 'flex';
        loadQuestion(currentQuestionIndex);
    });

reviewBtn.addEventListener('click', () => {
    quizResults.style.display = 'none';
    quizReview.style.display = 'block';
    reviewContent.innerHTML = '';
    quizData.forEach((q, i) => {
        const isCorrect = userAnswers[i] === q.correctIndex;
        const div = document.createElement('div');
        div.style.border = isCorrect ? '2px solid #4CAF50' : '2px solid #f44336';
        div.style.borderRadius = '12px';
        div.style.padding = '15px';
        div.style.marginBottom = '20px';
        div.style.backgroundColor = isCorrect ? '#e8f5e9' : '#ffebee';
        div.innerHTML = `
            <p><strong>${i + 1}. ${q.question}</strong></p>
            <p style="color: ${isCorrect ? '#4CAF50' : '#f44336'};">Jawaban Anda: ${q.options[userAnswers[i]] || 'Belum dijawab'}</p>
            <p style="color: #4CAF50;">Jawaban Benar: ${q.options[q.correctIndex]}</p>
            <p style="background-color: ${isCorrect ? '#c8e6c9' : '#ffcdd2'}; padding: 10px; border-radius: 8px; font-style: italic;">${q.explanation}</p>
        `;
        reviewContent.appendChild(div);
    });
});

closeReviewBtn.addEventListener('click', () => {
    quizReview.style.display = 'none';
    quizResults.style.display = 'block';
});

function initializeUserInfo() {
  const userData = localStorage.getItem('currentUser');
  if (userData) {
    const user = JSON.parse(userData);
    document.getElementById('userName').textContent = user.name || 'Aulia';
    document.getElementById('userAvatar').textContent = user.avatar || 'A';
  }
}

function logout() {
  if (confirm('Apakah Anda yakin ingin keluar dari akun?')) {
    localStorage.removeItem('currentUser');
    window.location.href = '../index.html';
  }
}

function goBackToDashboard() {
  if (confirm('Apakah Anda yakin ingin keluar dari kuis?')) {
    window.location.href = 'homepage.html';
  }
}

document.addEventListener('DOMContentLoaded', () => {
    initializeUserInfo();
    initMusic();
    loadQuestion(currentQuestionIndex);
});