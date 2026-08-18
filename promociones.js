const revealItems = document.querySelectorAll(
  ".promo-hero [class*='animate__'], .prize-card, .participation-image, .steps-copy",
);

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.16 },
);

revealItems.forEach((item) => revealObserver.observe(item));

const collage = document.querySelector(".hero-collage");
if (collage && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  collage.addEventListener("pointermove", (event) => {
    const bounds = collage.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    collage.style.transform = `rotate(2deg) translate(${x * 8}px, ${y * 8}px)`;
  });
  collage.addEventListener("pointerleave", () => {
    collage.style.transform = "rotate(2deg)";
  });
}
