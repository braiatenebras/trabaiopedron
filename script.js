
// Elementos da interface
const formMensagem = document.getElementById("form-mensagem");
const mensagensContainer = document.getElementById("mensagens-container");
const loginRequired = document.getElementById("login-required");
const userInfo = document.getElementById("userInfo");
const btnLogin = document.getElementById("btnLogin");
const btnLogout = document.getElementById("btnLogout");
const btnLoginPage = document.getElementById("btnLoginPage");

auth.onAuthStateChanged((user) => {
    if (user) {
        // Usuário está logado
        console.log('Usuário autenticado:', user);

        const userPhoto = user.photoURL ?
            `<img src="${user.photoURL}" class="user-avatar" alt="Foto do perfil">` :
            '<i class="fas fa-user user-icon"></i>';

        userInfo.innerHTML = `${userPhoto} ${user.displayName || user.email}`;

        btnLogin.style.display = 'none';
        btnLogout.style.display = 'block';
        formMensagem.style.display = 'flex';
        loginRequired.style.display = 'none';

        // Carregar mensagens
        carregarMensagens();
    } else {
        // Usuário não está logado
        console.log('Usuário não autenticado');
        userInfo.textContent = 'Visitante';
        btnLogin.style.display = 'block';
        btnLogout.style.display = 'none';
        formMensagem.style.display = 'none';
        loginRequired.style.display = 'block';
        mensagensContainer.innerHTML = '';
    }
});

function adicionarMensagem(event) {
    event.preventDefault();

    const user = auth.currentUser;
    if (!user) {
        alert('Você precisa estar logado para enviar mensagens!');
        return;
    }

    const texto = document.getElementById("mensagem").value.trim();
    if (!texto) return;

    mensagensRef.add({
        uid: user.uid,
        nome: user.displayName || 'Usuário',
        email: user.email,
        fotoURL: user.photoURL || '', // Salvar a URL da foto do perfil
        texto: texto,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    })
        .then(() => {
            document.getElementById("form-mensagem").reset();
            console.log("Mensagem enviada com sucesso!");
        })
        .catch((error) => {
            console.error("Erro ao enviar mensagem: ", error);
            alert("Erro ao enviar mensagem. Tente novamente.");
        });
}

function renderizarMensagem(doc) {
    const data = doc.data();
    const user = auth.currentUser;

    const mensagemDiv = document.createElement("div");
    mensagemDiv.classList.add("mensagem");
    mensagemDiv.id = doc.id;

    const dataFormatada = data.timestamp ?
        new Date(data.timestamp.toDate()).toLocaleString('pt-BR') :
        'Agora mesmo';

    // Botão de excluir apenas para o autor da mensagem
    const botaoExcluir = (user && user.uid === data.uid) ?
        `<button class="excluir-btn" onclick="excluirMensagem('${doc.id}')">
            <i class="fas fa-trash"></i>
        </button>` : '';

    // Obter a URL da foto do perfil (se disponível)
    const fotoPerfil = data.fotoURL || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png';

    mensagemDiv.innerHTML = `
        <div class="mensagem-cabecalho">
            <img src="${fotoPerfil}" alt="Foto de perfil" class="foto-perfil" onerror="this.src='https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png'">
            <div class="mensagem-info">
                <h3>
                    ${data.nome}
                    ${botaoExcluir}
                </h3>
                <div class="email">${data.email}</div>
            </div>
        </div>
        <div class="texto">${data.texto}</div>
        <div class="data">${dataFormatada}</div>
    `;

    mensagensContainer.prepend(mensagemDiv);
}

function excluirMensagem(id) {
    if (confirm("Tem certeza que deseja excluir esta mensagem?")) {
        mensagensRef.doc(id).delete()
            .then(() => {
                console.log("Mensagem excluída com sucesso!");
            })
            .catch((error) => {
                console.error("Erro ao excluir mensagem: ", error);
                alert("Erro ao excluir mensagem. Tente novamente.");
            });
    }
}

function carregarMensagens() {
    mensagensRef.orderBy("timestamp", "desc").onSnapshot((snapshot) => {
        const changes = snapshot.docChanges();

        if (changes.length === 0) {
            mensagensContainer.innerHTML = "";
            snapshot.forEach((doc) => {
                renderizarMensagem(doc);
            });
            return;
        }

        changes.forEach((change) => {
            if (change.type === "added") {
                renderizarMensagem(change.doc);
            } else if (change.type === "removed") {
                const elemento = document.getElementById(change.doc.id);
                if (elemento) {
                    elemento.remove();
                }
            }
        });
    }, (error) => {
        console.error("Erro ao carregar mensagens: ", error);
    });
}

// Event Listeners
formMensagem.addEventListener("submit", adicionarMensagem);

btnLogin.addEventListener("click", () => {
    window.location.href = "conta/conta.html";
});

btnLoginPage.addEventListener("click", () => {
    window.location.href = "conta/conta.html";
});

btnLogout.addEventListener("click", () => {
    auth.signOut()
        .then(() => {
            console.log("Usuário deslogado com sucesso");
        })
        .catch((error) => {
            console.error("Erro ao fazer logout:", error);
            alert("Erro ao fazer logout. Tente novamente.");
        });
});