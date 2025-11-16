const notesFrame = document.getElementsByClassName("MainFrame_NotesFrame_SideBar_Title_Notes")
const notesTitle = document.getElementById("NotesTitle")
const notesDate = document.getElementById("NotesDate")
const notesText = document.getElementById("NotesText")
const addNote = document.getElementById("addNote")
const addNoteTitle = document.getElementById("addNoteTitle")

let currentNoteIndex
let currentNoteElement

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



async function logNote(token) {

    const response = await fetch("https://log-note-b52ovbio5q-uc.a.run.app", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            token: token,
            noteIndex: currentNoteIndex,
            text: notesText.value,
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
            title: addNoteTitle.value,
        })
    })

    const sucsess = await response.text()
    return sucsess
}

async function removeNotes() {
    let noteFrame = document.querySelectorAll(".MainFrame_NotesFrame_SideBar_Title_Notes_NoteFrame")
    for (let i = 0; i < noteFrame.length; i++) {
        noteFrame[i].remove()
    }

    return true
}


async function loadNotes() {
    let ran = false
    let table = await getNotesOrder(clientData.result['notes'])
    for (let i in table) {
        const journalButtonFrame = document.createElement("div")
        journalButtonFrame.classList.add("MainFrame_NotesFrame_SideBar_Title_Notes_NoteFrame")

        if (ran == false) {
            ran = true
            journalButtonFrame.classList.add("note-selected")
            notesTitle.innerHTML = table[i]['title']
            notesDate.innerHTML = convertUnixToFullDate(table[i]['date'])
            notesText.value = table[i]['text']

            currentNoteIndex = table[i]["id"]
        }

        const journalTitle = document.createElement("p")
        journalTitle.classList.add("MainFrame_NotesFrame_SideBar_Title_Notes_NoteFrame_Title")
        journalTitle.classList.add("inter-text")
        journalTitle.innerHTML = table[i]['title']
        journalButtonFrame.appendChild(journalTitle)

        const journalDate = document.createElement("p")
        journalDate.classList.add("MainFrame_NotesFrame_SideBar_Title_Notes_NoteFrame_Date")
        journalDate.classList.add("inter-text")
        journalDate.innerHTML = convertUnixToFullDate(table[i]['date'])
        journalButtonFrame.appendChild(journalDate)

        journalButtonFrame.addEventListener("click", async function(){
            document.getElementsByClassName("note-selected")[0].classList.remove("note-selected")
            journalButtonFrame.classList.add("note-selected")
            notesTitle.innerHTML = table[i]['title']
            notesDate.innerHTML = convertUnixToFullDate(table[i]['date'])
            notesText.value = table[i]['text']

            if (isMobile) {
                document.querySelector("#notes-sidebar").style.display = "none"
            }

            currentNoteIndex = table[i]["id"]
            currentNoteElement = journalButtonFrame
        })

        notesFrame[0].appendChild(journalButtonFrame)
    }
}

async function journalINIT(params) {
    await getClientData()
    await sleep(100)
    

    loaded = await loadNotes()
}

async function delClientNote() {
    if (localStorage.getItem("token") != null) {
        if (clientData) {
            const request = window.indexedDB.open("clearentry", 3);
            request.onerror = (event) => {
                location.reload()
            }
            request.onsuccess = async (event) => {
                const db = event.target.result;

                if (db.objectStoreNames.contains("clientData")) {
                    const tx = db.transaction("clientData", "readwrite");
                    const store = tx.objectStore("clientData");
                    delete clientData.result['notes'][currentNoteIndex]
                    console.log(clientData.result['notes'])
                    store.put(clientData.result)
                    console.log(clientData.result['notes'])
                    tx.oncomplete = () => {
                        db.close();
                    }
                }
            }
        }
    }
}

document.querySelector("#delete-button").addEventListener("click", async function(params) {
    removeNote(localStorage.getItem("token"))
    await delClientNote()
    await removeNotes()
    await sleep(50)
    await loadNotes()
})

document.querySelector("#save-button").addEventListener("click", async function(params) {
    logNote(localStorage.getItem('token'))
    if (localStorage.getItem("token") != null) {
        if (clientData) {
            const request = window.indexedDB.open("clearentry", 3);
            request.onerror = (event) => {
                location.reload()
            }
            request.onsuccess = async (event) => {
                const db = event.target.result;

                if (db.objectStoreNames.contains("clientData")) {
                    const tx = db.transaction("clientData", "readwrite");
                    const store = tx.objectStore("clientData");
                    console.log(currentNoteIndex)
                    clientData.result['notes'][currentNoteIndex]['text'] = notesText.value
                    store.put(clientData.result)
                    tx.oncomplete = () => {
                        db.close();
                    }
                }
            }
        }
    }
})

addNote.addEventListener("click", async function(){
    currentNoteIndex = await add_Note(localStorage.getItem("token"))
    await init()
    location.reload()

    const title = addNoteTitle.value
    const date = Math.floor(Date.now() / 1000);

    const journalButtonFrame = document.createElement("div")
    journalButtonFrame.classList.add("MainFrame_NotesFrame_SideBar_Title_Notes_NoteFrame")
    document.getElementsByClassName("note-selected")[0].classList.remove("note-selected")
    journalButtonFrame.classList.add("note-selected")
    notesTitle.innerHTML = title
    notesDate.innerHTML = convertUnixToFullDate(date)
    notesText.value = ""

    const journalTitle = document.createElement("p")
    journalTitle.classList.add("MainFrame_NotesFrame_SideBar_Title_Notes_NoteFrame_Title")
    journalTitle.classList.add("inter-text")
    journalTitle.innerHTML = title
    journalButtonFrame.appendChild(journalTitle)

    const journalDate = document.createElement("p")
    journalDate.classList.add("MainFrame_NotesFrame_SideBar_Title_Notes_NoteFrame_Date")
    journalDate.classList.add("inter-text")
    journalDate.innerHTML = convertUnixToFullDate(date);
    journalButtonFrame.appendChild(journalDate)

    journalButtonFrame.addEventListener("click", async function(){
        document.getElementsByClassName("note-selected")[0].classList.remove("note-selected")
        journalButtonFrame.classList.add("note-selected")
        notesTitle.innerHTML = title
        notesDate.innerHTML = convertUnixToFullDate(date)
        notesText.value = ""

        if (isMobile) {
            document.querySelector("#notes-sidebar").style.display = "none"
        }
    })

    notesFrame[0].appendChild(journalButtonFrame)
})

document.addEventListener("DOMContentLoaded", () => {
  document.querySelector("#bar-click").addEventListener("click", () => {
    console.log("Check")
    document.querySelector("#sidebar").style.display = "block";
  });
  document.querySelector("#close-button").addEventListener("click", async function() {
    document.querySelector("#notes-sidebar").style.display = "block"
  })
});

journalINIT()