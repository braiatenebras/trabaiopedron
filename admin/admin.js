// Config do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyAP_vlP5nyEaKrhJpGYbUmWkM74DNtDqdE",
    authDomain: "trabalhopedro-fb2e2.firebaseapp.com",
    projectId: "trabalhopedro-fb2e2",
    storageBucket: "trabalhopedro-fb2e2.appspot.com",
    messagingSenderId: "869516994571",
    appId: "1:869516994571:web:041efff8635ee3ed417f0e"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();

if (window.location.pathname.includes('admin.html')) {
    const usuariosContainer = document.getElementById("usuarios-container");

    auth.onAuthStateChanged(async (user) => {
        if (!user) {
            alert("Você precisa estar logado como admin!");
            window.location.href = "../index.html";
            return;
        }

        const userRef = db.collection("users").doc(user.uid);
        let userDoc = await userRef.get();

        if (!userDoc.exists) {
            await userRef.set({
                name: user.displayName || "Usuário",
                email: user.email,
                photoURL: user.photoURL || "",
                role: "user"
            });
            userDoc = await userRef.get();
        }

        const role = userDoc.data()?.role || "user";
        if (role !== "admin") {
            alert("Você não tem permissão de admin!");
            window.location.href = "../index.html";
            return;
        }

        carregarUsuarios();
    });

    async function carregarUsuarios() {
        const snapshot = await db.collection("users").get();
        usuariosContainer.innerHTML = "";

        snapshot.forEach(doc => {
            const data = doc.data();
            const card = document.createElement("div");
            card.classList.add("usuario-card");

            card.innerHTML = `
                <div class="usuario-info">
                    <img src="${data.photoURL || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png'}">
                    <div>
                        <strong>${data.name}</strong><br>
                        <span>${data.email}</span><br>
                        <span>Role: ${data.role}</span>
                    </div>
                </div>
                <div class="usuario-actions">
                    <button class="admin-btn">${data.role === "admin" ? "Remover Admin" : "Tornar Admin"}</button>
                    <button class="remover-btn">Excluir</button>
                </div>
            `;

            // Botão tornar/remover admin
            card.querySelector(".admin-btn").addEventListener("click", async () => {
                const novaRole = data.role === "admin" ? "user" : "admin";
                await db.collection("users").doc(doc.id).update({ role: novaRole });
                carregarUsuarios();
            });

            // Botão excluir usuário
            card.querySelector(".remover-btn").addEventListener("click", async () => {
                if (confirm(`Excluir usuário ${data.email}?`)) {
                    await db.collection("users").doc(doc.id).delete();
                    carregarUsuarios();
                }
            });

            usuariosContainer.appendChild(card);
        });
    }
}
