import React, { useRef, useState } from "react";

import "firebase/auth";
import "firebase/firestore";
import firebase from "firebase/app";

import { useAuthState } from "react-firebase-hooks/auth";
import { useCollectionData } from "react-firebase-hooks/firestore";

import "./App.css";

firebase.initializeApp({
  apiKey: process.env.REACT_APP_API_KEY,
  authDomain: process.env.REACT_APP_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_PROJECT_ID,
  storageBucket: process.env.REACT_APP_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_APP_ID,
});

const auth = firebase.auth();
const firestore = firebase.firestore();

function App() {
  const [user] = useAuthState(auth);

  return (
    <div className="App">
      <header>
        <h1 className="brand">ChatRoom</h1>
        <SignOut />
      </header>

      <section className={user ? "chatroom" : "signIn"}>
        {user ? <ChatRoom /> : <SignIn />}
      </section>
    </div>
  );
}

function SignIn() {
  const signInWithGoogle = () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider);
  };

  return (
    <>
      <button className="sign-in" onClick={signInWithGoogle}>
        Sign in with Google
      </button>
      <p className="warning">
        ❗❗ Profanity or Indecency will lead to BAN ❗❗
      </p>
    </>
  );
}

function SignOut() {
  return auth.currentUser ? (
    <button className="sign-out" onClick={() => auth.signOut()}>
      Sign Out
    </button>
  ) : (
    <p className="fun">📱💻🎉</p>
  );
}

function ChatRoom() {
  const dummy = useRef();
  const messagesRef = firestore.collection("messages");
  const query = messagesRef.orderBy("createdAt").limit(25);

  const [messages] = useCollectionData(query, { idField: "id" });

  const [formValue, setFormValue] = useState("");

  const sendMessage = async (e) => {
    e.preventDefault();

    const sentMessage = formValue;
    setFormValue("");

    const { uid, photoURL, displayName } = auth.currentUser;

    await messagesRef.add({
      uid,
      photoURL,
      text: sentMessage,
      displayName: displayName.split(" ")[0],
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });

    dummy.current.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <main>
        {messages &&
          messages.map((msg) => <ChatMessage key={msg.id} message={msg} />)}

        <span ref={dummy}></span>
      </main>

      <form onSubmit={sendMessage}>
        <input
          value={formValue}
          onChange={(e) => setFormValue(e.target.value)}
          placeholder="Enter your message here..."
        />

        <button type="submit" disabled={!formValue}>
          Send
        </button>
      </form>
    </>
  );
}

function ChatMessage(props) {
  const { text, uid, displayName, photoURL, createdAt } = props.message;

  const messageClass = uid === auth.currentUser.uid ? "sent" : "received";

  let time = new Date();
  if (createdAt) {
    time = new Date(createdAt.seconds * 1000);
  }
  time = time.toTimeString().split(":");
  const sentAt = time[0] + ":" + time[1];

  let username;
  if (displayName) {
    username =
      displayName.charAt(0).toUpperCase() +
      displayName.substring(1, displayName.length).toLowerCase();
  }

  return (
    <>
      <div className={`message ${messageClass}`}>
        <img
          src={photoURL || "https://api.hello-avatar.com/adorables/avatars/10"}
          alt="User"
          className="avatar"
        />
        <div className="msg-wrapper">
          <p className="msg">{text}</p>
          <div className="msg-info">
            <p>
              {username || "Anon"} - {sentAt}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
