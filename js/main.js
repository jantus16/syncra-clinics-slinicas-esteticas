const PAIN_POINTS_KEY = "syncra_pain_points";

document.addEventListener("DOMContentLoaded", () => {
  const navToggle = document.querySelector(".nav-toggle");
  const mainNav = document.querySelector(".main-nav");

  if (navToggle && mainNav) {
    navToggle.addEventListener("click", () => {
      mainNav.classList.toggle("open");
    });

    mainNav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => mainNav.classList.remove("open"));
    });
  }

  const currentPage = document.body.dataset.page;
  if (currentPage) {
    document.querySelectorAll(".main-nav a").forEach((link) => {
      if (link.dataset.page === currentPage) {
        link.classList.add("active");
      }
    });
  }

  setupPainPoints();
  setupInfoModal();
  setupPhoneMenu();
});

function getStoredPainPoints() {
  try {
    return JSON.parse(localStorage.getItem(PAIN_POINTS_KEY) || "[]");
  } catch (error) {
    return [];
  }
}

function setupPainPoints() {
  const cards = document.querySelectorAll(".pain-card");
  if (!cards.length) return;

  const selected = new Set(getStoredPainPoints());

  const applyState = () => {
    cards.forEach((card) => {
      const isSelected = selected.has(card.dataset.pain);
      card.classList.toggle("selected", isSelected);
      card.setAttribute("aria-pressed", String(isSelected));
    });
  };
  applyState();

  cards.forEach((card) => {
    card.addEventListener("click", () => {
      const pain = card.dataset.pain;
      if (selected.has(pain)) {
        selected.delete(pain);
      } else {
        selected.add(pain);
      }
      localStorage.setItem(PAIN_POINTS_KEY, JSON.stringify(Array.from(selected)));
      applyState();
    });
  });
}

function applyStoredPainPointsToForms(modal) {
  const stored = getStoredPainPoints();
  if (!stored.length) return;

  modal.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
    if (stored.includes(checkbox.value)) {
      checkbox.checked = true;
    }
  });
}

function setupInfoModal() {
  const modal = document.querySelector("#info-modal");
  if (!modal) return;

  const steps = modal.querySelectorAll(".modal-step");
  let lastFocused = null;

  applyStoredPainPointsToForms(modal);

  const showStep = (name) => {
    steps.forEach((step) => {
      step.hidden = step.dataset.step !== name;
    });
  };

  const openModal = (step) => {
    lastFocused = document.activeElement;
    showStep(step === "servicios" || step === "demo" ? step : "choice");
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
  };

  const closeModal = () => {
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
    if (lastFocused instanceof HTMLElement) lastFocused.focus();
    window.setTimeout(() => showStep("choice"), 250);
  };

  document.querySelectorAll("[data-open-modal]").forEach((trigger) => {
    trigger.addEventListener("click", () => openModal(trigger.dataset.openModal));
  });

  modal.querySelectorAll("[data-close-modal]").forEach((btn) => {
    btn.addEventListener("click", closeModal);
  });

  modal.querySelectorAll("[data-target]").forEach((btn) => {
    btn.addEventListener("click", () => showStep(btn.dataset.target));
  });

  modal.querySelectorAll("[data-back]").forEach((btn) => {
    btn.addEventListener("click", () => showStep("choice"));
  });

  modal.addEventListener("click", (event) => {
    if (event.target === modal) closeModal();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && modal.classList.contains("open")) closeModal();
  });

  const openFromHash = () => {
    const hash = window.location.hash.replace("#", "");
    if (hash === "demo" || hash === "servicios" || hash === "choice") {
      openModal(hash);
    }
  };

  window.addEventListener("hashchange", openFromHash);
  openFromHash();

  modal.querySelectorAll("form").forEach((form) => setupInfoForm(form));
}

function setupInfoForm(form) {
  form.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const lines = [];
    form.querySelectorAll("[data-field-label]").forEach((field) => {
      if (field.value.trim()) {
        lines.push(`${field.dataset.fieldLabel}: ${field.value.trim()}`);
      }
    });

    const checkboxGroups = new Map();
    form.querySelectorAll('input[type="checkbox"]:checked').forEach((checkbox) => {
      const group = checkboxGroups.get(checkbox.name) || [];
      group.push(checkbox.value);
      checkboxGroups.set(checkbox.name, group);
    });
    checkboxGroups.forEach((values) => {
      lines.push(`Automatización de interés: ${values.join(", ")}`);
    });

    const storedPainPoints = getStoredPainPoints();
    if (storedPainPoints.length) {
      lines.push(`Dolores seleccionados en la home: ${storedPainPoints.join(", ")}`);
    }

    const clinicField = form.querySelector("[data-clinic-name]");
    const clinicName = clinicField ? clinicField.value.trim() : "";
    const subjectPrefix = form.id === "form-demo" ? "Solicitud de demo" : "Solicitud de servicios";

    const subject = encodeURIComponent(`${subjectPrefix} — ${clinicName}`);
    const body = encodeURIComponent(lines.join("\n"));

    window.location.href = `mailto:syncraclinics@gmail.com?subject=${subject}&body=${body}`;

    const status = form.querySelector(".form-status");
    if (status) {
      status.textContent = "Abriendo tu cliente de correo para enviar la solicitud a syncraclinics@gmail.com...";
      status.classList.add("visible");
    }
  });
}

function setupPhoneMenu() {
  const trigger = document.querySelector("#phone-menu-trigger");
  const menu = document.querySelector("#phone-menu");
  if (!trigger || !menu) return;

  const closeMenu = () => {
    menu.classList.remove("open");
    trigger.setAttribute("aria-expanded", "false");
  };

  const openMenu = () => {
    menu.classList.add("open");
    trigger.setAttribute("aria-expanded", "true");
  };

  trigger.addEventListener("click", (event) => {
    event.stopPropagation();
    if (menu.classList.contains("open")) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  document.addEventListener("click", (event) => {
    if (!menu.contains(event.target) && event.target !== trigger) {
      closeMenu();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menu.classList.contains("open")) {
      closeMenu();
      trigger.focus();
    }
  });
}
