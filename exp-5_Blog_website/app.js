const nav = document.getElementById("siteNav");
const posts = document.querySelectorAll(".post-item");
const filterButtons = document.querySelectorAll("[data-filter]");
const searchForm = document.getElementById("searchForm");
const searchInput = document.getElementById("searchInput");
const noResults = document.getElementById("noResults");
const newsletterForm = document.getElementById("newsletterForm");
const newsletterEmail = document.getElementById("newsletterEmail");
const newsletterMsg = document.getElementById("newsletterMsg");

let activeFilter = "all";

function applyFilters() {
    const query = searchInput.value.trim().toLowerCase();
    let visible = 0;

    posts.forEach((post) => {
        const matchesCategory = activeFilter === "all" || post.dataset.category === activeFilter;
        const matchesSearch = post.textContent.toLowerCase().includes(query);
        const show = matchesCategory && matchesSearch;

        post.classList.toggle("d-none", !show);
        if (show) visible++;
    });

    noResults.classList.toggle("d-none", visible > 0);
}

filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
        filterButtons.forEach((b) => b.classList.remove("active"));
        button.classList.add("active");
        activeFilter = button.dataset.filter;
        applyFilters();
    });
});

searchInput.addEventListener("input", applyFilters);

searchForm.addEventListener("submit", (event) => {
    event.preventDefault();
    applyFilters();
    document.getElementById("posts").scrollIntoView({ behavior: "smooth" });
});

newsletterForm.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!newsletterEmail.checkValidity()) {
        newsletterEmail.classList.add("is-invalid");
        newsletterMsg.classList.add("d-none");
        return;
    }

    newsletterEmail.classList.remove("is-invalid");
    newsletterMsg.classList.remove("d-none");
    newsletterForm.reset();
});

newsletterEmail.addEventListener("input", () => {
    if (newsletterEmail.checkValidity()) {
        newsletterEmail.classList.remove("is-invalid");
    }
});

window.addEventListener("scroll", () => {
    nav.classList.toggle("scrolled", window.scrollY > 10);
});

document.getElementById("year").textContent = new Date().getFullYear();