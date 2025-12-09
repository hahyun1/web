
// 내 모델 주소
const URL = "https://teachablemachine.withgoogle.com/models/czdYxUrKK/";

let model, labelContainer, maxPredictions;

// [1] 페이지 로드 시 모델 미리 로딩
async function init() {
    const modelURL = URL + "model.json";
    const metadataURL = URL + "metadata.json";

    try {
        model = await tmImage.load(modelURL, metadataURL);
        maxPredictions = model.getTotalClasses();
        console.log("AI 모델 로딩 완료!");
    } catch (e) {
        console.error("모델 로딩 실패:", e);
        alert("AI 모델을 불러오는데 실패했습니다.");
    }
}

// [2] 이미지 업로드 및 분석 시작
function readURL(input) {
    if (input.files && input.files[0]) {
        var reader = new FileReader();
        
        reader.onload = function(e) {
            const img = document.getElementById('face-image');
            img.src = e.target.result;
            img.style.display = 'block';
            
            // 이미지 로딩이 완료되면 예측 실행
            img.onload = function() {
                predict();
            };
        };
        
        reader.readAsDataURL(input.files[0]);
    }
}

// [3] 예측 함수
async function predict() {
    document.getElementById('loading-msg').style.display = 'block';
    document.getElementById("label-container").innerHTML = ""; 
    
    if (!model) await init(); // 모델이 없으면 로드

    const image = document.getElementById("face-image");
    
    // 예측 수행
    const prediction = await model.predict(image, false);
    
    // 확률 순 정렬
    prediction.sort((a, b) => b.probability - a.probability);

    // 1등 결과 가져오기
    const bestClass = prediction[0].className;
    const bestScore = (prediction[0].probability * 100).toFixed(0);

    // 결과 화면 표시
    const resultMsg = `
        <div style="background: #fff; padding: 20px; border-radius: 15px; display: inline-block; box-shadow: 0 5px 15px rgba(0,0,0,0.05);">
            당신은 <span style="color: #E76F00; font-size: 1.5rem;">${bestScore}%</span>의 확률로<br>
            <span style="font-size: 2rem; color: #4A3B32;">${bestClass}</span> 입니다!
        </div>
    `;
    document.getElementById("label-container").innerHTML = resultMsg;
    
    console.log(prediction); // 디버깅용
    document.getElementById('loading-msg').style.display = 'none';
}

// 실행
init();