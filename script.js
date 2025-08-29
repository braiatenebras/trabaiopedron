// Elementos da interface
const formMensagem = document.getElementById("form-mensagem");
const mensagensContainer = document.getElementById("mensagens-container");
const loginRequired = document.getElementById("login-required");
const userInfo = document.getElementById("userInfo");
const btnLogin = document.getElementById("btnLogin");
const btnLogout = document.getElementById("btnLogout");
const btnLoginPage = document.getElementById("btnLoginPage");
const userHeader = document.querySelector(".user-header");

// Atualiza header para admin
async function atualizarHeaderAdmin(user) {
    const userDoc = await db.collection("users").doc(user.uid).get();
    const role = userDoc.data()?.role || "user";

    const existingBtn = document.getElementById("btnAdminPanel");
    if (existingBtn) existingBtn.remove();

    if (role === "admin") {
        const btnAdmin = document.createElement("button");
        btnAdmin.id = "btnAdminPanel";
        btnAdmin.innerHTML = '<i class="fas fa-cog"></i>';
        btnAdmin.classList.add("botao-admin");
        btnAdmin.title = "Painel Admin";
        btnAdmin.addEventListener("click", () => {
            window.location.href = "admin/admin.html";
        });
        userHeader.appendChild(btnAdmin);
    }
}

// Checar login
auth.onAuthStateChanged(async (user) => {
    if (user) {
        const userRef = db.collection("users").doc(user.uid);
        const doc = await userRef.get();

        if (!doc.exists) {
            await userRef.set({
                name: user.displayName || "Usuário",
                email: user.email,
                role: "user",
                photoURL: user.photoURL || "",
                tags: []
            });
        }

        const userPhoto = user.photoURL
            ? `<img src="${user.photoURL}" class="user-avatar" alt="Foto do perfil">`
            : '<i class="fas fa-user user-icon"></i>';

        userInfo.innerHTML = `${userPhoto} ${user.displayName || user.email}`;
        btnLogin.style.display = 'none';
        btnLogout.style.display = 'block';
        formMensagem.style.display = 'flex';
        loginRequired.style.display = 'none';

        await atualizarHeaderAdmin(user);
        carregarMensagens();
    } else {
        userInfo.textContent = "Visitante";
        btnLogin.style.display = 'block';
        btnLogout.style.display = 'none';
        formMensagem.style.display = 'none';
        loginRequired.style.display = 'block';
        mensagensContainer.innerHTML = "";
    }
});

// Adicionar mensagem
function adicionarMensagem(event) {
    event.preventDefault();
    const user = auth.currentUser;
    if (!user) return alert('Você precisa estar logado para enviar mensagens!');

    const texto = document.getElementById("mensagem").value.trim();
    if (!texto) return;

    db.collection("mensagens").add({
        uid: user.uid,
        nome: user.displayName || 'Usuário',
        email: user.email,
        fotoURL: user.photoURL || '',
        texto: texto,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => formMensagem.reset())
        .catch(error => {
            console.error("Erro ao enviar mensagem: ", error);
            alert("Erro ao enviar mensagem. Tente novamente.");
        });
}

// Renderizar mensagem com tags
async function renderizarMensagem(doc) {
    const data = doc.data();
    const autorDoc = await db.collection("users").doc(data.uid).get();
    const autorData = autorDoc.data() || {};

    const autorIsAdmin = autorData.role === "admin";
    const autorTags = autorData.tags || [];

    const tagsHTML = autorTags
        .filter(tag => tag && tag.nome)
        .map(tag => `<span class="tag-admin" style="background-color:${tag.color || '#ff9800'}">${tag.nome.toUpperCase()}</span>`)
        .join(" ");

    const fotoPerfil = data.fotoURL || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png';

    const currentUser = auth.currentUser;
    let podeExcluir = false;
    if (currentUser) {
        const currentUserDoc = await db.collection("users").doc(currentUser.uid).get();
        const currentRole = currentUserDoc.data()?.role || "user";
        podeExcluir = (currentUser.uid === data.uid || currentRole === "admin");
    }

    const botaoExcluir = podeExcluir
        ? `<button class="excluir-btn" onclick="excluirMensagem('${doc.id}')"><i class="fas fa-trash"></i></button>`
        : '';

    const dataFormatada = data.timestamp ? new Date(data.timestamp.toDate()).toLocaleString('pt-BR') : 'Agora mesmo';
    const tagAdmin = autorIsAdmin ? '<span class="tag-admin">ADMIN</span>' : '';

    const mensagemDiv = document.createElement("div");
    mensagemDiv.classList.add("mensagem");
    mensagemDiv.id = doc.id;

    mensagemDiv.innerHTML = `
        <div class="mensagem-cabecalho">
            <img src="${fotoPerfil}" alt="Foto de perfil" class="foto-perfil">
            <div class="mensagem-info">
                <h3>${data.nome} ${tagAdmin} ${tagsHTML}</h3>
                <div class="email">${data.email}</div>
            </div>
            ${botaoExcluir}
        </div>
        <div class="texto">${data.texto}</div>
        <div class="data">${dataFormatada}</div>
    `;

    mensagensContainer.appendChild(mensagemDiv);
}

// Excluir mensagem
function excluirMensagem(id) {
    if (confirm("Tem certeza que deseja excluir esta mensagem?")) {
        db.collection("mensagens").doc(id).delete()
            .then(() => console.log("Mensagem excluída com sucesso!"))
            .catch(error => {
                console.error("Erro ao excluir mensagem: ", error);
                alert("Erro ao excluir mensagem. Tente novamente.");
            });
    }
}

// Carregar mensagens
function carregarMensagens() {
    db.collection("mensagens").orderBy("timestamp", "desc").onSnapshot(snapshot => {
        mensagensContainer.innerHTML = "";
        snapshot.forEach(doc => renderizarMensagem(doc));
    }, error => {
        console.error("Erro ao carregar mensagens: ", error);
    });
}

// Event Listeners
formMensagem.addEventListener("submit", adicionarMensagem);
btnLogin.addEventListener("click", () => window.location.href = "conta/conta.html");
btnLoginPage.addEventListener("click", () => window.location.href = "conta/conta.html");
btnLogout.addEventListener("click", () => auth.signOut()
    .then(() => console.log("Usuário deslogado com sucesso"))
    .catch(error => {
        console.error("Erro ao fazer logout:", error);
        alert("Erro ao fazer logout. Tente novamente.");
    })
);
