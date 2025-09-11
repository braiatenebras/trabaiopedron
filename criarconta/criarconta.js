document.addEventListener('DOMContentLoaded', function () {
    const formCriarConta = document.getElementById('formLogin');
    const inputTelefone = document.getElementById('telefone');
    const telaLoading = document.getElementById('telaLoading');

    // formata o telefone automaticamente
    inputTelefone.addEventListener('input', function (e) {
        let value = e.target.value.replace(/\D/g, '');
        let formatted = '';
        if (value.length > 0) formatted = `(${value.substring(0, 2)}`;
        if (value.length > 2) formatted += `) ${value.substring(2, 7)}`;
        if (value.length > 7) formatted += `-${value.substring(7, 11)}`;

        e.target.value = formatted;
    });

    formCriarConta.addEventListener('submit', async function (e) {
        e.preventDefault();

        const nome = formCriarConta.querySelector('input[placeholder="Nome"]').value.trim();
        const email = formCriarConta.querySelector('input[type="email"]').value.trim();
        const senha = document.getElementById('senha').value;
        const confirmarSenha = document.getElementById('confirmarSenha').value;
        const telefone = inputTelefone.value.trim();

        // Validações
        if (!nome || !email || !senha || !confirmarSenha || !telefone) {
            mostrarMensagem('Preencha todos os campos.', 'erro');
            return;
        }

        if (senha !== confirmarSenha) {
            mostrarMensagem('As senhas não coincidem.', 'erro');
            return;
        }

        const phoneDigits = telefone.replace(/\D/g, '');
        if (phoneDigits.length < 10 || phoneDigits.length > 11) {
            mostrarMensagem('Telefone inválido. Insira o DDD corretamente.', 'erro');
            return;
        }

        // Exibe a tela de loading
        telaLoading.classList.add('ativo');

        try {
            // Criação do usuário no Supabase
            const { data, error } = await supabase.auth.signUp({
                email: email,
                password: senha
            });

            if (error) {
                throw error;
            }

            // Atualiza o nome de usuário no Supabase
            await supabase.auth.updateUser({ data: { nome: nome } });

            // Caso tenha sucesso, mostra a mensagem
            mostrarMensagem('Conta criada com sucesso!', 'sucesso', true);

        } catch (error) {
            telaLoading.classList.remove('ativo');
            let mensagem = 'Erro ao criar conta.';

            // Mensagens de erro específicas do Supabase
            if (error.message === 'Email already exists') {
                mensagem = 'E-mail já está em uso.';
            } else if (error.message === 'Invalid email') {
                mensagem = 'E-mail inválido.';
            } else if (error.message === 'Password too short') {
                mensagem = 'A senha deve ter pelo menos 6 caracteres.';
            }

            mostrarMensagem(mensagem, 'erro');
        }
    });

    // Função para mostrar a mensagem de sucesso ou erro
    function mostrarMensagem(texto, tipo, redirecionar = false) {
        const icone = tipo === 'erro' ? 'fa-exclamation-circle' : 'fa-check-circle';
        const div = document.createElement('div');

        div.className = `mensagem-${tipo}`;
        div.innerHTML = `
            <div class="mensagem-conteudo">
                <i class="fas ${icone}"></i>
                <p>${texto}</p>
            </div>
        `;

        document.body.appendChild(div);

        setTimeout(() => {
            div.classList.add('fade-out');
            setTimeout(() => {
                if (document.body.contains(div)) document.body.removeChild(div);
                if (tipo === 'sucesso' && redirecionar) {
                    window.location.href = '../index.html'; // Redireciona para a página principal
                }
            }, 500);
        }, 3000);
    }
});
