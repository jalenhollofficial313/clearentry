const notesFrame = document.getElementsByClassName("MainFrame_NotesFrame_SideBar_Title_Notes")
const notesTitle = document.getElementById("NotesTitle")
const notesDate = document.getElementById("NotesDate")
const notesText = document.getElementById("NotesText")
const addNote = document.getElementById("addNote")
const addNoteTitle = document.getElementById("addNoteTitle")

let currentNoteIndex
let currentNoteElement
let viewing = false

const isMobile = window.matchMedia("(max-width: 767px)").matches;

function convertUnixToFullDate(timestamp) {
  const date = new Date(timestamp * 1000); // Convert seconds → milliseconds
  const options = { month: 'long', day: 'numeric', year: 'numeric' };
  return date.toLocaleDateString('en-US', options); // Format: July 24, 2025
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function getNotesOrder(table) {

    const tableArray = Object.entries(table).map(([key, value]) => {
        return { ...value, id: key }; 
    });


    tableArray.sort((a, b) => b.date - a.date);
    return tableArray;
}

let client_server_debounce = false
async function loadingFrame(ms, text1, text2) {
    const loadingFrame = document.querySelector(".mainframe-loading");
    const loadingDiv = document.querySelector("#load-frame");
    const loadedFrame = document.querySelector("#loaded-frame");

    loadedFrame.style.display = "none"
    loadingDiv.style.display = "flex"
    loadingDiv.querySelector("p").innerHTML = text1
    loadingFrame.style.display = "block"
    await sleep(100)
    loadingFrame.style.transform = "translateY(0px)"
    while (client_server_debounce == true) {
        await sleep(100)
    }
    loadedFrame.style.display = "flex"
    loadingDiv.style.display = "none"
    loadedFrame.querySelector("p").innerHTML = text2
    await sleep(1000)
    loadingFrame.style.transform = "translateY(200px)"
    await sleep(700)
    loadingFrame.style.display = "block"
}

async function logNote(token, index) {

    const response = await fetch("https://log-note-b52ovbio5q-uc.a.run.app", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            token: token,
            noteIndex: index,
            text: document.querySelector("#view_text").value,
        })
    })

    const sucsess = await response.text()

    return sucsess
}

async function removeNote(token) {

    const response = await fetch("https://remove-note-b52ovbio5q-uc.a.run.app", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            token: token,
            noteIndex: currentNoteIndex,
        })
    })

    const sucsess = await response.text()

    return sucsess
}


async function add_Note(token) {
    const response = await fetch("https://add-note-b52ovbio5q-uc.a.run.app", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            token: token,
            title: document.querySelector("#view_title").value,
        })
    })

    const sucsess = await response.text()
    return sucsess
}

async function loadJournalEntries() {
    const journal_entries = clientData.result['notes']
    console.log(journal_entries)
    for (const entry in journal_entries) {
        const clone = document.querySelector(".copy-entry").cloneNode(true)
        clone.style.display = "block"

        clone.querySelector(".journal_entryTitle").innerHTML = journal_entries[entry].title
        clone.querySelector(".journal_entryText").innerHTML = journal_entries[entry].text

        clone.addEventListener("click", async function(params) {
            viewing = true
            currentNoteIndex = entry
            document.querySelector("#view_text").value = journal_entries[entry].text
            document.querySelector("#view_title").value = journal_entries[entry].title
            document.querySelector("#journal_view_frame").style.display = "block"
        })

        clone.querySelector(".journal-entryClose").addEventListener("click", async function(e) {
            e.stopPropagation();
            client_server_debounce = true
            loadingFrame(1000, "Deleteing note...", "Note Deleted.")
            currentNoteIndex = entry
            await removeNote(localStorage.getItem("token"))
            await updateClientData()
            client_server_debounce = false
            clone.remove()
        })

        document.querySelector(".journal-frame").appendChild(clone)
    }
}


async function journalINIT(params) {
    await getClientData()
    await sleep(100)
  
    loadJournalEntries()
}

document.addEventListener("DOMContentLoaded", () => {
    document.querySelector("#bar-icon").addEventListener("click", () => {
        console.log("Check")
        document.querySelector("#sidebar").style.display = "block";
    });

    document.querySelector("#add_note_button").addEventListener("click", async function() {
        document.querySelector("#view_text").value = ""
        document.querySelector("#view_title").value = ""

        document.querySelector("#journal_view_frame").style.display = "block"
    })
    document.querySelector("#view_close").addEventListener("click", async function() {
        document.querySelector("#journal_view_frame").style.display = "none"
        if (viewing == true) {
            viewing = false
        }
    })
    document.querySelector("#view_save").addEventListener("click", async function(params) {
        client_server_debounce = true
        loadingFrame(1000, "Saving note...", "Note Saved.")
        if (viewing == false) {
            const noteToken = await add_Note(localStorage.getItem("token"))
            const noteSave = await logNote(localStorage.getItem("token"), noteToken,)
            await updateClientData()            
        } else {
            const noteSave = await logNote(localStorage.getItem("token"), currentNoteIndex)
            await updateClientData()     
        }

        client_server_debounce = false
        await sleep(500)
        document.querySelector("#journal_view_frame").style.display = "none"
    })

});

journalINIT()