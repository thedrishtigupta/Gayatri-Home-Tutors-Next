// // Load Header
// fetch("partials/header.html")
//     .then(res => res.text())
//     .then(data => {
//         document.getElementById("header").innerHTML = data;
//     });

// // Load Footer
// fetch("partials/footer.html")
//     .then(res => res.text())
//     .then(data => {
//         document.getElementById("footer").innerHTML = data;
//     });



// fetch('partials/book-demo-form.html')
//     .then(res => res.text())
//     .then(data => {
//         document.getElementById('book-demo-form-container').innerHTML = data;
//     });

// fetch('partials/about-sections.html')
//     .then(res => res.text())
//     .then(data => {
//         document.getElementById('about-sections').innerHTML = data;
//     });


// fetch('partials/services-sections.html')
//     .then(res => res.text())
//     .then(data => {
//         document.getElementById('services-sections').innerHTML = data;
//     });


// fetch('partials/contact-sections.html')
//     .then(res => res.text())
//     .then(data => {
//         document.getElementById('contact-sections').innerHTML = data;
//     });


// function loadTutorsSection() {
//     fetch('partials/our-tutors-section.html')
//         .then(res => res.text())
//         .then(data => {
//             document.getElementById('our-tutors-section').innerHTML = data;
//         });
// }

// loadTutorsSection();

// const accordions = document.querySelectorAll(".accordion-header");

// accordions.forEach(btn => {
//   btn.addEventListener("click", function(){

//     this.classList.toggle("active");

//     const content = this.nextElementSibling;

//     if(content.style.maxHeight){
//       content.style.maxHeight = null;
//     }else{
//       content.style.maxHeight = content.scrollHeight + "px";
//     }

//   });
// });


document.addEventListener("DOMContentLoaded", loadPartials);

function loadPartials() {

  const partials = document.querySelectorAll("[data-partial]:not([data-loaded])");

  partials.forEach(el => {

    const filePath = el.dataset.partial;

    fetch(`/partials/${filePath}.html`)
      .then(res => {
        if (!res.ok) throw new Error(`Failed to load ${filePath}`);
        return res.text();
      })
      .then(html => {

        el.innerHTML = html;
        el.dataset.loaded = "true";

        // check again for nested partials
        loadPartials();

      })
      .catch(err => console.error(err));

  });

}