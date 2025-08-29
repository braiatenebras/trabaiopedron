// Configuração Firebase
const firebaseConfig = {
    apiKey: "AIzaSyAP_vlP5nyEaKrhJpGYbUmWkM74DNtDqdE",
    authDomain: "trabalhopedro-fb2e2.firebaseapp.com",
    projectId: "trabalhopedro-fb2e2",
    storageBucket: "trabalhopedro-fb2e2.firebasestorage.app",
    messagingSenderId: "869516994571",
    appId: "1:869516994571:web:041efff8635ee3ed417f0e"
};


firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const usuariosContainer = document.getElementById("usuarios-container");

// Checa se o usuário atual é admin
auth.onAuthStateChanged(async (user) => {
    if (!user) return alert("Você precisa estar logado como admin!");
    const doc = await db.collection("users").doc(user.uid).get();
    if (!doc.exists || doc.data().role !== "admin") {
        alert("Você não tem permissão de admin!");
        window.location.href = "../index.html";
        return;
    }
    carregarUsuarios();
});

// Função para listar usuários
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

        // Dar/remover admin
        const btnAdmin = card.querySelector(".admin-btn");
        btnAdmin.addEventListener("click", async () => {
            const novaRole = data.role === "admin" ? "user" : "admin";
            await db.collection("users").doc(doc.id).update({ role: novaRole });
            carregarUsuarios();
        });

        // Excluir usuário
        const btnRemover = card.querySelector(".remover-btn");
        btnRemover.addEventListener("click", async () => {
            if (confirm(`Excluir usuário ${data.email}?`)) {
                await db.collection("users").doc(doc.id).delete();
                carregarUsuarios();
            }
        });

        usuariosContainer.appendChild(card);
    });
}
