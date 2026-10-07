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

  setupHeaderScroll();
  setupScrollReveal();
  setupDashboardCounters();
  setupPainPoints();
  setupInfoModal();
  setupPhoneMenu();
  setupNoShowCalculator();
  setupChatDemo();
});

function setupChatDemo() {
  const chatWindow = document.querySelector(".chat-window");
  if (!chatWindow) return;

  const messagesContainer = chatWindow.querySelector(".chat-messages");
  const bubbles = messagesContainer
    ? Array.from(messagesContainer.querySelectorAll(".chat-bubble"))
    : [];
  if (!messagesContainer || !bubbles.length) return;

  bubbles.forEach((bubble) => {
    bubble.style.display = "none";
    bubble.classList.remove("is-shown");
  });

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReducedMotion) {
    bubbles.forEach((bubble) => {
      bubble.style.display = "";
    });
    return;
  }

  let paused = false;
  const supportsHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (supportsHover) {
    chatWindow.addEventListener("mouseenter", () => {
      paused = true;
    });
    chatWindow.addEventListener("mouseleave", () => {
      paused = false;
    });
  }

  const wait = (ms) =>
    new Promise((resolve) => {
      let remaining = ms;
      const tick = () => {
        if (paused) {
          setTimeout(tick, 150);
          return;
        }
        remaining -= 150;
        if (remaining <= 0) {
          resolve();
        } else {
          setTimeout(tick, 150);
        }
      };
      setTimeout(tick, 150);
    });

  const scrollToBottom = () => {
    messagesContainer.scrollTo({ top: messagesContainer.scrollHeight, behavior: "smooth" });
  };

  const showBubble = (bubble) => {
    bubble.style.display = "";
    void bubble.offsetWidth;
    bubble.classList.add("is-shown");
    scrollToBottom();
  };

  const showTyping = async () => {
    const typingEl = document.createElement("div");
    typingEl.className = "chat-typing";
    typingEl.innerHTML = "<span></span><span></span><span></span>";
    messagesContainer.appendChild(typingEl);
    scrollToBottom();
    await wait(1000);
    typingEl.remove();
  };

  const resetConversation = () => {
    bubbles.forEach((bubble) => {
      bubble.classList.remove("is-shown");
      bubble.style.display = "none";
    });
    messagesContainer.scrollTop = 0;
  };

  const runConversation = async () => {
    for (let i = 0; i < bubbles.length; i++) {
      const bubble = bubbles[i];
      const isAssistant = bubble.classList.contains("assistant");

      if (isAssistant) {
        await showTyping();
      }

      showBubble(bubble);

      const isLast = i === bubbles.length - 1;
      await wait(isLast ? 4500 : isAssistant ? 1300 : 1200);
    }

    resetConversation();
    runConversation();
  };

  if ("IntersectionObserver" in window) {
    let started = false;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !started) {
            started = true;
            runConversation();
            observer.disconnect();
          }
        });
      },
      { threshold: 0.3 }
    );
    observer.observe(chatWindow);
  } else {
    runConversation();
  }
}

function setupHeaderScroll() {
  const header = document.querySelector(".site-header");
  if (!header) return;

  const onScroll = () => {
    header.classList.toggle("is-scrolled", window.scrollY > 8);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
}

function setupScrollReveal() {
  const targets = document.querySelectorAll(".reveal, .dashboard-panel");
  if (!targets.length) return;

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    targets.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
  );

  targets.forEach((el) => observer.observe(el));
}

function setupDashboardCounters() {
  const counters = document.querySelectorAll("[data-count-to]");
  if (!counters.length) return;

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const runCounter = (el) => {
    const target = parseInt(el.dataset.countTo, 10) || 0;
    const prefix = el.dataset.countPrefix || "";

    if (prefersReducedMotion) {
      el.textContent = `${prefix}${target}`;
      return;
    }

    const duration = 900;
    const start = performance.now();

    const step = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = `${prefix}${Math.round(target * eased)}`;
      if (progress < 1) requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
  };

  if (!("IntersectionObserver" in window)) {
    counters.forEach(runCounter);
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          runCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.4 }
  );

  counters.forEach((el) => observer.observe(el));
}

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

