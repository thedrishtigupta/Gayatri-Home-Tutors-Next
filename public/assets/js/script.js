const images = document.querySelectorAll(".hero-img");
const dots = document.querySelectorAll(".hero-scroll-circle");


let current = 0;


function updateSlider(index) {
    images.forEach(img => img.classList.remove("active"));
    dots.forEach(dot => dot.classList.remove("active"));


    images[index].classList.add("active");
    dots[index].classList.add("active");
}

dots.forEach((dot, index) => {
    dot.addEventListener("click", () => {
        current = index;
        updateSlider(current);
    });
});



setInterval(() => {
    current = (current + 1) % images.length;
    updateSlider(current);
}, 3000);


// const track = document.querySelector(".card-track");

// let scrollAmount = 0;

// function autoScroll() {
//   scrollAmount += 0.5;
//   track.scrollLeft = scrollAmount;

//   if (scrollAmount >= track.scrollWidth - track.clientWidth) {
//     scrollAmount = 0;
//   }

//   requestAnimationFrame(autoScroll);
// }

// autoScroll();