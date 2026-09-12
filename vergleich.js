(() => {
  const dashboard = document.getElementById("view-dashboard");
  const kpis = document.getElementById("kpis");
  const chart = document.getElementById("depotChart");
  const weekly = document.getElementById("weeklyKpis");

  if (!dashboard || !kpis || !chart || !weekly) return;

  kpis.classList.add("portfolio-overview");
  kpis.setAttribute("aria-label", "Portfolio auf einen Blick");

  const heroSection = chart.closest("section.grid");
  const heroCard = chart.closest("article.card");
  const weeklySection = weekly.closest("section.grid");
  const weeklyCards = weeklySection ? [...weeklySection.querySelectorAll(":scope > article.card")] : [];

  if (heroSection && heroCard && weeklyCards.length) {
    const focusLayout = document.createElement("section");
    const focusMain = document.createElement("div");
    const focusRail = document.createElement("aside");

    focusLayout.className = "focus-layout";
    focusMain.className = "focus-main";
    focusRail.className = "focus-rail";
    focusRail.setAttribute("aria-label", "Kurzfristiger Überblick");

    heroSection.replaceWith(focusLayout);
    focusMain.appendChild(heroCard);
    weeklyCards.forEach((card, index) => {
      card.classList.add(index === 0 ? "weekly-card" : "ranking-card");
      focusRail.appendChild(card);
    });
    focusLayout.append(focusMain, focusRail);
    weeklySection?.remove();
  }

  document.querySelector(".position-analysis-card")?.classList.add("positions-focus");
  document.querySelector(".analysis-drawer")?.classList.add("secondary-analysis");
  document.querySelector(".app-layout")?.classList.remove("insight-open");

  const learnMode = document.getElementById("learnMode");
  if (learnMode) learnMode.checked = false;
  document.body.classList.remove("learning-on");

  const subtitle = document.querySelector("header p");
  if (subtitle) subtitle.textContent = "Überblick, Entwicklung und Positionen";

  const navButtons = [...document.querySelectorAll(".section-tab")];
  const updateCurrent = () => navButtons.forEach(button => {
    if (button.classList.contains("active")) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  });
  navButtons.forEach(button => button.addEventListener("click", updateCurrent));
  updateCurrent();

  document.body.classList.add("comparison-ready");
})();
