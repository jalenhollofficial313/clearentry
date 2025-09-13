const notesFrame = document.getElementsByClassName("MainFrame_NotesFrame_SideBar_Title_Notes")
const notesTitle = document.getElementById("NotesTitle")
const notesDate = document.getElementById("NotesDate")
const notesText = document.getElementById("NotesText")
const addNote = document.getElementById("addNote")
const addNoteTitle = document.getElementById("addNoteTitle")

let currentNoteIndex

function convertUnixToFullDate(timestamp) {
  const date = new Date(timestamp * 1000); // Convert seconds → milliseconds
  const options = { month: 'long', day: 'numeric', year: 'numeric' };
  return date.toLocaleDateString('en-US', options); // Format: July 24, 2025
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function getData(token) {
    const response = await fetch("https://get-accountdata-b52ovbio5q-uc.a.run.app", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            token: token
        })
    })

    const clientData = await response.json()

    return clientData
}

async function getNotesOrder(table) {

    const tableArray = Object.entries(table).map(([key, value]) => {
        return { ...value, id: key }; 
    });


    tableArray.sort((a, b) => b.date - a.date);
    return tableArray;
}



async function loadNotes() {
    clientData = await getData(localStorage.getItem("token"))
    let ran = false
    let table = await getNotesOrder(clientData['notes'])
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

        journalButtonFrame.addEventListener("click", function(){
            document.getElementsByClassName("note-selected")[0].classList.remove("note-selected")
            journalButtonFrame.classList.add("note-selected")
            notesTitle.innerHTML = table[i]['title']
            notesDate.innerHTML = convertUnixToFullDate(table[i]['date'])
            notesText.value = table[i]['text']

            currentNoteIndex = table[i]["id"]
        })

        notesFrame[0].appendChild(journalButtonFrame)
    }
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

async function notesCheck() {
    while (true) {
        if (currentNoteIndex) {
            clientData = await getData(localStorage.getItem("token"))
            if (notesText.value != clientData['notes'][currentNoteIndex]['text']) {
                logged = await logNote(localStorage.getItem("token"))
            }
        }

        await sleep(5000)
    }
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

async function journalINIT(params) {
    loaded = await loadNotes()
    notesCheck()
}

async function removeNotes() {
    let noteFrame = document.getElementsByClassName("MainFrame_NotesFrame_SideBar_Title_Notes_NoteFrame")
    while (noteFrame.length > 0) {
        notesFrame[0].removeChild(noteFrame[0])
    }

    return true
}



addNote.addEventListener("click", async function(){
    sucsess = await add_Note(localStorage.getItem("token"))
    if (sucsess) {
        removed = await removeNotes()
        loaded = await loadNotes()
    }
})

journalINIT()