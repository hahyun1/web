/*
 * 심리테스트 핵심 알고리즘 테스트의 totalScore 누적 로직 검증
 */

// 1. 실제 서비스에서 사용하는 점수 합산 로직 정의
const calculateTotalScore = (selectedScores) => {
    return selectedScores.reduce((total, score) => total + score, 0);
};

// 2. 결과 매칭 로직 정의 (DB의 min_score, max_score 구간 검증)
const getResultId = (totalScore, resultRanges) => {
    const matched = resultRanges.find(r => totalScore >= r.min_score && totalScore <= r.max_score);
    return matched ? matched.id : null;
};

test('사용자 응답에 따른 totalScore 합산 및 결과 매칭 검증', () => {
    // [준비] 사용자가 선택한 답변들의 점수 (예: 질문 4개에 대한 응답)
    const mockUserAnswers = [10, 20, 10, 15]; 
    const expectedTotal = 55;

    // [준비] DB의 results 테이블 구간 설정 모사
    const mockResultRanges = [
        { id: 1, min_score: 0, max_score: 30 },
        { id: 2, min_score: 31, max_score: 60 },
        { id: 3, min_score: 61, max_score: 100 }
    ];

    // [실행] 로직 수행
    const actualTotal = calculateTotalScore(mockUserAnswers);
    const resultId = getResultId(actualTotal, mockResultRanges);

    // [검증]
    expect(actualTotal).toBe(expectedTotal); // 점수 합계가 55인지 확인
    expect(resultId).toBe(2); // 55점은 id 2번 결과에 속하는지 확인
});