const reviewScreen = document.getElementById("review-screen");
const reviewButton = document.getElementById("review-button");
const homeButton = document.getElementById("home-button");
const homeButtonReview = document.getElementById("home-button-review");

const startScreen = document.getElementById("start-screen");
const quizScreen = document.getElementById("quiz-screen");
const resultScreen = document.getElementById("result-screen");
const errorMessage = document.getElementById("error-message");

const courseList = document.getElementById("course-list");
const courseInfo = document.getElementById("course-info");
const startButton = document.getElementById("start-button");

const questionCounter = document.getElementById("question-counter");
const progressLabel = document.getElementById("progress-label");
const progressBar = document.getElementById("progress-bar");
const questionText = document.getElementById("question-text");
const optionsContainer = document.getElementById("options-container");
const feedback = document.getElementById("feedback");

const previousButton = document.getElementById("previous-button");
const nextButton = document.getElementById("next-button");
const endQuizButton = document.getElementById("end-quiz-button");
const restartButton = document.getElementById("restart-button");

let questions = [];
let currentIndex = 0;
let answers = [];
let courses = [];
let selectedCourse = null;
let isReviewMode = false;

// Menampilkan pesan kesalahan
function showError(message) {
  errorMessage.textContent = message;
  errorMessage.classList.remove("hidden");
}

// Menyembunyikan pesan kesalahan
function hideError() {
  errorMessage.textContent = "";
  errorMessage.classList.add("hidden");
}

// Memperbarui informasi mata kuliah yang dipilih

function updateCourseInfo() {
  courseList.replaceChildren();

  courses.forEach(course => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "course-card";

    if (selectedCourse && selectedCourse.kode === course.kode) {
      card.classList.add("selected");
      card.setAttribute("aria-pressed", "true");
    } else {
      card.setAttribute("aria-pressed", "false");
    }

    const code = document.createElement("span");
    code.className = "course-card-code";
    code.textContent = course.kode;

    const name = document.createElement("span");
    name.className = "course-card-name";
    name.textContent = course.nama;

    const indicator = document.createElement("span");
    indicator.className = "course-card-indicator";
    indicator.textContent =
      selectedCourse && selectedCourse.kode === course.kode
        ? "✓ Dipilih"
        : "Pilih mata kuliah";

    card.append(code, name, indicator);

    card.addEventListener("click", () => {
      selectedCourse = course;
      updateCourseInfo();
    });

    courseList.appendChild(card);
  });

  if (selectedCourse) {
    courseInfo.textContent =
      `Mata kuliah dipilih: ${selectedCourse.kode} — ${selectedCourse.nama}`;
    startButton.disabled = false;
  } else {
    courseInfo.textContent =
      courses.length
        ? "Silakan pilih salah satu mata kuliah di atas."
        : "Belum ada mata kuliah yang tersedia.";

    startButton.disabled = true;
  }
}

async function loadCourses() {
  courseInfo.textContent = "Memuat daftar mata kuliah...";
  startButton.disabled = true;

  try {
    const response = await fetch("./data/mata-kuliah.json");

    if (!response.ok) {
      throw new Error(
        `Gagal membaca daftar mata kuliah: HTTP ${response.status}`
      );
    }

    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      throw new Error("Daftar mata kuliah kosong atau format JSON salah.");
    }

    for (const course of data) {
      if (!course.kode || !course.nama || !course.file) {
        throw new Error(
          "Data mata kuliah harus memiliki kode, nama, dan file."
        );
      }
    }

    courses = data;
    selectedCourse = null;
    updateCourseInfo();
  } catch (error) {
    console.error("Kesalahan memuat mata kuliah:", error);
    courseList.replaceChildren();
    courseInfo.textContent = `Gagal memuat mata kuliah: ${error.message}`;
    startButton.disabled = true;
  }
}


