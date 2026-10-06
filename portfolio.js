/* ============================================================
   TEEDEV PORTFOLIO
   Public Project + Experience Loader
   ============================================================ */

(() => {
    "use strict";

    const supabaseClient =
        window.teeDevSupabase;

    let projects = [];
    let experiences = [];
    let currentProject = 0;

    const $ =
        (selector) =>
            document.querySelector(selector);

    const $$ =
        (selector) =>
            [...document.querySelectorAll(selector)];

    /* =========================================================
       MOBILE NAVIGATION
    ============================================================ */

    const menuToggle =
        $(".menu-toggle");

    const navMenu =
        $(".nav-menu");

    if (menuToggle && navMenu) {

        menuToggle.addEventListener(
            "click",
            () => {

                const isOpen =
                    navMenu.classList.toggle(
                        "active"
                    );

                menuToggle.setAttribute(
                    "aria-expanded",
                    String(isOpen)
                );
            }
        );

        $$(".nav-menu a")
            .forEach((link) => {

                link.addEventListener(
                    "click",
                    () => {

                        navMenu.classList.remove(
                            "active"
                        );

                        menuToggle.setAttribute(
                            "aria-expanded",
                            "false"
                        );
                    }
                );
            });
    }

    /* =========================================================
       HTML ESCAPING
    ============================================================ */

    function escapeHtml(value = "") {

        return String(value).replace(
            /[&<>'"]/g,
            (character) => ({

                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                "'": "&#39;",
                '"': "&quot;"

            })[character]
        );
    }

    function normalizeTags(value) {

        if (Array.isArray(value)) {
            return value.filter(Boolean);
        }

        return String(value || "")
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean);
    }

    /* =========================================================
       PROJECT CARD
    ============================================================ */

    function createProjectCard(
        project,
        index
    ) {

        const title =
            escapeHtml(
                project.title ||
                "Untitled Project"
            );

        const description =
            escapeHtml(
                project.description ||
                ""
            );

        const role =
            escapeHtml(
                project.role ||
                "Developer"
            );

        const category =
            escapeHtml(
                project.category ||
                "Digital Project"
            );

        const status =
            escapeHtml(
                project.status ||
                "Completed"
            );

        const year =
            escapeHtml(
                project.year ||
                ""
            );

        const liveUrl =
            escapeHtml(
                project.live_url ||
                ""
            );

        const tags =
            normalizeTags(project.tags)
                .map(
                    (tag) =>
                        `<span>${escapeHtml(tag)}</span>`
                )
                .join("");

        const imageStyle =
            project.image_url
                ? `style="background-image:url('${escapeHtml(
                    project.image_url
                )}')"`
                : "";

        const iframe =
            project.live_url
                ? `
                    <iframe
                        src="${liveUrl}"
                        title="${title}"
                        loading="lazy"
                        referrerpolicy="strict-origin-when-cross-origin">
                    </iframe>
                  `
                : "";

        return `

            <article class="project-slide">

                <div class="project-slide-visual">

                    <div class="project-browser">

                        <div class="browser-bar">

                            <div class="browser-dots">
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>

                            <span class="browser-label">
                                ${status.toUpperCase()}
                            </span>

                        </div>

                        <div
                            class="project-preview website-live-preview ${
                                project.image_url
                                    ? "has-image"
                                    : ""
                            }"
                            ${imageStyle}
                        >

                            ${iframe}

                            <div class="preview-shade">

                                <div>

                                    <span class="preview-live">
                                        <i></i>
                                        ${status.toUpperCase()}
                                    </span>

                                    <strong>
                                        ${title}
                                    </strong>

                                    <p>
                                        ${description}
                                    </p>

                                </div>

                            </div>

                        </div>

                    </div>

                </div>

                <div class="project-slide-content">

                    <div class="project-slide-heading">

                        <div>

                            <p class="project-type">
                                ${category.toUpperCase()}
                            </p>

                            <h3>
                                ${title}
                            </h3>

                        </div>

                        <span class="project-index">
                            ${String(index + 1).padStart(2, "0")}
                        </span>

                    </div>

                    <p class="project-description">
                        ${description}
                    </p>

                    <div class="project-details">

                        <div>
                            <span>ROLE</span>
                            <strong>${role}</strong>
                        </div>

                        <div>
                            <span>YEAR</span>
                            <strong>${year}</strong>
                        </div>

                        <div>
                            <span>STATUS</span>
                            <strong>${status}</strong>
                        </div>

                    </div>

                    <div class="project-tags">
                        ${tags}
                    </div>

                    ${
                        project.live_url
                            ? `
                                <div class="project-action-row">

                                    <a
                                        class="project-button"
                                        href="${liveUrl}"
                                        target="_blank"
                                        rel="noopener noreferrer">

                                        View Live Project

                                        <span>↗</span>

                                    </a>

                                </div>
                              `
                            : ""
                    }

                </div>

            </article>
        `;
    }

    /* =========================================================
       PROJECT SLIDER
    ============================================================ */

    function renderProjects() {

        const track =
            $("#projectTrack");

        const dots =
            $("#projectDots");

        if (!track) return;

        if (!projects.length) {

            track.innerHTML = `
                <div class="empty-projects">
                    No published projects yet.
                </div>
            `;

            if (dots) {
                dots.innerHTML = "";
            }

            if ($("#projectTotal")) {
                $("#projectTotal")
                    .textContent = "00";
            }

            return;
        }

        currentProject =
            Math.min(
                currentProject,
                projects.length - 1
            );

        track.innerHTML =
            projects
                .map(createProjectCard)
                .join("");

        if (dots) {

            dots.innerHTML =
                projects
                    .map(
                        (_, index) => `
                            <button
                                class="project-dot ${
                                    index === currentProject
                                        ? "active"
                                        : ""
                                }"
                                type="button"
                                data-project="${index}"
                                aria-label="Go to project ${
                                    index + 1
                                }">
                            </button>
                        `
                    )
                    .join("");

            $$(".project-dot")
                .forEach((dot) => {

                    dot.addEventListener(
                        "click",
                        () => {

                            currentProject =
                                Number(
                                    dot.dataset.project
                                );

                            updateSlider();
                        }
                    );
                });
        }

        updateSlider();
    }

    function updateSlider() {

        const track =
            $("#projectTrack");

        if (!track || !projects.length) {
            return;
        }

        track.style.transform =
            `translateX(-${
                currentProject * 100
            }%)`;

        if ($("#projectCurrent")) {

            $("#projectCurrent")
                .textContent =
                String(
                    currentProject + 1
                ).padStart(2, "0");
        }

        if ($("#projectTotal")) {

            $("#projectTotal")
                .textContent =
                String(
                    projects.length
                ).padStart(2, "0");
        }

        $$(".project-dot")
            .forEach(
                (dot, index) => {

                    dot.classList.toggle(
                        "active",
                        index === currentProject
                    );
                }
            );
    }

    function nextProject() {

        if (!projects.length) return;

        currentProject =
            (currentProject + 1) %
            projects.length;

        updateSlider();
    }

    function previousProject() {

        if (!projects.length) return;

        currentProject =
            (
                currentProject -
                1 +
                projects.length
            ) %
            projects.length;

        updateSlider();
    }

    $("#projectNext")
        ?.addEventListener(
            "click",
            nextProject
        );

    $("#projectPrev")
        ?.addEventListener(
            "click",
            previousProject
        );

    /* =========================================================
       KEYBOARD NAVIGATION
    ============================================================ */

    document.addEventListener(
        "keydown",
        (event) => {

            if (
                event.key ===
                "ArrowRight"
            ) {
                nextProject();
            }

            if (
                event.key ===
                "ArrowLeft"
            ) {
                previousProject();
            }
        }
    );

    /* =========================================================
       TOUCH / SWIPE
    ============================================================ */

    let touchStartX = 0;

    $("#projectTrack")
        ?.addEventListener(
            "touchstart",
            (event) => {

                touchStartX =
                    event.changedTouches[0]
                        .screenX;
            },
            {
                passive: true
            }
        );

    $("#projectTrack")
        ?.addEventListener(
            "touchend",
            (event) => {

                const touchEndX =
                    event.changedTouches[0]
                        .screenX;

                const difference =
                    touchEndX -
                    touchStartX;

                if (difference < -50) {
                    nextProject();
                }

                if (difference > 50) {
                    previousProject();
                }
            },
            {
                passive: true
            }
        );

    /* =========================================================
       EXPERIENCE
    ============================================================ */

    function renderExperience() {

        const list =
            $("#experienceList");

        if (!list) return;

        if (!experiences.length) {

            list.innerHTML = `
                <div class="empty-projects">
                    No experience entries published yet.
                </div>
            `;

            return;
        }

        list.innerHTML =
            experiences
                .map(
                    (experience, index) => `

                        <article class="experience-item">

                            <div class="experience-number">
                                ${String(
                                    index + 1
                                ).padStart(2, "0")}
                            </div>

                            <div class="experience-main">

                                <div class="experience-top">

                                    <div>

                                        <span class="experience-type">
                                            ${escapeHtml(
                                                experience.type ||
                                                "EXPERIENCE"
                                            )}
                                        </span>

                                        <h3>
                                            ${escapeHtml(
                                                experience.title ||
                                                ""
                                            )}
                                        </h3>

                                    </div>

                                    <span class="experience-date">
                                        ${escapeHtml(
                                            experience.year ||
                                            ""
                                        )}
                                    </span>

                                </div>

                                <p>
                                    ${escapeHtml(
                                        experience.description ||
                                        ""
                                    )}
                                </p>

                                <span class="experience-status">
                                    ${escapeHtml(
                                        experience.status ||
                                        "Ongoing"
                                    )}
                                </span>

                            </div>

                        </article>
                    `
                )
                .join("");
    }

    /* =========================================================
       LOAD PUBLIC DATA
    ============================================================ */

    async function loadPublicData() {

        if (!supabaseClient) {

            console.warn(
                "TeeDev Supabase client is unavailable."
            );

            renderProjects();
            renderExperience();

            return;
        }

        try {

            const [
                projectResult,
                experienceResult
            ] = await Promise.all([

                supabaseClient
                    .from("portfolio_projects")
                    .select("*")
                    .eq("published", true)
                    .order(
                        "display_order",
                        {
                            ascending: true
                        }
                    )
                    .order(
                        "created_at",
                        {
                            ascending: false
                        }
                    ),

                supabaseClient
                    .from("portfolio_experience")
                    .select("*")
                    .eq("published", true)
                    .order(
                        "display_order",
                        {
                            ascending: true
                        }
                    )
                    .order(
                        "created_at",
                        {
                            ascending: false
                        }
                    )
            ]);

            if (projectResult.error) {
                console.error(
                    "Projects error:",
                    projectResult.error
                );
            } else {
                projects =
                    projectResult.data || [];
            }

            if (experienceResult.error) {
                console.error(
                    "Experience error:",
                    experienceResult.error
                );
            } else {
                experiences =
                    experienceResult.data || [];
            }

            renderProjects();
            renderExperience();

        } catch (error) {

            console.error(
                "Portfolio loading error:",
                error
            );

            renderProjects();
            renderExperience();
        }
    }

    /* =========================================================
       CONTACT FORM
    ============================================================ */

    const contactForm =
        $("#contactForm");

    const formStatus =
        $("#formStatus");

    contactForm?.addEventListener(
        "submit",
        (event) => {

            event.preventDefault();

            const name =
                $("#name")
                    ?.value
                    .trim();

            const email =
                $("#email")
                    ?.value
                    .trim();

            const message =
                $("#message")
                    ?.value
                    .trim();

            if (
                !name ||
                !email ||
                !message
            ) {

                if (formStatus) {

                    formStatus.textContent =
                        "Please fill in all the fields.";
                }

                return;
            }

            if (formStatus) {

                formStatus.textContent =
                    "Thanks for reaching out. I'll get back to you soon.";
            }

            contactForm.reset();
        }
    );

    /* =========================================================
       START
    ============================================================ */

    loadPublicData();

})();