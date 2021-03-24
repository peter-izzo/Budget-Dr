/* eslint-disable no-unused-vars */
/* eslint-disable no-use-before-define */

// Warning for old unsupported browsers
if (!window.indexedDB) {
    alert("Your browser doesn't support a stable version of IndexedDB. Offline transactions will not be available.");
}

const request = indexedDB.open("budget", 1); // create a new db request for a "budget" database.
let db;

request.onupgradeneeded = event => {
    // create object store called "pending" and set autoIncrement to true
    db = request.result;
    db.createObjectStore("pending", { autoIncrement: true });
};

request.onsuccess = event =>{
    db = request.result;
    // check if app is online before reading from db
    if (navigator.onLine) {
        checkDatabase();
    }
};

request.onerror = function(event) {
    console.log("Database error: " + event.target.errorCode);
};

function checkDatabase() {
    db = request.result;
    let transaction = db.transaction(["pending"], "readwrite"); // open a transaction on your pending db
    let store = transaction.objectStore("pending"); // access your pending object store
    const getAll = store.getAll(); // get all records from store and set to a variable

    getAll.onsuccess = () => {
        if (getAll.result.length > 0) {
            fetch("/api/transaction/bulk", {
                method: "POST",
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: "application/json, text/plain, */*",
                    "Content-Type": "application/json"
                }
            })
            .then(response => response.json())
            .then(() => {
                // if successful, open a transaction on your pending db
                transaction = db.transaction(["pending"], "readwrite");
                // access your pending object store
                store = transaction.objectStore("pending");
                // clear all items in your store
                store.clear();
            });
        }
    };
}

function saveRecord(record) {
    db = request.result;
    let transaction = db.transaction(["pending"], "readwrite"); // create a transaction on the pending db with readwrite access
    let store = transaction.objectStore("pending"); // access your pending object store
    store.add(record); // add record to your store with add method.
}

// listen for app coming back online
window.addEventListener("online", checkDatabase);