// Memuat soal sesuai mata kuliah yang dipilih
async function startQuiz() {
  if (!selectedCourse) {
    courseInfo.textContent = "Silakan pilih mata kuliah terlebih dahulu.";
    return;
  }

  startButton.disabled = true;
  startButton.textContent = "Memuat Soal...";
  hideError();

  try {
    const response = await fetch(
      `./data/${encodeURIComponent(selectedCourse.file)}`
    );

    if (!response.ok) {
      throw new Error(
        `Gagal memuat soal ${selectedCourse.kode}: HTTP ${response.status}. ` +
        `Periksa file data/${selectedCourse.file}.`
      );
    }

    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      throw new Error(
        `File ${selectedCourse.file} kosong atau bukan berupa array JSON.`
      );
    }

    for (let i = 0; i < data.length; i++) {
      const question = data[i];

      if (
        typeof question.question !== "string" ||
        !Array.isArray(question.options) ||
        question.options.length === 0 ||
        typeof question.answer !== "string"
      ) {
        throw new Error(
          `Format soal nomor ${i + 1} pada ${selectedCourse.file} tidak sesuai.`
        );
      }

      if (!question.options.includes(question.answer)) {
        throw new Error(
          `Kunci jawaban soal nomor ${i + 1} tidak cocok dengan pilihan jawaban.`
        );
      }
    }

    questions = data;
    currentIndex = 0;
    answers = questions.map(() => null);

    startScreen.classList.add("hidden");
    resultScreen.classList.add("hidden");
    quizScreen.classList.remove("hidden");

    renderQuestion();
    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch (error) {
    console.error("Kesalahan memuat soal:", error);
    showError(error.message);
    startScreen.classList.remove("hidden");
    quizScreen.classList.add("hidden");
    resultScreen.classList.add("hidden");
  } finally {
    startButton.textContent = "Mulai Kuis";
    startButton.disabled = !selectedCourse;
  }
}

// Menampilkan soal dan pilihan jawaban
function renderQuestion() {
  if (!questions.length) return;

  const question = questions[currentIndex];

  questionCounter.textContent =
    `Soal ${currentIndex + 1} dari ${questions.length}`;

  document.getElementById("course-code").textContent =
    `${selectedCourse.kode} — ${selectedCourse.nama}`;

  progressLabel.textContent =
    `${answers.filter(answer => answer !== null).length} dijawab`;

  progressBar.style.width =
    `${((currentIndex + 1) / questions.length) * 100}%`;

  questionText.textContent = question.question;
  optionsContainer.replaceChildren();

  question.options.forEach((option, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "option-button";

    const letter = document.createElement("span");
    letter.className = "option-letter";
    letter.textContent = String.fromCharCode(65 + index);

    const text = document.createElement("span");
    text.textContent = option;

    button.append(letter, text);

   button.addEventListener("click", () => {
  if (isReviewMode || answers[currentIndex] !== null) return;

  answers[currentIndex] = option;
  renderQuestion();
});

    optionsContainer.appendChild(button);
  });

  const selectedAnswer = answers[currentIndex];
  if (isReviewMode) {
  question.options.forEach((option, index) => {
    const button = optionsContainer.children[index];

    button.disabled = true;

    if (option === question.answer) {
      button.classList.add("correct");
    }

    if (
      answers[currentIndex] === option &&
      option !== question.answer
    ) {
      button.classList.add("wrong");
    }
  });
}

if (selectedAnswer !== null || isReviewMode) {
    const correct =
  selectedAnswer !== null &&
  selectedAnswer === question.answer;

    [...optionsContainer.children].forEach((button, index) => {
      const option = question.options[index];
      button.disabled = true;

      if (option === question.answer) {
        button.classList.add("correct");
      }

      if (option === selectedAnswer && !correct) {
        button.classList.add("wrong");
      }
    });

    feedback.className =
      `feedback ${correct ? "correct" : "wrong"}`;

    const heading = document.createElement("h3");
    heading.textContent =
  selectedAnswer === null
    ? "Belum Dijawab"
    : correct
      ? "✓ Jawaban Benar"
      : "✕ Jawaban Salah";

    const key = document.createElement("p");
    const answerIndex = question.options.indexOf(question.answer);

    key.textContent =
      `Kunci jawaban: ${String.fromCharCode(65 + answerIndex)}. ` +
      question.answer;

    const explanationTitle = document.createElement("strong");
    explanationTitle.textContent = "Pembahasan";

    const explanation = document.createElement("p");
    explanation.textContent =
      question.penjelasan || "Pembahasan belum tersedia.";

    feedback.replaceChildren(
      heading,
      key,
      explanationTitle,
      explanation
    );

    feedback.classList.remove("hidden");
  } else {
    feedback.className = "feedback hidden";
    feedback.replaceChildren();
  }

 previousButton.disabled = currentIndex === 0;
nextButton.disabled = currentIndex === questions.length - 1;
endQuizButton.disabled = false;

  nextButton.textContent =
    currentIndex === questions.length - 1
      ? "Lihat Hasil"
      : "Soal Berikutnya";
}

