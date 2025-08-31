document.addEventListener('DOMContentLoaded', function () {
    // Elementos da conta
    const nameUsuario = document.getElementById('nome-usuario');
    const emailUsuario = document.getElementById('email-usuario');
    const nameCompletoInput = document.getElementById('nome-completo');
    const emailInput = document.getElementById('email');
    const logoutBtn = document.getElementById('logout-btn');
    const menuOpcoes = document.querySelectorAll('.menu-opcao');
    const conteudoSecoes = document.querySelectorAll('.conta-secao');
    const formDados = document.getElementById('form-dados');
    const formSenha = document.getElementById('form-senha');

    // Carrega e exibe os dados do usuário
    auth.onAuthStateChanged(async user => {
        if (user) {
            const userRef = db.collection('users').doc(user.uid);

            try {
                const doc = await userRef.get();

                if (doc.exists) {
                    updateUIWithUserData(user, doc.data());
                } else {
                    await userRef.set({
                        name: user.displayName || '',
                        email: user.email,
                        dataCriacao: firebase.firestore.FieldValue.serverTimestamp()
                    });
                    updateUIWithUserData(user);
                }
            } catch (error) {
                console.error("Erro ao carregar dados:", error);
                alert("Erro ao carregar dados do usuário");
            }
        } else {
            window.location.href = '../Login/login.html';
        }
    });

    function updateUIWithUserData(user, userData = null) {
        const displayName = userData?.name || user.displayName || 'Usuário';
        const email = userData?.email || user.email;

        nameUsuario.textContent = displayName;
        emailUsuario.textContent = email;
        nameCompletoInput.value = displayName;
        emailInput.value = email;
    }

    // ==================== EVENT LISTENERS DA CONTA ====================
    // Logout
    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        auth.signOut()
            .then(() => window.location.href = '../index.html')
            .catch(error => alert('Erro ao fazer logout: ' + error.message));
    });

    // Alternar entre seções
    menuOpcoes.forEach(opcao => {
        opcao.addEventListener('click', function () {
            const section = this.getAttribute('data-section');

            menuOpcoes.forEach(op => op.classList.remove('active'));
            this.classList.add('active');

            conteudoSecoes.forEach(sec => sec.classList.remove('active'));
            document.getElementById(`${section}-secao`).classList.add('active');
        });
    });

    // Salvar dados do usuário
    formDados.addEventListener('submit', async (e) => {
        e.preventDefault();
        const user = auth.currentUser;
        if (!user) return;

        try {
            await db.collection('users').doc(user.uid).update({
                name: nameCompletoInput.value,
                email: emailInput.value,
            });

            if (nameCompletoInput.value !== user.displayName) {
                await user.updateProfile({ displayName: nameCompletoInput.value });
            }

            if (emailInput.value !== user.email) {
                await user.updateEmail(emailInput.value);
            }

            alert('Dados atualizados com sucesso!');
            nameUsuario.textContent = nameCompletoInput.value;
        } catch (error) {
            console.error("Erro ao atualizar dados:", error);
            alert("Erro ao atualizar dados: " + error.message);
        }
    });

    // Alterar senha
    formSenha.addEventListener('submit', (e) => {
        e.preventDefault();

        const senhaAtual = document.getElementById('senha-atual').value;
        const novaSenha = document.getElementById('nova-senha').value;
        const confirmarSenha = document.getElementById('confirmar-senha').value;

        if (novaSenha !== confirmarSenha) {
            alert('As senhas não coincidem!');
            return;
        }

        const user = auth.currentUser;
        const credential = firebase.auth.EmailAuthProvider.credential(user.email, senhaAtual);

        user.reauthenticateWithCredential(credential)
            .then(() => user.updatePassword(novaSenha))
            .then(() => {
                alert('Senha alterada com sucesso!');
                formSenha.reset();
            })
            .catch(error => alert('Erro ao alterar senha: ' + error.message));
    });
});