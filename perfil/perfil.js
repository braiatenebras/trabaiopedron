document.addEventListener('DOMContentLoaded', function () {
    // Elementos da interface
    const fotoInput = document.getElementById('foto-input');
    const fotoPerfil = document.getElementById('foto-perfil');
    const defaultAvatar = document.getElementById('default-avatar');
    const nomeUsuario = document.getElementById('nome-usuario');
    const emailUsuario = document.getElementById('email-usuario');
    const nomeCompletoInput = document.getElementById('nome-completo');
    const emailInput = document.getElementById('email');
    const formDados = document.getElementById('form-dados');
    const formSenha = document.getElementById('form-senha');
    const logoutBtn = document.getElementById('logout-btn');

    // Modal cropper
    const modalCrop = document.getElementById("modal-crop");
    const cropImage = document.getElementById("crop-image");
    const btnCrop = document.getElementById("btn-crop");
    const btnCancel = document.getElementById("btn-cancel");
    let cropper;

    // Verificar autenticação
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            await carregarDadosUsuario(user);
        } else {
            window.location.href = '../conta/conta.html';
        }
    });

    // Carregar dados do usuário
    async function carregarDadosUsuario(user) {
        try {
            const userDoc = await db.collection('users').doc(user.uid).get();

            if (userDoc.exists) {
                const userData = userDoc.data();

                // Preencher dados do usuário
                nomeUsuario.textContent = userData.name || 'Usuário';
                emailUsuario.textContent = user.email;
                nomeCompletoInput.value = userData.name || '';
                emailInput.value = user.email;

                // Foto
                if (userData.photoURL) {
                    fotoPerfil.src = userData.photoURL;
                    fotoPerfil.style.display = 'block';
                    defaultAvatar.style.display = 'none';

                    // Salvar no localStorage para mural/mensagens
                    localStorage.setItem('userPhotoURL', userData.photoURL);
                } else {
                    fotoPerfil.style.display = 'none';
                    defaultAvatar.style.display = 'block';
                }
            }
        } catch (error) {
            console.error('Erro ao carregar dados do usuário:', error);
            alert('Erro ao carregar dados do usuário.');
        }
    }

    // Upload de foto → abre modal com cropper
    fotoInput.addEventListener('change', function (e) {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.match('image.*')) {
            alert('Por favor, selecione apenas imagens.');
            return;
        }

        if (file.size > 1048576) {
            alert('A imagem não pode ser maior que 1MB!');
            return;
        }

        const imageURL = URL.createObjectURL(file);

        // Abrir modal
        modalCrop.style.display = "flex";
        cropImage.src = imageURL;

        // Resetar se já existir
        if (cropper) cropper.destroy();

        // Iniciar cropper
        cropper = new Cropper(cropImage, {
            aspectRatio: 1,
            viewMode: 1,
            autoCropArea: 1,
        });
    });

    // Botão cortar & salvar
    btnCrop.addEventListener("click", async () => {
        if (!cropper) return;

        const canvas = cropper.getCroppedCanvas({
            width: 300,
            height: 300,
        });

        const imageBase64 = canvas.toDataURL("image/png");

        try {
            const user = auth.currentUser;
            if (!user) return;

            // Atualizar UI
            fotoPerfil.src = imageBase64;
            fotoPerfil.style.display = 'block';
            defaultAvatar.style.display = 'none';

            // Atualizar no Firestore
            await db.collection("users").doc(user.uid).update({
                photoURL: imageBase64,
            });

            // Salvar no localStorage
            localStorage.setItem("userPhotoURL", imageBase64);

            alert("Foto de perfil atualizada com sucesso!");
        } catch (error) {
            console.error("Erro ao salvar imagem:", error);
            alert("Erro ao salvar imagem.");
        }

        // Fechar modal
        modalCrop.style.display = "none";
        cropper.destroy();
    });

    // Botão cancelar
    btnCancel.addEventListener("click", () => {
        modalCrop.style.display = "none";
        if (cropper) cropper.destroy();
    });

    // Atualizar dados do usuário
    formDados.addEventListener('submit', async function (e) {
        e.preventDefault();

        try {
            const user = auth.currentUser;
            if (!user) return;

            const novoNome = nomeCompletoInput.value.trim();

            if (!novoNome) {
                alert('Por favor, informe um nome.');
                return;
            }

            await db.collection('users').doc(user.uid).update({
                name: novoNome
            });

            nomeUsuario.textContent = novoNome;

            alert('Dados atualizados com sucesso!');
        } catch (error) {
            console.error('Erro ao atualizar dados:', error);
            alert('Erro ao atualizar dados.');
        }
    });

    // Alterar senha
    formSenha.addEventListener('submit', async function (e) {
        e.preventDefault();

        const senhaAtual = document.getElementById('senha-atual').value;
        const novaSenha = document.getElementById('nova-senha').value;
        const confirmarSenha = document.getElementById('confirmar-senha').value;

        if (novaSenha !== confirmarSenha) {
            alert('As senhas não coincidem.');
            return;
        }

        if (novaSenha.length < 6) {
            alert('A senha deve ter pelo menos 6 caracteres.');
            return;
        }

        try {
            const user = auth.currentUser;
            const credential = firebase.auth.EmailAuthProvider.credential(
                user.email,
                senhaAtual
            );

            await user.reauthenticateWithCredential(credential);
            await user.updatePassword(novaSenha);

            alert('Senha alterada com sucesso!');
            formSenha.reset();
        } catch (error) {
            console.error('Erro ao alterar senha:', error);
            if (error.code === 'auth/wrong-password') {
                alert('Senha atual incorreta.');
            } else {
                alert('Erro ao alterar senha.');
            }
        }
    });

    // Logout
    logoutBtn.addEventListener('click', function () {
        auth.signOut()
            .then(() => {
                localStorage.removeItem('userPhotoURL'); 
                window.location.href = '../conta/conta.html';
            })
            .catch(error => {
                console.error('Erro ao fazer logout:', error);
                alert('Erro ao fazer logout.');
            });
    });
});