// Pindah ke soal berikutnya
function goNext() {
  if (!questions.length) return;

  if (currentIndex < questions.length - 1) {
    currentIndex++;
    renderQuestion();
  } else {
    showResults();
  }
}

// Kembali ke soal sebelumnya
function goPrevious() {
  if (currentIndex > 0) {
    currentIndex--;
    renderQuestion();
  }
}

// Menampilkan nilai akhir dan pembahasan seluruh soal

function showResults() {
  quizScreen.classList.add("hidden");
  reviewScreen.classList.add("hidden");
  resultScreen.classList.remove("hidden");

  const correctCount = questions.reduce((total, question, index) => {
    return total +
      (answers[index] === question.answer ? 1 : 0);
  }, 0);

  const answeredCount =
    answers.filter(answer => answer !== null).length;

  // Satu jawaban benar = satu poin
  document.getElementById("final-score").textContent = correctCount;

  document.getElementById("result-summary").textContent =
    `Mata kuliah: ${selectedCourse.nama}. ` +
    `Jawaban benar: ${correctCount} dari ${questions.length}. ` +
    `Soal dijawab: ${answeredCount} dari ${questions.length}.`;

  // Siapkan isi review tanpa menampilkannya dahulu
  const review = document.getElementById("review-container");
  review.replaceChildren();

  questions.forEach((question, index) => {
    const item = document.createElement("article");
    item.className = "review-item";

    const title = document.createElement("h3");
    title.textContent = `Soal ${index + 1}`;

    const status = document.createElement("p");
    if (answers[index] === null) {
      status.textContent = "Belum dijawab";
    } else {
      status.textContent =
        answers[index] === question.answer ? "✓ Benar" : "✕ Salah";
    }

    const questionParagraph = document.createElement("p");
    questionParagraph.textContent = question.question;

    const userAnswer = document.createElement("p");
    userAnswer.textContent =
      `Jawaban Anda: ${answers[index] ?? "Belum dijawab"}`;

    const answerParagraph = document.createElement("p");
    answerParagraph.textContent =
      `Kunci jawaban: ${question.answer}`;

    const explanation = document.createElement("p");
    explanation.textContent =
      `Pembahasan: ${question.penjelasan || "Belum tersedia."}`;

    item.append(
      title,
      status,
      questionParagraph,
      userAnswer,
      answerParagraph,
      explanation
    );

    review.appendChild(item);
  });

  window.scrollTo({ top: 0, behavior: "smooth" });
}


// Menghubungkan tombol dengan fungsinya


reviewButton.addEventListener("click", () => {
  isReviewMode = true;

  resultScreen.classList.add("hidden");
  quizScreen.classList.remove("hidden");

  // Nonaktifkan navigasi soal saat review
  previousButton.disabled = true;
  nextButton.disabled = true;
  endQuizButton.disabled = false;
  endQuizButton.textContent = "Akhiri Kuis";

  renderQuestion();

  window.scrollTo({ top: 0, behavior: "smooth" });
});

function returnToHome() {
  resultScreen.classList.add("hidden");
  reviewScreen.classList.add("hidden");
  quizScreen.classList.add("hidden");
  startScreen.classList.remove("hidden");
  isReviewMode = false;

  questions = [];
  answers = [];
  currentIndex = 0;

  hideError();
  updateCourseInfo();

  window.scrollTo({ top: 0, behavior: "smooth" });
}

homeButton.addEventListener("click", returnToHome);
homeButtonReview.addEventListener("click", returnToHome);


startButton.addEventListener("click", startQuiz);
previousButton.addEventListener("click", goPrevious);
nextButton.addEventListener("click", goNext);
endQuizButton.addEventListener("click", () => {
  if (isReviewMode) {
    // Keluar dari review dan kembali ke halaman hasil
    isReviewMode = false;
    quizScreen.classList.add("hidden");
    resultScreen.classList.remove("hidden");

    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  const confirmed = window.confirm(
    "Apakah Anda yakin ingin mengakhiri kuis?\n\n" +
    "Jawaban yang belum diisi akan dihitung salah."
  );

  if (confirmed) {
    showResults();
  }
});



// Memuat daftar mata kuliah saat halaman dibuka
loadCourses();