function setupInfoModal() {
  const modal = document.querySelector("#info-modal");
  if (!modal) return;

  let lastFocused = null;

  const openModal = () => {
    lastFocused = document.activeElement;
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
  };

  const closeModal = () => {
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
    if (lastFocused instanceof HTMLElement) lastFocused.focus();
  };

  document.querySelectorAll("[data-open-modal]").forEach((trigger) => {
    trigger.addEventListener("click", openModal);
  });

  modal.querySelectorAll("[data-close-modal]").forEach((btn) => {
    btn.addEventListener("click", closeModal);
  });

  modal.addEventListener("click", (event) => {
    if (event.target === modal) closeModal();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && modal.classList.contains("open")) closeModal();
  });

  const openFromHash = () => {
    const hash = window.location.hash.replace("#", "");
    if (hash === "demo") openModal();
  };

  window.addEventListener("hashchange", openFromHash);
  openFromHash();

  const form = modal.querySelector("form");
  if (form) setupInfoForm(form);
}

const FORM_FIELD_KEY_MAP = {
  name: "nombre",
  clinic: "clinica",
  email: "email",
  phone: "telefono",
  service: "servicio",
  message: "mensaje",
};

function buildInfoFormPayload(form) {
  const payload = {
    pagina_origen: window.location.href,
    fecha_envio: new Date().toISOString(),
  };

  form.querySelectorAll("[data-field-label]").forEach((field) => {
    const rawKey = field.id.replace(/^demo-/, "");
    const key = FORM_FIELD_KEY_MAP[rawKey] || rawKey;
    payload[key] = field.value.trim();
  });

  payload.tipo_solicitud = payload.servicio || "Información";

  const storedPainPoints = getStoredPainPoints();
  if (storedPainPoints.length) {
    payload.dolores_seleccionados = storedPainPoints;
  }

  payload.asunto_sugerido = `[NUEVA SOLICITUD] ${payload.tipo_solicitud} - Syncra Clinics`;

  const bodyLines = [
    "Nueva solicitud recibida desde Syncra Clinics",
    "",
    "Tipo de solicitud:",
    payload.tipo_solicitud,
    "",
    "Nombre:",
    payload.nombre || "-",
    "",
    "Clínica:",
    payload.clinica || "-",
    "",
    "Email:",
    payload.email || "-",
    "",
    "Teléfono:",
    payload.telefono || "-",
  ];
  if (payload.servicio) {
    bodyLines.push("", "Servicio de interés:", payload.servicio);
  }
  bodyLines.push("", "Mensaje:", payload.mensaje || "-");
  payload.cuerpo_sugerido = bodyLines.join("\n");

  return payload;
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
    const payload = buildInfoFormPayload(form);

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Enviando...";
    }
    if (status) {
      status.textContent = "";
      status.classList.remove("visible", "error");
    }

    const DEFAULT_ERROR_MESSAGE = "No hemos podido enviar tu solicitud. Por favor, inténtalo de nuevo.";

    fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then(async (response) => {
        const contentType = response.headers.get("content-type") || "";
        const data = contentType.includes("application/json")
          ? await response.json().catch(() => null)
          : null;

        if (!response.ok || !data || !data.ok) {
          const message = data && data.error ? data.error : DEFAULT_ERROR_MESSAGE;
          throw new Error(message);
        }
      })
      .then(() => {
        form.reset();
        if (status) {
          status.textContent = "Solicitud recibida correctamente. Nos pondremos en contacto contigo lo antes posible.";
          status.classList.add("visible");
          status.classList.remove("error");
        }
      })
      .catch((error) => {
        console.error("Error al enviar el formulario:", error);
        if (status) {
          status.textContent = error && error.message ? error.message : DEFAULT_ERROR_MESSAGE;
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

function setupNoShowCalculator() {
  const citasInput = document.querySelector("#calc-citas");
  const valorInput = document.querySelector("#calc-valor");
  const result = document.querySelector("#calc-result");
  if (!citasInput || !valorInput || !result) return;

  const formatter = new Intl.NumberFormat("es-ES", {
    maximumFractionDigits: 0,
  });

  const update = () => {
    const citas = Math.max(0, parseInt(citasInput.value, 10) || 0);
    const valor = Math.max(0, parseInt(valorInput.value, 10) || 0);
    result.textContent = `${formatter.format(citas * valor)} €`;
  };

  citasInput.addEventListener("input", update);
  valorInput.addEventListener("input", update);
  update();
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
