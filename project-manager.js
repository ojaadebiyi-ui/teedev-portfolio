/* ============================================================
   TEEDEV — PROJECT MANAGER
   Protected Supabase CMS / Dashboard

   FLOW:
   admin.html
        ↓
   successful authentication
        ↓
   project-manager.html

   Direct unauthenticated access:
   project-manager.html
        ↓
   admin.html
   ============================================================ */

(() => {
    "use strict";


    /* =========================================================
       CONFIG
    ========================================================= */

    const ADMIN_USER_ID =
        "9ee9212b-91d4-4c81-9986-31b20ca93919";

    const supabaseClient =
        window.teeDevSupabase;


    let projects = [];
    let experiences = [];


    /* =========================================================
       BASIC HELPERS
    ========================================================= */

    const $ = (selector) =>
        document.querySelector(selector);


    const $$ = (selector) =>
        Array.from(
            document.querySelectorAll(selector)
        );


    function escapeHtml(value = "") {

        return String(value).replace(
            /[&<>"']/g,
            (character) => ({
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#039;"
            })[character]
        );
    }


    function normalizeTags(value) {

        if (Array.isArray(value)) {

            return value
                .map((tag) =>
                    String(tag).trim()
                )
                .filter(Boolean);
        }


        return String(value || "")
            .split(",")
            .map((tag) =>
                tag.trim()
            )
            .filter(Boolean);
    }


    function setManagerStatus(
        message = "",
        type = ""
    ) {

        const status =
            $("#managerStatus");

        if (!status) {
            return;
        }


        status.textContent =
            message;


        status.classList.remove(
            "success",
            "error"
        );


        if (type) {

            status.classList.add(
                type
            );
        }
    }


    function setButtonLoading(
        button,
        loading,
        loadingText = "Please wait..."
    ) {

        if (!button) {
            return;
        }


        if (loading) {

            if (
                !button.dataset
                    .originalText
            ) {

                button.dataset
                    .originalText =
                    button.textContent;
            }


            button.disabled =
                true;


            button.textContent =
                loadingText;

        } else {

            button.disabled =
                false;


            if (
                button.dataset
                    .originalText
            ) {

                button.textContent =
                    button.dataset
                        .originalText;
            }
        }
    }


    /* =========================================================
       SUPABASE CHECK
    ========================================================= */

    function checkSupabase() {

        if (!window.supabase) {

            setManagerStatus(
                "Supabase library failed to load. Check your internet connection.",
                "error"
            );

            return false;
        }


        if (!supabaseClient) {

            setManagerStatus(
                "Supabase is not configured. Check supabase-config.js.",
                "error"
            );

            return false;
        }


        return true;
    }


    /* =========================================================
       AUTH REDIRECT
    ========================================================= */

    function redirectToLogin() {

        window.location.replace(
            "admin.html"
        );
    }


    /* =========================================================
       SHOW DASHBOARD
    ========================================================= */

    function showDashboard(session) {

        const dashboard =
            $("#projectManager");


        if (dashboard) {

            dashboard.hidden =
                false;

            dashboard.style.display =
                "";
        }


        const identity =
            $("#adminIdentity");


        if (identity) {

            identity.textContent =
                session?.user?.email ||
                "Administrator";
        }


        loadManagerData();
    }


    /* =========================================================
       VERIFY ADMIN USER
    ========================================================= */

    async function verifyAdminUser(user) {

        if (!user) {
            return false;
        }


        /*
         * First check the exact Supabase Auth UUID.
         */

        if (
            user.id !==
            ADMIN_USER_ID
        ) {

            console.warn(
                "Unauthorized admin UUID:",
                user.id
            );

            return false;
        }


        /*
         * Then confirm the UUID exists
         * in portfolio_admins.
         */

        const {
            data,
            error
        } =
            await supabaseClient
                .from(
                    "portfolio_admins"
                )
                .select(
                    "user_id"
                )
                .eq(
                    "user_id",
                    ADMIN_USER_ID
                )
                .maybeSingle();


        if (error) {

            console.error(
                "portfolio_admins verification error:",
                error
            );

            return false;
        }


        return Boolean(data);
    }


    /* =========================================================
       INITIAL SESSION CHECK
    ========================================================= */

    async function checkExistingSession() {

        if (!checkSupabase()) {
            return;
        }


        try {

            const {
                data,
                error
            } =
                await supabaseClient
                    .auth
                    .getSession();


            if (error) {

                console.error(
                    "Session check error:",
                    error
                );

                redirectToLogin();

                return;
            }


            const session =
                data?.session;


            /*
             * No session = not authorized.
             */

            if (!session?.user) {

                redirectToLogin();

                return;
            }


            /*
             * Session exists, but make sure
             * it belongs to the TeeDev admin.
             */

            const isAdmin =
                await verifyAdminUser(
                    session.user
                );


            if (!isAdmin) {

                await supabaseClient
                    .auth
                    .signOut();

                redirectToLogin();

                return;
            }


            /*
             * Authorized.
             */

            showDashboard(
                session
            );

        } catch (error) {

            console.error(
                "Session initialization error:",
                error
            );

            redirectToLogin();
        }
    }


    /* =========================================================
       AUTH STATE LISTENER
    ========================================================= */

    function initializeAuthListener() {

        if (!supabaseClient) {
            return;
        }


        supabaseClient.auth
            .onAuthStateChange(
                async (
                    event,
                    session
                ) => {

                    console.log(
                        "Supabase auth event:",
                        event
                    );


                    /*
                     * If logged out,
                     * leave manager immediately.
                     */

                    if (
                        event ===
                        "SIGNED_OUT"
                    ) {

                        redirectToLogin();

                        return;
                    }


                    /*
                     * Signed in / session restored.
                     */

                    if (
                        event ===
                        "SIGNED_IN" ||
                        event ===
                        "INITIAL_SESSION"
                    ) {

                        if (!session?.user) {

                            redirectToLogin();

                            return;
                        }


                        const isAdmin =
                            await verifyAdminUser(
                                session.user
                            );


                        if (!isAdmin) {

                            await supabaseClient
                                .auth
                                .signOut();

                            redirectToLogin();

                            return;
                        }


                        showDashboard(
                            session
                        );
                    }
                }
            );
    }


    /* =========================================================
       LOGOUT
    ========================================================= */

    async function handleLogout() {

        if (!supabaseClient) {
            redirectToLogin();
            return;
        }


        const button =
            $("#adminLogout");


        setButtonLoading(
            button,
            true,
            "Logging out..."
        );


        try {

            const {
                error
            } =
                await supabaseClient
                    .auth
                    .signOut();


            if (error) {

                console.error(
                    "Logout error:",
                    error
                );

                setManagerStatus(
                    error.message ||
                    "Unable to log out.",
                    "error"
                );

                return;
            }


            projects = [];
            experiences = [];


            redirectToLogin();

        } catch (error) {

            console.error(
                "Unexpected logout error:",
                error
            );


            setManagerStatus(
                error?.message ||
                "Unable to log out.",
                "error"
            );

        } finally {

            setButtonLoading(
                button,
                false
            );
        }
    }


    /* =========================================================
       LOAD PROJECTS + EXPERIENCE
    ========================================================= */

    async function loadManagerData() {

        if (!supabaseClient) {
            return;
        }


        setManagerStatus(
            "Loading portfolio data..."
        );


        try {

            const [
                projectsResult,
                experienceResult
            ] =
                await Promise.all([

                    supabaseClient
                        .from(
                            "portfolio_projects"
                        )
                        .select("*")
                        .order(
                            "display_order",
                            {
                                ascending:
                                    true
                            }
                        )
                        .order(
                            "created_at",
                            {
                                ascending:
                                    false
                            }
                        ),

                    supabaseClient
                        .from(
                            "portfolio_experience"
                        )
                        .select("*")
                        .order(
                            "display_order",
                            {
                                ascending:
                                    true
                            }
                        )
                        .order(
                            "created_at",
                            {
                                ascending:
                                    false
                            }
                        )
                ]);


            if (
                projectsResult.error
            ) {

                console.error(
                    "Projects error:",
                    projectsResult.error
                );


                setManagerStatus(
                    "Could not load projects: " +
                    projectsResult.error.message,
                    "error"
                );

                return;
            }


            if (
                experienceResult.error
            ) {

                console.error(
                    "Experience error:",
                    experienceResult.error
                );


                setManagerStatus(
                    "Could not load experience: " +
                    experienceResult.error.message,
                    "error"
                );

                return;
            }


            projects =
                projectsResult.data ||
                [];


            experiences =
                experienceResult.data ||
                [];


            renderManagerLists();


            setManagerStatus(
                `${projects.length} project(s) · ${experiences.length} experience entr${experiences.length === 1 ? "y" : "ies"}`,
                "success"
            );

        } catch (error) {

            console.error(
                "Manager loading error:",
                error
            );


            setManagerStatus(
                error?.message ||
                "Unable to load portfolio data.",
                "error"
            );
        }
    }


    /* =========================================================
       RENDER MANAGER LISTS
    ========================================================= */

    function renderManagerLists() {

        renderProjectsList();

        renderExperienceList();

        bindManagerActions();
    }


    /* =========================================================
       RENDER PROJECTS
    ========================================================= */

    function renderProjectsList() {

        const list =
            $("#projectManagerList");


        if (!list) {
            return;
        }


        if (!projects.length) {

            list.innerHTML = `
                <div class="empty-projects">
                    No projects yet.
                    Click "+ Add Project" to create one.
                </div>
            `;

            return;
        }


        list.innerHTML =
            projects
                .map(
                    (project) => {

                        const tags =
                            normalizeTags(
                                project.tags
                            );


                        return `
                            <article
                                class="manager-row"
                                data-project-row="${escapeHtml(project.id)}"
                            >

                                <div class="manager-order">
                                    #${String(
                                        Number(
                                            project.display_order
                                        ) || 0
                                    ).padStart(2, "0")}
                                </div>


                                <div class="manager-row-content">

                                    <h4>
                                        ${escapeHtml(
                                            project.title
                                        )}
                                    </h4>


                                    <p>
                                        ${escapeHtml(
                                            project.description ||
                                            ""
                                        )}
                                    </p>


                                    <div class="manager-row-meta">

                                        <span>
                                            ${escapeHtml(
                                                project.category ||
                                                "Project"
                                            )}
                                        </span>

                                        <span>
                                            ${escapeHtml(
                                                project.status ||
                                                ""
                                            )}
                                        </span>

                                        <span>
                                            ${
                                                project.published
                                                    ? "Published"
                                                    : "Hidden"
                                            }
                                        </span>

                                        ${
                                            project.featured
                                                ? `
                                                    <span>
                                                        Featured
                                                    </span>
                                                  `
                                                : ""
                                        }

                                    </div>


                                    ${
                                        tags.length
                                            ? `
                                                <div class="manager-row-tags">

                                                    ${tags
                                                        .map(
                                                            (tag) => `
                                                                <span>
                                                                    ${escapeHtml(
                                                                        tag
                                                                    )}
                                                                </span>
                                                            `
                                                        )
                                                        .join("")}

                                                </div>
                                              `
                                            : ""
                                    }

                                </div>


                                <div class="manager-row-actions">

                                    <button
                                        type="button"
                                        data-edit-project="${project.id}"
                                    >
                                        Edit
                                    </button>


                                    <button
                                        type="button"
                                        data-toggle-project="${project.id}"
                                    >
                                        ${
                                            project.published
                                                ? "Hide"
                                                : "Publish"
                                        }
                                    </button>


                                    <button
                                        type="button"
                                        class="danger"
                                        data-delete-project="${project.id}"
                                    >
                                        Delete
                                    </button>

                                </div>

                            </article>
                        `;
                    }
                )
                .join("");
    }


    /* =========================================================
       RENDER EXPERIENCE
    ========================================================= */

    function renderExperienceList() {

        const list =
            $("#experienceManagerList");


        if (!list) {
            return;
        }


        if (!experiences.length) {

            list.innerHTML = `
                <div class="empty-projects">
                    No experience entries yet.
                    Click "+ Add Experience" to create one.
                </div>
            `;

            return;
        }


        list.innerHTML =
            experiences
                .map(
                    (experience) => `

                        <article
                            class="manager-row"
                            data-experience-row="${escapeHtml(
                                experience.id
                            )}"
                        >

                            <div class="manager-order">

                                #${String(
                                    Number(
                                        experience.display_order
                                    ) || 0
                                ).padStart(2, "0")}

                            </div>


                            <div class="manager-row-content">

                                <h4>
                                    ${escapeHtml(
                                        experience.title
                                    )}
                                </h4>


                                <p>
                                    ${escapeHtml(
                                        experience.description ||
                                        ""
                                    )}
                                </p>


                                <div class="manager-row-meta">

                                    <span>
                                        ${escapeHtml(
                                            experience.type ||
                                            "Experience"
                                        )}
                                    </span>


                                    <span>
                                        ${escapeHtml(
                                            experience.year ||
                                            ""
                                        )}
                                    </span>


                                    <span>
                                        ${escapeHtml(
                                            experience.status ||
                                            ""
                                        )}
                                    </span>


                                    <span>
                                        ${
                                            experience.published
                                                ? "Published"
                                                : "Hidden"
                                        }
                                    </span>

                                </div>

                            </div>


                            <div class="manager-row-actions">

                                <button
                                    type="button"
                                    data-edit-experience="${experience.id}"
                                >
                                    Edit
                                </button>


                                <button
                                    type="button"
                                    data-toggle-experience="${experience.id}"
                                >
                                    ${
                                        experience.published
                                            ? "Hide"
                                            : "Publish"
                                    }
                                </button>


                                <button
                                    type="button"
                                    class="danger"
                                    data-delete-experience="${experience.id}"
                                >
                                    Delete
                                </button>

                            </div>

                        </article>
                    `
                )
                .join("");
    }


    /* =========================================================
       BUTTON BINDINGS
    ========================================================= */

    function bindManagerActions() {


        /* -----------------------------------------------------
           EDIT PROJECT
        ----------------------------------------------------- */

        $$("[data-edit-project]")
            .forEach(
                (button) => {

                    button.onclick =
                        () => {

                            const project =
                                projects.find(
                                    (item) =>
                                        String(
                                            item.id
                                        ) ===
                                        String(
                                            button
                                                .dataset
                                                .editProject
                                        )
                                );


                            if (project) {

                                openProjectForm(
                                    project
                                );
                            }
                        };
                }
            );


        /* -----------------------------------------------------
           TOGGLE PROJECT
        ----------------------------------------------------- */

        $$("[data-toggle-project]")
            .forEach(
                (button) => {

                    button.onclick =
                        () =>
                            toggleProject(
                                button
                                    .dataset
                                    .toggleProject
                            );
                }
            );


        /* -----------------------------------------------------
           DELETE PROJECT
        ----------------------------------------------------- */

        $$("[data-delete-project]")
            .forEach(
                (button) => {

                    button.onclick =
                        () =>
                            deleteProject(
                                button
                                    .dataset
                                    .deleteProject
                            );
                }
            );


        /* -----------------------------------------------------
           EDIT EXPERIENCE
        ----------------------------------------------------- */

        $$("[data-edit-experience]")
            .forEach(
                (button) => {

                    button.onclick =
                        () => {

                            const experience =
                                experiences.find(
                                    (item) =>
                                        String(
                                            item.id
                                        ) ===
                                        String(
                                            button
                                                .dataset
                                                .editExperience
                                        )
                                );


                            if (experience) {

                                openExperienceForm(
                                    experience
                                );
                            }
                        };
                }
            );


        /* -----------------------------------------------------
           TOGGLE EXPERIENCE
        ----------------------------------------------------- */

        $$("[data-toggle-experience]")
            .forEach(
                (button) => {

                    button.onclick =
                        () =>
                            toggleExperience(
                                button
                                    .dataset
                                    .toggleExperience
                            );
                }
            );


        /* -----------------------------------------------------
           DELETE EXPERIENCE
        ----------------------------------------------------- */

        $$("[data-delete-experience]")
            .forEach(
                (button) => {

                    button.onclick =
                        () =>
                            deleteExperience(
                                button
                                    .dataset
                                    .deleteExperience
                            );
                }
            );
    }


    /* =========================================================
       PROJECT FORM
    ========================================================= */

    function openProjectForm(
        project = null
    ) {

        const form =
            $("#projectForm");


        if (!form) {
            return;
        }


        form.hidden =
            false;


        const mode =
            $("#projectFormMode");


        const title =
            $("#projectFormTitle");


        if (mode) {

            mode.textContent =
                project
                    ? "EDIT PROJECT"
                    : "NEW PROJECT";
        }


        if (title) {

            title.textContent =
                project
                    ? "Edit a project"
                    : "Add a project";
        }


        $("#projectId").value =
            project?.id || "";


        $("#projectTitle").value =
            project?.title || "";


        $("#projectSlug").value =
            project?.slug || "";


        $("#projectRole").value =
            project?.role || "";


        $("#projectCategory").value =
            project?.category || "";


        $("#projectYear").value =
            project?.year ||
            new Date().getFullYear();


        $("#projectStatus").value =
            project?.status ||
            "Live";


        $("#projectUrl").value =
            project?.live_url || "";


        $("#projectImage").value =
            project?.image_url || "";


        $("#projectDescription").value =
            project?.description || "";


        $("#projectTags").value =
            normalizeTags(
                project?.tags
            ).join(", ");


        $("#projectFeatured").value =
            String(
                Boolean(
                    project?.featured
                )
            );


        $("#projectOrder").value =
            project?.display_order ??
            projects.length;


        form.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });
    }


    /* =========================================================
       EXPERIENCE FORM
    ========================================================= */

    function openExperienceForm(
        experience = null
    ) {

        const form =
            $("#experienceForm");


        if (!form) {
            return;
        }


        form.hidden =
            false;


        const mode =
            $("#experienceFormMode");


        const title =
            $("#experienceFormTitle");


        if (mode) {

            mode.textContent =
                experience
                    ? "EDIT EXPERIENCE"
                    : "NEW EXPERIENCE";
        }


        if (title) {

            title.textContent =
                experience
                    ? "Edit experience"
                    : "Add experience";
        }


        $("#experienceId").value =
            experience?.id || "";


        $("#experienceTitle").value =
            experience?.title || "";


        $("#experienceType").value =
            experience?.type || "";


        $("#experienceYear").value =
            experience?.year || "";


        $("#experienceStatus").value =
            experience?.status ||
            "Ongoing";


        $("#experienceDescription").value =
            experience?.description || "";


        $("#experienceOrder").value =
            experience?.display_order ??
            experiences.length;


        form.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });
    }


    /* =========================================================
       SAVE PROJECT
    ========================================================= */

    async function saveProject(event) {

        event.preventDefault();


        if (!supabaseClient) {
            return;
        }


        const form =
            $("#projectForm");


        const button =
            form?.querySelector(
                'button[type="submit"]'
            );


        const id =
            $("#projectId")
                ?.value
                .trim();


        const title =
            $("#projectTitle")
                ?.value
                .trim();


        if (!title) {

            setManagerStatus(
                "Project title is required.",
                "error"
            );

            return;
        }


        const generatedSlug =
            title
                .toLowerCase()
                .replace(
                    /[^a-z0-9]+/g,
                    "-"
                )
                .replace(
                    /^-+|-+$/g,
                    ""
                );


        const slug =
            $("#projectSlug")
                ?.value
                .trim() ||
            generatedSlug;


        const payload = {

            title,

            slug,

            role:
                $("#projectRole")
                    ?.value
                    .trim() ||
                null,

            category:
                $("#projectCategory")
                    ?.value
                    .trim() ||
                null,

            year:
                Number(
                    $("#projectYear")
                        ?.value
                ) ||
                new Date()
                    .getFullYear(),

            status:
                $("#projectStatus")
                    ?.value ||
                "Live",

            live_url:
                $("#projectUrl")
                    ?.value
                    .trim() ||
                null,

            image_url:
                $("#projectImage")
                    ?.value
                    .trim() ||
                null,

            description:
                $("#projectDescription")
                    ?.value
                    .trim() ||
                "",

            tags:
                normalizeTags(
                    $("#projectTags")
                        ?.value
                ),

            featured:
                $("#projectFeatured")
                    ?.value ===
                "true",

            display_order:
                Number(
                    $("#projectOrder")
                        ?.value
                ) || 0
        };


        setButtonLoading(
            button,
            true,
            "Saving..."
        );


        setManagerStatus(
            "Saving project..."
        );


        try {

            let result;


            if (id) {

                result =
                    await supabaseClient
                        .from(
                            "portfolio_projects"
                        )
                        .update(
                            payload
                        )
                        .eq(
                            "id",
                            id
                        );

            } else {

                result =
                    await supabaseClient
                        .from(
                            "portfolio_projects"
                        )
                        .insert(
                            payload
                        );
            }


            if (result.error) {

                console.error(
                    "Project save error:",
                    result.error
                );


                setManagerStatus(
                    result.error.message,
                    "error"
                );

                return;
            }


            form.hidden =
                true;


            setManagerStatus(
                id
                    ? "Project updated successfully."
                    : "Project added successfully.",
                "success"
            );


            await loadManagerData();

        } catch (error) {

            console.error(
                "Project save exception:",
                error
            );


            setManagerStatus(
                error?.message ||
                "Unable to save project.",
                "error"
            );

        } finally {

            setButtonLoading(
                button,
                false
            );
        }
    }


    /* =========================================================
       SAVE EXPERIENCE
    ========================================================= */

    async function saveExperience(event) {

        event.preventDefault();


        if (!supabaseClient) {
            return;
        }


        const form =
            $("#experienceForm");


        const button =
            form?.querySelector(
                'button[type="submit"]'
            );


        const id =
            $("#experienceId")
                ?.value
                .trim();


        const title =
            $("#experienceTitle")
                ?.value
                .trim();


        if (!title) {

            setManagerStatus(
                "Experience title is required.",
                "error"
            );

            return;
        }


        const payload = {

            title,

            type:
                $("#experienceType")
                    ?.value
                    .trim() ||
                null,

            year:
                $("#experienceYear")
                    ?.value
                    .trim() ||
                null,

            status:
                $("#experienceStatus")
                    ?.value
                    .trim() ||
                null,

            description:
                $("#experienceDescription")
                    ?.value
                    .trim() ||
                "",

            display_order:
                Number(
                    $("#experienceOrder")
                        ?.value
                ) || 0
        };


        setButtonLoading(
            button,
            true,
            "Saving..."
        );


        setManagerStatus(
            "Saving experience..."
        );


        try {

            let result;


            if (id) {

                result =
                    await supabaseClient
                        .from(
                            "portfolio_experience"
                        )
                        .update(
                            payload
                        )
                        .eq(
                            "id",
                            id
                        );

            } else {

                result =
                    await supabaseClient
                        .from(
                            "portfolio_experience"
                        )
                        .insert(
                            payload
                        );
            }


            if (result.error) {

                console.error(
                    "Experience save error:",
                    result.error
                );


                setManagerStatus(
                    result.error.message,
                    "error"
                );

                return;
            }


            form.hidden =
                true;


            setManagerStatus(
                id
                    ? "Experience updated successfully."
                    : "Experience added successfully.",
                "success"
            );


            await loadManagerData();

        } catch (error) {

            console.error(
                "Experience save exception:",
                error
            );


            setManagerStatus(
                error?.message ||
                "Unable to save experience.",
                "error"
            );

        } finally {

            setButtonLoading(
                button,
                false
            );
        }
    }


    /* =========================================================
       TOGGLE PROJECT PUBLISHED
    ========================================================= */

    async function toggleProject(id) {

        const project =
            projects.find(
                (item) =>
                    String(item.id) ===
                    String(id)
            );


        if (!project) {
            return;
        }


        setManagerStatus(
            "Updating project..."
        );


        try {

            const {
                error
            } =
                await supabaseClient
                    .from(
                        "portfolio_projects"
                    )
                    .update({
                        published:
                            !Boolean(
                                project.published
                            )
                    })
                    .eq(
                        "id",
                        id
                    );


            if (error) {

                setManagerStatus(
                    error.message,
                    "error"
                );

                return;
            }


            await loadManagerData();

        } catch (error) {

            console.error(error);


            setManagerStatus(
                error?.message ||
                "Unable to update project.",
                "error"
            );
        }
    }


    /* =========================================================
       DELETE PROJECT
    ========================================================= */

    async function deleteProject(id) {

        const project =
            projects.find(
                (item) =>
                    String(item.id) ===
                    String(id)
            );


        if (!project) {
            return;
        }


        const confirmed =
            window.confirm(
                `Delete "${project.title}" permanently?`
            );


        if (!confirmed) {
            return;
        }


        setManagerStatus(
            "Deleting project..."
        );


        try {

            const {
                error
            } =
                await supabaseClient
                    .from(
                        "portfolio_projects"
                    )
                    .delete()
                    .eq(
                        "id",
                        id
                    );


            if (error) {

                console.error(error);


                setManagerStatus(
                    error.message,
                    "error"
                );

                return;
            }


            setManagerStatus(
                "Project deleted successfully.",
                "success"
            );


            await loadManagerData();

        } catch (error) {

            console.error(error);


            setManagerStatus(
                error?.message ||
                "Unable to delete project.",
                "error"
            );
        }
    }


    /* =========================================================
       TOGGLE EXPERIENCE PUBLISHED
    ========================================================= */

    async function toggleExperience(id) {

        const experience =
            experiences.find(
                (item) =>
                    String(item.id) ===
                    String(id)
            );


        if (!experience) {
            return;
        }


        setManagerStatus(
            "Updating experience..."
        );


        try {

            const {
                error
            } =
                await supabaseClient
                    .from(
                        "portfolio_experience"
                    )
                    .update({
                        published:
                            !Boolean(
                                experience.published
                            )
                    })
                    .eq(
                        "id",
                        id
                    );


            if (error) {

                setManagerStatus(
                    error.message,
                    "error"
                );

                return;
            }


            await loadManagerData();

        } catch (error) {

            console.error(error);


            setManagerStatus(
                error?.message ||
                "Unable to update experience.",
                "error"
            );
        }
    }


    /* =========================================================
       DELETE EXPERIENCE
    ========================================================= */

    async function deleteExperience(id) {

        const experience =
            experiences.find(
                (item) =>
                    String(item.id) ===
                    String(id)
            );


        if (!experience) {
            return;
        }


        const confirmed =
            window.confirm(
                `Delete "${experience.title}" permanently?`
            );


        if (!confirmed) {
            return;
        }


        setManagerStatus(
            "Deleting experience..."
        );


        try {

            const {
                error
            } =
                await supabaseClient
                    .from(
                        "portfolio_experience"
                    )
                    .delete()
                    .eq(
                        "id",
                        id
                    );


            if (error) {

                setManagerStatus(
                    error.message,
                    "error"
                );

                return;
            }


            setManagerStatus(
                "Experience deleted successfully.",
                "success"
            );


            await loadManagerData();

        } catch (error) {

            console.error(error);


            setManagerStatus(
                error?.message ||
                "Unable to delete experience.",
                "error"
            );
        }
    }


    /* =========================================================
       MANAGER TABS
    ========================================================= */

    function initializeTabs() {

        $$("[data-manager-tab]")
            .forEach(
                (tab) => {

                    tab.addEventListener(
                        "click",
                        () => {

                            const target =
                                tab.dataset
                                    .managerTab;


                            $$(
                                "[data-manager-tab]"
                            )
                                .forEach(
                                    (item) => {

                                        item.classList
                                            .toggle(
                                                "active",
                                                item ===
                                                tab
                                            );
                                    }
                                );


                            const projectsTab =
                                target ===
                                "projects";


                            const projectsList =
                                $("#projectManagerList");


                            const experienceList =
                                $("#experienceManagerList");


                            const addProject =
                                $("#addProjectBtn");


                            const addExperience =
                                $("#addExperienceBtn");


                            if (
                                projectsList
                            ) {

                                projectsList.hidden =
                                    !projectsTab;
                            }


                            if (
                                experienceList
                            ) {

                                experienceList.hidden =
                                    projectsTab;
                            }


                            if (
                                addProject
                            ) {

                                addProject.hidden =
                                    !projectsTab;
                            }


                            if (
                                addExperience
                            ) {

                                addExperience.hidden =
                                    projectsTab;
                            }


                            const projectForm =
                                $("#projectForm");


                            const experienceForm =
                                $("#experienceForm");


                            if (
                                projectForm
                            ) {

                                projectForm.hidden =
                                    true;
                            }


                            if (
                                experienceForm
                            ) {

                                experienceForm.hidden =
                                    true;
                            }
                        }
                    );
                }
            );
    }


    /* =========================================================
       FORM CLOSE BUTTONS
    ========================================================= */

    function initializeCloseButtons() {

        $$("[data-close-form]")
            .forEach(
                (button) => {

                    button.addEventListener(
                        "click",
                        () => {

                            const form =
                                $(
                                    "#" +
                                    button
                                        .dataset
                                        .closeForm
                                );


                            if (form) {

                                form.hidden =
                                    true;
                            }
                        }
                    );
                }
            );
    }


    /* =========================================================
       ADD BUTTONS
    ========================================================= */

    function initializeAddButtons() {

        $("#addProjectBtn")
            ?.addEventListener(
                "click",
                () => {

                    openProjectForm();
                }
            );


        $("#addExperienceBtn")
            ?.addEventListener(
                "click",
                () => {

                    openExperienceForm();
                }
            );
    }


    /* =========================================================
       INITIALIZE PROJECT MANAGER
    ========================================================= */

    function initialize() {

        console.log(
            "TeeDev Project Manager initializing..."
        );


        /*
         * IMPORTANT:
         *
         * There is NO login form here.
         *
         * Authentication happens exclusively
         * on admin.html.
         */


        $("#adminLogout")
            ?.addEventListener(
                "click",
                handleLogout
            );


        $("#projectForm")
            ?.addEventListener(
                "submit",
                saveProject
            );


        $("#experienceForm")
            ?.addEventListener(
                "submit",
                saveExperience
            );


        initializeTabs();

        initializeCloseButtons();

        initializeAddButtons();


        /*
         * Listen for authentication changes.
         */

        initializeAuthListener();


        /*
         * Check whether the visitor already
         * has an authorized admin session.
         */

        checkExistingSession();
    }


    /* =========================================================
       DOM READY
    ========================================================= */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            initialize
        );

    } else {

        initialize();
    }

})();