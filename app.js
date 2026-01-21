import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, doc, setDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth();
const db = getFirestore();

// Elements
const authDiv = document.getElementById("auth");
const chatDiv = document.getElementById("chat");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");

const loginBtn = document.getElementById("loginBtn");
const registerBtn = document.getElementById("registerBtn");
const logoutBtn = document.getElementById("logoutBtn");

const globalMessages = document.getElementById("globalMessages");
const globalInput = document.getElementById("globalInput");
const globalSend = document.getElementById("globalSend");

const dmUser = document.getElementById("dmUser");
const dmMessages = document.getElementById("dmMessages");
const dmInput = document.getElementById("dmInput");
const dmSend = document.getElementById("dmSend");

// Helper to make fake email
function fakeEmail(username) {
  return `${username}@chatapp.com`;
}

// Register
registerBtn.onclick = async () => {
  const username = usernameInput.value.trim();
  const password = passwordInput.value;

  if (!username || !password) return alert("Enter username + password");

  const email = fakeEmail(username);

  await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(auth.currentUser, { displayName: username });

  // Store username in Firestore
  await setDoc(doc(db, "users", auth.currentUser.uid), {
    username: username
  });
};

// Login
loginBtn.onclick = async () => {
  const username = usernameInput.value.trim();
  const password = passwordInput.value;
  const email = fakeEmail(username);

  await signInWithEmailAndPassword(auth, email, password);
};

// Logout
logoutBtn.onclick = async () => {
  await signOut(auth);
};

// Auth state
onAuthStateChanged(auth, user => {
  if (user) {
    authDiv.style.display = "none";
    chatDiv.style.display = "block";
    startGlobalChat();
  } else {
    authDiv.style.display = "block";
    chatDiv.style.display = "none";
  }
});

// Global Chat
function startGlobalChat() {
  const q = query(collection(db, "globalMessages"), orderBy("createdAt", "asc"));
  onSnapshot(q, snapshot => {
    globalMessages.innerHTML = "";
    snapshot.forEach(doc => {
      const data = doc.data();
      const div = document.createElement("div");
      div.className = "message";
      div.innerText = `${data.username}: ${data.text}`;
      globalMessages.appendChild(div);
    });
  });
}

globalSend.onclick = async () => {
  const text = globalInput.value;
  if (!text) return;

  await addDoc(collection(db, "globalMessages"), {
    username: auth.currentUser.displayName,
    text,
    createdAt: Date.now()
  });

  globalInput.value = "";
};

// Direct Message
dmSend.onclick = async () => {
  const toUser = dmUser.value.trim();
  const text = dmInput.value;
  if (!toUser || !text) return;

  const from = auth.currentUser.displayName;
  const id = [from, toUser].sort().join("_");

  await addDoc(collection(db, "dms", id, "messages"), {
    from,
    to: toUser,
    text,
    createdAt: Date.now()
  });

  dmInput.value = "";
};

function startDM() {
  const toUser = dmUser.value.trim();
  const from = auth.currentUser.displayName;
  const id = [from, toUser].sort().join("_");

  const q = query(collection(db, "dms", id, "messages"), orderBy("createdAt", "asc"));
  onSnapshot(q, snapshot => {
    dmMessages.innerHTML = "";
    snapshot.forEach(doc => {
      const data = doc.data();
      const div = document.createElement("div");
      div.className = "message";
      div.innerText = `${data.from}: ${data.text}`;
      dmMessages.appendChild(div);
    });
  });
}

dmUser.onchange = startDM;
