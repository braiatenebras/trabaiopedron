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
            const userId = doc.id;
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
                await db.collection("users").doc(userId).update({ role: novaRole });
                carregarUsuarios();
            });

            // Botão excluir usuário
            card.querySelector(".remover-btn").addEventListener("click", async () => {
                if (confirm(`Tem certeza que deseja excluir permanentemente o usuário ${data.email}? Todas as mensagens deste usuário também serão removidas.`)) {
                    try {
                        // Primeiro, excluir todas as mensagens do usuário
                        await excluirMensagensDoUsuario(userId);

                        // Depois, remover o usuário do Firestore
                        await db.collection("users").doc(userId).delete();

                        // Se for o próprio usuário logado, também remover da autenticação
                        const currentUser = auth.currentUser;
                        if (currentUser && currentUser.uid === userId) {
                            await currentUser.delete();
                            alert("Sua conta foi excluída com sucesso!");
                            window.location.href = "../index.html";
                        } else {
                            alert(`Usuário ${data.email} excluído com sucesso!`);
                        }

                        carregarUsuarios();
                    } catch (error) {
                        console.error("Erro ao excluir usuário:", error);
                        alert("Erro ao excluir usuário. Tente novamente.");
                    }
                }
            });

            usuariosContainer.appendChild(card);
        });
    }

    // Função para excluir todas as mensagens de um usuário
    async function excluirMensagensDoUsuario(userId) {
        try {
            // Buscar todas as mensagens do usuário
            const mensagensSnapshot = await db.collection("mensagens")
                .where("uid", "==", userId)
                .get();

            // Excluir cada mensagem
            const batch = db.batch();
            mensagensSnapshot.forEach(doc => {
                batch.delete(doc.ref);
            });

            // Executar a exclusão em lote
            await batch.commit();
            console.log(`Todas as mensagens do usuário ${userId} foram excluídas.`);
        } catch (error) {
            console.error("Erro ao excluir mensagens do usuário:", error);
            throw error;
        }
    }
}