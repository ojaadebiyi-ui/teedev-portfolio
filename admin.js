/* ============================================================
   TEEDEV — ADMIN LOGIN
   Authentication only
   Successful login → project-manager.html
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


    /* =========================================================
       HELPERS
    ========================================================= */

    const $ = (selector) =>
        document.querySelector(selector);


    function setStatus(
        message = "",
        type = ""
    ) {

        const status =
            $("#adminLoginStatus");

        if (!status) {
            return;
        }

        status.textContent = message;

        status.classList.remove(
            "success",
            "error"
        );

        if (type) {
            status.classList.add(type);
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

            if (!button.dataset.originalText) {
                button.dataset.originalText =
                    button.textContent;
            }

            button.disabled = true;

            button.textContent =
                loadingText;

        } else {

            button.disabled = false;

            button.textContent =
                button.dataset.originalText ||
                "Sign In";
        }
    }


    /* =========================================================
       CHECK SUPABASE
    ========================================================= */

    function checkSupabase() {

        if (!window.supabase) {

            setStatus(
                "Supabase library failed to load. Check your internet connection.",
                "error"
            );

            return false;
        }

        if (!supabaseClient) {

            setStatus(
                "Supabase is not configured. Check supabase-config.js.",
                "error"
            );

            return false;
        }

        return true;
    }


    /* =========================================================
       VERIFY ADMIN
    ========================================================= */

    async function verifyAdminUser(user) {

        if (!user) {
            return false;
        }


        /*
         * First verify the exact Supabase
         * Auth user UUID.
         */

        if (user.id !== ADMIN_USER_ID) {

            console.warn(
                "Unauthorized admin UUID:",
                user.id
            );

            return false;
        }


        /*
         * Then verify that the UUID exists
         * inside portfolio_admins.
         */

        const {
            data,
            error
        } =
            await supabaseClient
                .from("portfolio_admins")
                .select("user_id")
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
       REDIRECT AUTHORIZED USER
    ========================================================= */

    async function redirectIfAuthorized(
        session
    ) {

        if (!session?.user) {
            return false;
        }


        setStatus(
            "Checking administrator access..."
        );


        try {

            const isAdmin =
                await verifyAdminUser(
                    session.user
                );


            if (!isAdmin) {

                await supabaseClient.auth
                    .signOut();

                setStatus(
                    "This account is not authorized to access the TeeDev Project Manager.",
                    "error"
                );

                return false;
            }


            /*
             * IMPORTANT:
             * The Project Manager is now
             * completely separated from
             * the login page.
             */

            window.location.replace(
                "project-manager.html"
            );

            return true;

        } catch (error) {

            console.error(
                "Admin verification error:",
                error
            );

            setStatus(
                error?.message ||
                "Unable to verify administrator access.",
                "error"
            );

            return false;
        }
    }


    /* =========================================================
       LOGIN
    ========================================================= */

    async function handleLogin(event) {

        event.preventDefault();


        if (!checkSupabase()) {
            return;
        }


        const form =
            $("#adminLoginForm");


        const button =
            form?.querySelector(
                'button[type="submit"]'
            );


        const email =
            $("#adminEmail")
                ?.value
                .trim();


        const password =
            $("#adminPassword")
                ?.value ||
            "";


        /* -----------------------------------------------------
           VALIDATION
        ----------------------------------------------------- */

        if (!email) {

            setStatus(
                "Please enter your email address.",
                "error"
            );

            return;
        }


        if (!password) {

            setStatus(
                "Please enter your password.",
                "error"
            );

            return;
        }


        setButtonLoading(
            button,
            true,
            "Signing in..."
        );


        setStatus(
            "Authenticating..."
        );


        try {

            /* -------------------------------------------------
               SUPABASE LOGIN
            ------------------------------------------------- */

            const {
                data,
                error
            } =
                await supabaseClient.auth
                    .signInWithPassword({
                        email,
                        password
                    });


            if (error) {

                console.error(
                    "Supabase login error:",
                    error
                );

                setStatus(
                    error.message ||
                    "Login failed. Check your email and password.",
                    "error"
                );

                return;
            }


            const session =
                data?.session;


            const user =
                data?.user ||
                session?.user;


            if (!user) {

                setStatus(
                    "Login succeeded but no user session was returned.",
                    "error"
                );

                return;
            }


            /* -------------------------------------------------
               ADMIN VERIFICATION
            ------------------------------------------------- */

            setStatus(
                "Checking administrator access..."
            );


            const isAdmin =
                await verifyAdminUser(
                    user
                );


            if (!isAdmin) {

                await supabaseClient.auth
                    .signOut();


                setStatus(
                    "Login successful, but this account is not authorized to access the TeeDev Project Manager.",
                    "error"
                );

                return;
            }


            /* -------------------------------------------------
               SUCCESS
            ------------------------------------------------- */

            setStatus(
                "Login successful. Opening Project Manager...",
                "success"
            );


            /*
             * Small delay gives the success message
             * time to render before navigation.
             */

            setTimeout(() => {

                window.location.replace(
                    "project-manager.html"
                );

            }, 250);


        } catch (error) {

            console.error(
                "Unexpected login error:",
                error
            );


            setStatus(
                error?.message ||
                "Something went wrong while logging in.",
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
       CHECK EXISTING SESSION
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
                await supabaseClient.auth
                    .getSession();


            if (error) {

                console.error(
                    "Session check error:",
                    error
                );

                setStatus(
                    error.message,
                    "error"
                );

                return;
            }


            const session =
                data?.session;


            if (!session?.user) {
                return;
            }


            /*
             * If the user is already logged in,
             * verify the account and send them
             * straight to the manager.
             */

            await redirectIfAuthorized(
                session
            );


        } catch (error) {

            console.error(
                "Session initialization error:",
                error
            );


            setStatus(
                "Unable to verify your admin session.",
                "error"
            );
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
                     * User signed out.
                     */

                    if (
                        event ===
                        "SIGNED_OUT"
                    ) {

                        setStatus(
                            "You have been logged out.",
                            "success"
                        );

                        return;
                    }


                    /*
                     * User signed in.
                     */

                    if (
                        event ===
                        "SIGNED_IN"
                    ) {

                        if (!session?.user) {
                            return;
                        }


                        await redirectIfAuthorized(
                            session
                        );
                    }
                }
            );
    }


    /* =========================================================
       INITIALIZE
    ========================================================= */

    function initialize() {

        console.log(
            "TeeDev Admin Login initializing..."
        );


        /*
         * Login form
         */

        $("#adminLoginForm")
            ?.addEventListener(
                "submit",
                handleLogin
            );


        /*
         * Auth listener
         */

        initializeAuthListener();


        /*
         * Existing Supabase session
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