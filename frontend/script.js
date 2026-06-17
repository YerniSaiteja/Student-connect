const API_BASE_URL = "http://localhost/Userproject-0.0.1-SNAPSHOT/api";
const SESSION_KEY = "campusConnectStudent";

const appState = {
    student: null,
    toastTimer: null
};

const selectors = {
    publicContent: document.getElementById("publicContent"),
    portalApp: document.getElementById("portalApp"),
    siteNav: document.getElementById("siteNav"),
    menuToggle: document.getElementById("menuToggle"),
    navPortalButton: document.getElementById("navPortalButton"),
    registerForm: document.getElementById("registerForm"),
    loginForm: document.getElementById("loginForm"),
    portalRegisterForm: document.getElementById("portalRegisterForm"),
    portalLoginForm: document.getElementById("portalLoginForm"),
    updateProfileForm: document.getElementById("updateProfileForm"),
    changePasswordForm: document.getElementById("changePasswordForm"),
    menuStudentName: document.getElementById("menuStudentName"),
    menuStudentId: document.getElementById("menuStudentId"),
    welcomeMessage: document.getElementById("welcomeMessage"),
    summaryStudentId: document.getElementById("summaryStudentId"),
    summaryName: document.getElementById("summaryName"),
    summaryEmail: document.getElementById("summaryEmail"),
    summaryCourse: document.getElementById("summaryCourse"),
    profileDetails: document.getElementById("profileDetails"),
    coursesGrid: document.getElementById("coursesGrid"),
    toast: document.getElementById("toast")
};

function showToast(message, type = "success") {
    if (!selectors.toast) {
        return;
    }

    window.clearTimeout(appState.toastTimer);
    selectors.toast.textContent = message;
    selectors.toast.className = `toast show ${type}`;

    appState.toastTimer = window.setTimeout(() => {
        selectors.toast.className = "toast";
    }, 4200);
}

function closeMenu() {
    selectors.siteNav?.classList.remove("open");
    selectors.menuToggle?.setAttribute("aria-expanded", "false");
}

