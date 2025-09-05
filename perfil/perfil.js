document.addEventListener('DOMContentLoaded', function() {
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
    const menuOpcoes = document.querySelectorAll('.menu-opcao');
    const secoes = document.querySelectorAll('.conta-secao');
    const logoutBtn = document.getElementById('logout-btn');

    // Verificar autenticação
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            // Usuário logado
            await carregarDadosUsuario(user);
        } else {
            // Usuário não logado, redirecionar para login
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
                
                // Carregar foto de perfil se existir
                if (userData.photoURL) {
                    fotoPerfil.src = userData.photoURL;
                    fotoPerfil.style.display = 'block';
                    defaultAvatar.style.display = 'none';
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

    // Upload de foto de perfil
    fotoInput.addEventListener('change', async function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        // Verificar se é uma imagem
        if (!file.type.match('image.*')) {
            alert('Por favor, selecione apenas imagens.');
            return;
        }
        
        // Verificar tamanho do arquivo (máximo 1MB, igual ao mural)
        if (file.size > 1048576) {
            alert('A imagem não pode ser maior que 1MB!');
            return;
        }
        
        try {
            const user = auth.currentUser;
            if (!user) return;
            
            // Converter imagem para base64 (igual ao mural)
            const imageBase64 = await toBase64(file);
            
            // Atualizar a UI imediatamente
            fotoPerfil.src = imageBase64;
            fotoPerfil.style.display = 'block';
            defaultAvatar.style.display = 'none';
            
            // Salvar no Firestore
            await db.collection('users').doc(user.uid).update({
                photoURL: imageBase64
            });
            
            alert('Foto de perfil atualizada com sucesso!');
        } catch (error) {
            console.error('Erro ao fazer upload da imagem:', error);
            alert('Erro ao fazer upload da imagem.');
        }
    });

    // Função para converter arquivo em base64
    function toBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    }

    // Atualizar dados do usuário
    formDados.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        try {
            const user = auth.currentUser;
            if (!user) return;
            
            const novoNome = nomeCompletoInput.value.trim();
            
            if (!novoNome) {
                alert('Por favor, informe um nome.');
                return;
            }
            
            // Atualizar no Firestore
            await db.collection('users').doc(user.uid).update({
                name: novoNome
            });
            
            // Atualizar na UI
            nomeUsuario.textContent = novoNome;
            
            alert('Dados atualizados com sucesso!');
        } catch (error) {
            console.error('Erro ao atualizar dados:', error);
            alert('Erro ao atualizar dados.');
        }
    });

    // Alterar senha
    formSenha.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const senhaAtual = document.getElementById('senha-atual').value;
        const novaSenha = document.getElementById('nova-senha').value;
        const confirmarSenha = document.getElementById('confirmar-senha').value;
        
        // Validações
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
            
            // Reautenticar o usuário
            const credential = firebase.auth.EmailAuthProvider.credential(
                user.email, 
                senhaAtual
            );
            
            await user.reauthenticateWithCredential(credential);
            
            // Atualizar a senha
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
    logoutBtn.addEventListener('click', function() {
        auth.signOut()
            .then(() => {
                window.location.href = '../conta/conta.html';
            })
            .catch(error => {
                console.error('Erro ao fazer logout:', error);
                alert('Erro ao fazer logout.');
            });
    });
});
