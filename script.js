function adicionarMensagem(event) {
    event.preventDefault();

    const nome = document.getElementById("nome").value;
    const email = document.getElementById("email").value;
    const texto = document.getElementById("mensagem").value;

    mensagensRef.add({
        nome: nome,
        email: email,
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
    const container = document.getElementById("mensagens-container");
    const data = doc.data();

    const mensagemDiv = document.createElement("div");
    mensagemDiv.classList.add("mensagem");
    mensagemDiv.id = doc.id;

    const dataFormatada = data.timestamp ?
        new Date(data.timestamp.toDate()).toLocaleString('pt-BR') :
        'Agora mesmo';

    mensagemDiv.innerHTML = `
        <h3>
            ${data.nome}
            <button class="excluir-btn" onclick="excluirMensagem('${doc.id}')">
                <i class="fas fa-trash"></i>
            </button>
        </h3>
        <div class="email">${data.email}</div>
        <div class="texto">${data.texto}</div>
        <div class="data">${dataFormatada}</div>
    `;

    container.prepend(mensagemDiv);
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
        const container = document.getElementById("mensagens-container");
        const changes = snapshot.docChanges();

        if (changes.length === 0) {
            container.innerHTML = "";
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

document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("form-mensagem").addEventListener("submit", adicionarMensagem);

    carregarMensagens();
});