// Configuração do Supabase (substitua com suas credenciais)
const SUPABASE_URL = 'https://ryvfiwsnmdqsmzmusnxg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5dmZpd3NubWRxc216bXVzbnhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1OTIyODcsImV4cCI6MjA3MzE2ODI4N30.vbrq6R632vPRmcMsbPiFD6DwhIw-WP5jRPArbv4Qzgo';

// Inicializar o cliente Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Alternar visibilidade da senha
document.getElementById('alternarSenha').addEventListener('click', function () {
    const senhaInput = document.getElementById('senha');
    const tipo = senhaInput.getAttribute('type') === 'password' ? 'text' : 'password';
    senhaInput.setAttribute('type', tipo);
    this.classList.toggle('fa-eye');
    this.classList.toggle('fa-eye-slash');
});

// Criar conta com email e senha
document.getElementById('formLogin').addEventListener('submit', async function (e) {
    e.preventDefault();

    const email = document.getElementById('email').value.trim();
    const senha = document.getElementById('senha').value;

    // Validações
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
        alert('Por favor, insira um e-mail válido.');
        return;
    }

    if (!senha) {
        alert('Por favor, digite sua senha.');
        return;
    }

    try {
        // Tentar fazer login com email e senha
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: senha
        });

        if (error) {
            console.error('Erro ao fazer login:', error);
            alert('Erro ao fazer login: ' + error.message);
            return;
        }

        console.log('Usuário logado:', data.user);
        window.location.href = '../index.html';  // Redireciona para o dashboard após o login
    } catch (error) {
        console.error('Erro ao fazer login:', error);
        alert('Erro ao fazer login: ' + error.message);
    }
});

// Login com Google
document.getElementById('btnGoogle').addEventListener('click', async function () {
    try {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin + '/dashboard'  // Redireciona para o dashboard após o login com Google
            }
        });

        if (error) {
            console.error('Erro no login com Google:', error);
            alert('Erro no login com Google: ' + error.message);
        }
    } catch (error) {
        console.error('Erro no login com Google:', error);
        alert('Erro no login com Google: ' + error.message);
    }
});
