const ADD_NOTE_ENDPOINT = "https://add-note-b52ovbio5q-uc.a.run.app";
const LOG_NOTE_ENDPOINT = "https://log-note-b52ovbio5q-uc.a.run.app";
const REMOVE_NOTE_ENDPOINT = "https://remove-note-b52ovbio5q-uc.a.run.app";

const notesGrid = document.getElementById("notes-grid");
const noteTemplate = document.getElementById("note-template");
const emptyState = document.getElementById("notes-empty");
const subtitle = document.getElementById("journal-subtitle");
const addNoteButton = document.getElementById("add-note-button");
const noteModal = document.getElementById("note-modal");
const noteTitleInput = document.getElementById("note-title");
const noteTextInput = document.getElementById("note-text");
const noteSaveButton = document.getElementById("note-save");
const noteCloseButton = document.getElementById("note-close");

let currentNoteId = null;
let isViewing = false;

const setText = (node, value) => {
    if (node) node.textContent = value;
};

const convertUnixToFullDate = (timestamp) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
    });
};

const getNotesArray = (notes = {}) =>
    Object.entries(notes).map(([id, note]) => ({ id, ...note }));

const sortNotesByDate = (notes) =>
    [...notes].sort((a, b) => (b.date || 0) - (a.date || 0));

const toggleModal = (isOpen) => {
    if (!noteModal) return;
    noteModal.hidden = !isOpen;
};

const openEditor = (note) => {
    if (note) {
        isViewing = true;
        currentNoteId = note.id;
        noteTitleInput.value = note.title || "";
        noteTextInput.value = note.text || "";
    } else {
        isViewing = false;
        currentNoteId = null;
        noteTitleInput.value = "";
        noteTextInput.value = "";
    }
    toggleModal(true);
};

const closeEditor = () => {
    toggleModal(false);
};

const renderEmptyState = (isVisible) => {
    if (!emptyState) return;
    emptyState.hidden = !isVisible;
};

const renderNotes = (notes) => {
    if (!notesGrid || !noteTemplate) return;
    notesGrid.innerHTML = "";

    if (!notes.length) {
        renderEmptyState(true);
        return;
    }

    renderEmptyState(false);
    const fragment = document.createDocumentFragment();

    notes.forEach((note) => {
        const card = noteTemplate.content.firstElementChild.cloneNode(true);
        const title = card.querySelector(".note-title");
        const date = card.querySelector(".note-date");
        const preview = card.querySelector(".note-preview");
        const deleteButton = card.querySelector(".note-delete");

        title.textContent = note.title || "Untitled note";
        date.textContent = note.date
            ? convertUnixToFullDate(note.date)
            : "—";
        preview.textContent = (note.text || "—").slice(0, 160);

        card.addEventListener("click", () => openEditor(note));
        deleteButton.addEventListener("click", async (event) => {
            event.stopPropagation();
            await removeNote(note.id);
            await loadNotes();
        });

        fragment.appendChild(card);
    });

    notesGrid.appendChild(fragment);
};

const getToken = async () =>
    window.getAuthToken ? await window.getAuthToken() : null;

const addNote = async () => {
    const token = await getToken();
    if (!token) return null;
    const response = await fetch(ADD_NOTE_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            token,
            title: noteTitleInput.value,
        }),
    });
    return response.text();
};

const logNote = async (noteId) => {
    const token = await getToken();
    if (!token) return;
    await fetch(LOG_NOTE_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            token,
            noteIndex: noteId,
            text: noteTextInput.value,
        }),
    });
};

const removeNote = async (noteId) => {
    const token = await getToken();
    if (!token) return;
    await fetch(REMOVE_NOTE_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            token,
            noteIndex: noteId,
        }),
    });
};

const loadNotes = async () => {
    const account = window.getAccountData
        ? await window.getAccountData()
        : null;
    if (!account) {
        renderEmptyState(true);
        setText(subtitle, "—");
        return;
    }
    const notes = sortNotesByDate(getNotesArray(account?.notes || {}));
    renderNotes(notes);
    setText(subtitle, `${notes.length} notes`);
};

addNoteButton?.addEventListener("click", () => openEditor(null));
noteCloseButton?.addEventListener("click", closeEditor);
noteModal?.addEventListener("click", (event) => {
    if (event.target === noteModal) {
        closeEditor();
    }
});

noteSaveButton?.addEventListener("click", async () => {
    if (!noteTextInput.value.trim()) {
        closeEditor();
        return;
    }

    if (!isViewing) {
        const noteId = await addNote();
        await logNote(noteId);
    } else if (currentNoteId) {
        await logNote(currentNoteId);
    }

    closeEditor();
    await loadNotes();
});

loadNotes();