function scrollToElement(element) {
    element?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function getFormData(form) {
    return Object.fromEntries(new FormData(form).entries());
}

function setFieldValue(id, value) {
    const field = document.getElementById(id);

    if (field) {
        field.value = value || "";
    }
}

async function readResponse(response) {
    const text = await response.text();

    if (!text) {
        return null;
    }

    try {
        return JSON.parse(text);
    } catch (error) {
        return text;
    }
}

function getResponseMessage(payload, fallback) {
    if (!payload) {
        return fallback;
    }

    if (typeof payload === "string") {
        return payload;
    }

    return payload.message || payload.error || fallback;
}

async function requestApi(path, options = {}) {
    try {
        const response = await fetch(`${API_BASE_URL}${path}`, {
            headers: {
                "Content-Type": "application/json",
                ...(options.headers || {})
            },
            ...options
        });
        const payload = await readResponse(response);

        if (!response.ok) {
            throw new Error(getResponseMessage(payload, `Request failed with status ${response.status}.`));
        }

        return payload;
    } catch (error) {
        if (error instanceof TypeError) {
            throw new Error("Cannot connect to backend. Check that Tomcat is running and CORS is allowed.");
        }

        throw error;
    }
}

function normalizeStudent(payload, fallback = {}) {
    const source = payload?.student || payload?.data || payload?.user || payload || {};

    if (typeof source !== "object") {
        return {
            userId: fallback.userId || fallback.id || "",
            name: fallback.name || "",
            email: fallback.email || "",
            course: fallback.course || ""
        };
    }

    const userId = source.userId ?? source.id ?? source.student_id ?? source.rollNo ?? source.rollNumber ?? fallback.userId ?? fallback.id ?? "";

    return {
        userId: String(userId || ""),
        name: source.name ?? source.studentName ?? fallback.name ?? "",
        email: source.email ?? fallback.email ?? "",
        course: source.course ?? source.courseName ?? fallback.course ?? ""
    };
}

function saveSession(student) {
    appState.student = student;
    localStorage.setItem(SESSION_KEY, JSON.stringify(student));
    localStorage.setItem("userId", student.userId);
}

function loadSession() {
    try {
        const stored = localStorage.getItem(SESSION_KEY);
        appState.student = stored ? JSON.parse(stored) : null;
    } catch (error) {
        appState.student = null;
        localStorage.removeItem(SESSION_KEY);
    }
}

function clearSession() {
    appState.student = null;
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem("userId");
}

function requireUserId() {
    const userId = appState.student?.userId || localStorage.getItem("userId");

    if (!userId) {
        showToast("Student ID is missing. Please login again.", "error");
        return "";
    }

    return userId;
}

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function setAuthMode(mode) {
    if (!selectors.portalApp?.classList.contains("hidden") && appState.student?.userId) {
        showPortalPage(mode === "login" ? "loginPage" : "registerPage");
        return;
    }

    const isLogin = mode === "login";

    document.querySelectorAll(".tab-button").forEach((button) => {
        const active = button.dataset.authMode === mode;
        button.classList.toggle("active", active);
        button.setAttribute("aria-selected", String(active));
    });

    selectors.registerForm?.classList.toggle("active", !isLogin);
    selectors.loginForm?.classList.toggle("active", isLogin);
    selectors.publicContent?.classList.remove("hidden");
    selectors.portalApp?.classList.add("hidden");
    scrollToElement(document.getElementById("auth"));
    closeMenu();
}

function showPublicHome() {
    selectors.publicContent?.classList.remove("hidden");
    selectors.portalApp?.classList.add("hidden");
    scrollToElement(document.getElementById("home"));
    closeMenu();
}

function showPortalPage(pageId) {
    if (!appState.student?.userId && pageId !== "loginPage" && pageId !== "registerPage") {
        setAuthMode("login");
        showToast("Please login before opening the portal.", "warning");
        return;
    }

    selectors.publicContent?.classList.add("hidden");
    selectors.portalApp?.classList.remove("hidden");
    selectors.navPortalButton?.classList.remove("hidden");

    document.querySelectorAll(".portal-page").forEach((page) => {
        page.classList.toggle("active", page.id === pageId);
    });

    document.querySelectorAll(".portal-menu-button[data-portal-page]").forEach((button) => {
        button.classList.toggle("active", button.dataset.portalPage === pageId);
    });

    renderStudentSummary();
    fillProfileForms();
    scrollToElement(selectors.portalApp);
    closeMenu();

    if (pageId === "profilePage") {
        viewProfile();
    }

    if (pageId === "coursesPage") {
        viewCourses();
    }
}

function renderStudentSummary() {
    const student = appState.student || {};

    selectors.menuStudentName.textContent = student.name || "Student";
    selectors.menuStudentId.textContent = `ID: ${student.userId || "-"}`;
    selectors.welcomeMessage.textContent = `Welcome back, ${student.name || "Student"}`;
    selectors.summaryStudentId && (selectors.summaryStudentId.textContent = student.userId || "-");
    selectors.summaryName && (selectors.summaryName.textContent = student.name || "-");
    selectors.summaryEmail && (selectors.summaryEmail.textContent = student.email || "-");
    selectors.summaryCourse && (selectors.summaryCourse.textContent = student.course || "-");
}

function fillProfileForms() {
    const student = appState.student || {};

    setFieldValue("updateName", student.name);
    setFieldValue("updateEmail", student.email);
    setFieldValue("updateCourse", student.course);
    setFieldValue("passwordEmail", student.email);
}

function renderProfile(student) {
    const details = [
        ["Student ID", student.userId || "-"],
        ["Name", student.name || "-"],
        ["Email", student.email || "-"],
        ["Course", student.course || "-"]
    ];

    selectors.profileDetails.innerHTML = details.map(([label, value]) => `
        <article class="detail-card">
            <span>${label}</span>
            <strong>${escapeHtml(value)}</strong>
        </article>
    `).join("");
}

function normalizeCourses(payload) {
    if (Array.isArray(payload)) {
        return payload;
    }

    if (Array.isArray(payload?.courses)) {
        return payload.courses;
    }

    if (Array.isArray(payload?.data)) {
        return payload.data;
    }

    return [];
}

function renderCourses(courses) {
    if (!courses.length) {
        selectors.coursesGrid.innerHTML = "<p>No courses found.</p>";
        return;
    }

    selectors.coursesGrid.innerHTML = courses.map((course, index) => {
        const courseObject = typeof course === "object" ? course : { name: course };
        const title = courseObject.name || courseObject.courseName || courseObject.title || `Course ${index + 1}`;
        const code = courseObject.code || courseObject.courseCode || `CC-${String(index + 1).padStart(2, "0")}`;
        const description = courseObject.description || courseObject.details || "Campus course available for enrolled students.";

        return `
            <article class="course-card">
                <span>${escapeHtml(code)}</span>
                <strong>${escapeHtml(title)}</strong>
                <p>${escapeHtml(description)}</p>
            </article>
        `;
    }).join("");
}

async function registerStudent(event) {
    event.preventDefault();

    const form = event.currentTarget;
    const data = getFormData(form);

    try {
        const payload = await requestApi("/register", {
            method: "POST",
            body: JSON.stringify(data)
        });

        showToast(getResponseMessage(payload, "Registration successful."), "success");
        form.reset();

        if (selectors.portalApp.classList.contains("hidden")) {
            setAuthMode("login");
        } else {
            showPortalPage("loginPage");
        }
    } catch (error) {
        showToast(error.message, "error");
    }
}

async function loginStudent(event) {
    event.preventDefault();

    const form = event.currentTarget;
    const credentials = getFormData(form);

    try {
        const payload = await requestApi("/login", {
            method: "POST",
            body: JSON.stringify(credentials)
        });
        const student = normalizeStudent(payload, { email: credentials.email });

        if (!student.userId) {
            showToast("Login succeeded, but no student ID was returned by the backend.", "warning");
            return;
        }

        saveSession(student);
        form.reset();
        showToast("Login successful. Opening portal.", "success");
        showPortalPage("profilePage");
    } catch (error) {
        showToast(error.message, "error");
    }
}

async function viewProfile() {
    const userId = requireUserId();

    if (!userId) {
        return;
    }

    selectors.profileDetails.innerHTML = "<p>Loading profile...</p>";

    try {
        const payload = await requestApi(`/profile/${encodeURIComponent(userId)}`);
        const student = normalizeStudent(payload, appState.student || {});

        saveSession(student);
        renderStudentSummary();
        fillProfileForms();
        renderProfile(student);
    } catch (error) {
        selectors.profileDetails.innerHTML = "<p>Unable to load profile.</p>";
        showToast(error.message, "error");
    }
}

async function updateProfile(event) {
    event.preventDefault();
    const form = event.currentTarget;

    const userId = requireUserId();

    if (!userId) {
        return;
    }

    const data = getFormData(form);

    try {
        const payload = await requestApi(`/update-profile/${encodeURIComponent(userId)}`, {
            method: "PUT",
            body: JSON.stringify(data)
        });
        const student = normalizeStudent(payload, { ...appState.student, ...data, userId });

        saveSession(student);
        renderStudentSummary();
        renderProfile(student);
        fillProfileForms();
        showToast(getResponseMessage(payload, "Profile updated successfully."), "success");
        showPortalPage("profilePage");
    } catch (error) {
        showToast(error.message, "error");
    }
}

async function viewCourses() {
    selectors.coursesGrid.innerHTML = "<p>Loading courses...</p>";

    try {
        const payload = await requestApi("/courses");
        renderCourses(normalizeCourses(payload));
    } catch (error) {
        selectors.coursesGrid.innerHTML = "<p>Unable to load courses.</p>";
        showToast(error.message, "error");
    }
}

async function changePassword(event) {
    event.preventDefault();

    const form = event.currentTarget;
    const data = getFormData(form);

    try {
        const payload = await requestApi("/change-password", {
            method: "PUT",
            body: JSON.stringify(data)
        });

        form.reset();
        setFieldValue("passwordEmail", appState.student?.email || data.email);
        showToast(getResponseMessage(payload, "Password changed successfully."), "success");
    } catch (error) {
        showToast(error.message, "error");
    }
}

function logout() {
    clearSession();
    selectors.portalApp?.classList.add("hidden");
    selectors.navPortalButton?.classList.add("hidden");
    selectors.publicContent?.classList.remove("hidden");
    setAuthMode("login");
    showToast("Logged out successfully.", "success");
}

function bindEvents() {
    selectors.menuToggle?.addEventListener("click", () => {
        const isOpen = selectors.siteNav.classList.toggle("open");
        selectors.menuToggle.setAttribute("aria-expanded", String(isOpen));
    });

    document.querySelectorAll("[data-public-target='home']").forEach((button) => {
        button.addEventListener("click", showPublicHome);
    });

    document.querySelectorAll("[data-auth-mode]").forEach((button) => {
        button.addEventListener("click", () => setAuthMode(button.dataset.authMode));
    });

    document.querySelectorAll("[data-portal-page]").forEach((button) => {
        button.addEventListener("click", () => showPortalPage(button.dataset.portalPage));
    });

    selectors.registerForm?.addEventListener("submit", registerStudent);
    selectors.loginForm?.addEventListener("submit", loginStudent);
    selectors.portalRegisterForm?.addEventListener("submit", registerStudent);
    selectors.portalLoginForm?.addEventListener("submit", loginStudent);
    selectors.updateProfileForm?.addEventListener("submit", updateProfile);
    selectors.changePasswordForm?.addEventListener("submit", changePassword);

    document.getElementById("refreshProfileButton")?.addEventListener("click", viewProfile);
    document.getElementById("refreshCoursesButton")?.addEventListener("click", viewCourses);
    document.getElementById("logoutButton")?.addEventListener("click", logout);
}

function initializeApp() {
    bindEvents();
    loadSession();

    if (appState.student?.userId) {
        selectors.navPortalButton?.classList.remove("hidden");
        showPortalPage("profilePage");
    } else {
        selectors.portalApp?.classList.add("hidden");
        selectors.navPortalButton?.classList.add("hidden");
        selectors.publicContent?.classList.remove("hidden");
    }
}

document.addEventListener("DOMContentLoaded", initializeApp);
