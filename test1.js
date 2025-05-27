let currentQ = 0;
    let score = 0;
    let gender = null; // 성별 저장

    const questions = [
      { text: "당신의 성별은?", options: ["남성", "여성"], gender:["남성","여성"]},
      { text: "친구와 약속할 때 나는?", options: ["먼저 연락한다", "기다린다"], scores: [1, 2] },
      { text: "혼자 있는 시간이?", options: ["친구들이랑 만나는게 더 좋다","편하다"], scores: [2,1] },
      { text: "결정을 내릴 때 나는?", options: ["결정을 할 때 망설이지 않는다", "선택하기까지 시간이 오래 걸린다"], scores: [1, 2] },
      { text: "휴일엔?", options: ["밖에 나간다", "집에서 쉰다"], scores: [1, 2] },
      { text: "나는 감정을 표현하는게", options: ["쉽다", "어렵다"], scores: [1, 2] }
    ];

    // 결과를 이미지+텍스트 HTML로 저장
    const results = [
      '<img src="img/test1결과_테토남.png" alt="테토남 결과 이미지"><p>당신은 테스토스테론이 높은 테토남!</p>',
      '<img src="img/test1결과_테토녀.png" alt="테토녀 결과 이미지"><p>당신은 테스토스테론이 높은 테토녀!</p>',
      '<img src="img/test1결과_에겐남.png" alt="에겐남 결과 이미지"><p>당신은 에스트로겐이 높은 에겐남!</p>',
      '<img src="img/test1결과_에겐녀.png" alt="에겐녀 결과 이미지"><p>당신은 에스트로겐이 높은 에겐녀!</p>'
    ];

    function showSection(id) {
      document.querySelectorAll('.section').forEach(sec => sec.classList.remove('active'));
      document.getElementById(id).classList.add('active');
    }

    function updateProgressBar() {
      const total = questions.length;
      const percent = Math.round((currentQ / total) * 100);
      const bar = document.getElementById('progressBar');
      const label = document.getElementById('progressLabel');
      bar.style.width = percent + '%';
      label.textContent = percent + '%';
    }

    function showQuestion() {
      updateProgressBar();

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
      document.getElementById("progressContainer").style.display = "none";

      let resultIndex = 0;
      if (gender == "남성") {
        resultIndex = (score <= 7) ? 0 : 2;
      } 
      else if (gender == "여성") {
        resultIndex = (score <= 7) ? 1 : 3;
      } 
      else {
        resultIndex = 0;
      }
      document.getElementById("resultText").innerHTML = results[resultIndex];
    }

    window.onload = () => {
      showSection('question');
      showQuestion();
    };