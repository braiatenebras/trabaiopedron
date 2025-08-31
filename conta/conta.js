// Configuração do Firebase
const auth = firebase.auth();

// Alternar visibilidade da senha
document.getElementById('alternarSenha').addEventListener('click', function () {
    const senhaInput = document.getElementById('senha');
    const tipo = senhaInput.getAttribute('type') === 'password' ? 'text' : 'password';
    senhaInput.setAttribute('type', tipo);

    // Alterar ícone
    this.classList.toggle('fa-eye');
    this.classList.toggle('fa-eye-slash');
});

// Login com email e senha
document.getElementById('formLogin').addEventListener('submit', function (e) {
    e.preventDefault();

    const email = document.getElementById('email').value.trim();
    const senha = document.getElementById('senha').value;

    if (!email) {
        alert('Por favor, digite seu endereço de e-mail.');
        return;
    }

    auth.signInWithEmailAndPassword(email, senha)
        .then((userCredential) => {
            const user = userCredential.user;
            console.log('Usuário logado:', user);
            alert('Login realizado com sucesso!');
            window.location.href = '../index.html';
        })
        .catch((error) => {
            console.error('Erro no login:', error);
            alert('Erro no login: ' + error.message);
        });
});

// Login com Google
document.getElementById('btnGoogle').addEventListener('click', function () {
    const provider = new firebase.auth.GoogleAuthProvider();

    auth.signInWithPopup(provider)
        .then((result) => {
            // Login com Google bem-
            const user = result.user;
            console.log('Usuário logado com Google:', user);
            alert('Login com Google realizado com sucesso!');
            window.location.href = '../index.html';
        })
        .catch((error) => {
            console.error('Erro no login com Google:', error);
            alert('Erro no login com Google: ' + error.message);
        });
});

// Verificar estado de autenticação
auth.onAuthStateChanged((user) => {
    if (user) {
        // Usuário está logado
        console.log('Usuário autenticado:', user);
        // Se já estiver logado, redirecionar para o mural
        if (window.location.pathname !== './index.html') {
            window.location.href = './index.html';
        }
    } else {
        // Usuário não está logado
        console.log('Usuário não autenticado');
    }
});

// Função para fazer logout (pode ser usada em outras páginas)
function fazerLogout() {
    auth.signOut()
        .then(() => {
            console.log('Usuário deslogado com sucesso');
            window.location.href = '../../index.html';
        })
        .catch((error) => {
            console.error('Erro ao fazer logout:', error);
        });
}