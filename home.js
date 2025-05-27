document.addEventListener('DOMContentLoaded', function() {
  const track = document.querySelector('.highlight-track');
  const slides = document.querySelectorAll('.highlight-slide');
  const slideCount = slides.length;
  let idx = 0;
  let interval;

  // 스크롤 thumb
  const thumb = document.querySelector('.scrollbar-thumb');
  // thumb width 설정
  thumb.style.width = (100 / slideCount) + '%';

  // 클론 슬라이드 추가
  const firstClone = slides[0].cloneNode(true);
  track.appendChild(firstClone);

  function goToSlide(n) {
    track.style.transition = 'transform 0.5s ease-in-out';
    track.style.transform = `translateX(-${n * 100}%)`;
    // 스크롤 thumb 이동
    thumb.style.left = (n % slideCount) * (100 / slideCount) + '%';
  }

  function nextSlide() {
    idx++;
    goToSlide(idx);

    if (idx === slideCount) {
      setTimeout(() => {
        track.style.transition = 'none';
        idx = 0;
        track.style.transform = `translateX(0)`;
        thumb.style.left = '0%';
      }, 500);
    }
  }

  function startAutoSlide() {
    interval = setInterval(nextSlide, 2000);
  }
  function resetAutoSlide() {
    clearInterval(interval);
    startAutoSlide();
  }

  // (선택) 스크롤바 클릭 시 해당 슬라이드로 이동
  const scrollbarTrack = document.querySelector('.scrollbar-track');
  scrollbarTrack.addEventListener('click', function(e) {
    const rect = this.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = x / rect.width;
    const slideIdx = Math.floor(percent * slideCount);
    idx = slideIdx;
    goToSlide(idx);
    resetAutoSlide();
  });

  goToSlide(0);
  startAutoSlide();
});
