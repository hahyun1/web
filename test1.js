let currentQ = 0;
let score = 0;
let gender = null; // 성별 저장

const questions = [
  { text: "당신의 성별은?", options: ["남성", "여성"], scores: [1, 2] },
  { text: "친구와 약속할 때 나는?", options: ["먼저 연락한다", "기다린다"], scores: [1, 2] },
  { text: "혼자 있는 시간이?", options: ["편하다", "친구들이랑 만나는게 더 좋다"], scores: [1, 2] },
  { text: "결정을 내릴 때 나는?", options: ["결정을 할 때 망설이지 않는다", "선택하기까지 시간이 오래 걸린다"], scores: [1, 2] },
  { text: "휴일엔?", options: ["밖에 나간다", "집에서 쉰다"], scores: [1, 2] },
  { text: "나는 감정을 표현하는게", options: ["쉽다", "어렵다"], scores: [1, 2] }
];

const results = [
  "당신은 테스토스테론이 높은 테토남!", 
  "당신은 테스토스테론이 높은 테토녀!", 
  "당신은 에스트로겐이 높은 에겐남!", 
  "당신은 에스트로겐이 높은 에겐녀!"  
];

function showSection(id) {
  document.querySelectorAll('.section').forEach(sec => sec.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function showQuestion() {
  if (currentQ >= questions.length) {
    document.getElementById("questionText").innerText = "결과는?";
    document.getElementById("options").innerHTML = "";
    document.getElementById("submitContainer").style.display = "block";
    return;
  }

  const q = questions[currentQ];
  document.getElementById("questionText").innerText = q.text;
  const optionsDiv = document.getElementById("options");
  optionsDiv.innerHTML = "";
  document.getElementById("submitContainer").style.display = "none";

  q.options.forEach((opt, i) => {
    const btn = document.createElement("button");
    btn.innerText = opt;
    btn.onclick = () => {
      if (currentQ === 0) {
        // 첫 질문에서 성별 저장
        gender = opt;
      } else {
        score += q.scores[i];
      }
      currentQ++;
      showQuestion();
    };
    optionsDiv.appendChild(btn);
  });
}

function showResult() {
  document.getElementById("question").style.display = "none";
  document.getElementById("result").style.display = "block";

  // 외향(점수 낮음) / 내향(점수 높음) 기준값
  // 5문항, 각 1~2점, 최소 5점(외향), 최대 10점(내향)
  // 5~7점: 외향, 8~10점: 내향
  let resultIndex = 0;
  if (gender === "남성") {
    resultIndex = (score <= 7) ? 0 : 2; // 테토남:0, 에겐남:2
  } else if (gender === "여성") {
    resultIndex = (score <= 7) ? 1 : 3; // 테토녀:1, 에겐녀:3
  } else {
    resultIndex = 0; // 예외처리
  }
  document.getElementById("resultText").innerText = results[resultIndex];
}

// 페이지 로드시 자동 시작
window.onload = () => {
  showSection('question');
  showQuestion();
};
