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

    const submitButton = form.querySelector('button[type="submit"]');
    const status = form.querySelector(".form-status");
    const originalButtonText = submitButton ? submitButton.textContent : "";

    const payload = {
      tipo_formulario: form.id === "form-demo" ? "demo" : "servicios",
      pagina_origen: window.location.href,
      fecha_envio: new Date().toISOString(),
    };

    form.querySelectorAll("[data-field-label]").forEach((field) => {
      const key = field.id.replace(/^(svc|demo)-/, "");
      payload[key] = field.value.trim();
    });

    const checkboxGroups = new Map();
    form.querySelectorAll('input[type="checkbox"]:checked').forEach((checkbox) => {
      const group = checkboxGroups.get(checkbox.name) || [];
      group.push(checkbox.value);
      checkboxGroups.set(checkbox.name, group);
    });
    checkboxGroups.forEach((values) => {
      payload.intereses = values;
    });

    const storedPainPoints = getStoredPainPoints();
    if (storedPainPoints.length) {
      payload.dolores_seleccionados = storedPainPoints;
    }

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Enviando...";
    }
    if (status) {
      status.textContent = "";
      status.classList.remove("visible", "error");
    }

    fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((response) => {
        if (!response.ok) throw new Error("Respuesta no válida del servidor");
        return response.json();
      })
      .then((data) => {
        if (!data || !data.ok) throw new Error("El envío no se completó");

        form.reset();
        if (status) {
          status.textContent = "¡Solicitud enviada correctamente! Gracias por contactar con Syncra Clinics. Nos pondremos en contacto contigo lo antes posible.";
          status.classList.add("visible");
          status.classList.remove("error");
        }
      })
      .catch((error) => {
        console.error("Error al enviar el formulario:", error);
        if (status) {
          status.textContent = "No hemos podido enviar tu solicitud. Por favor, inténtalo de nuevo.";
          status.classList.add("visible", "error");
        }
      })
      .finally(() => {
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = originalButtonText;
        }
      });
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
