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

 document.getElementById('alternarConfirmarSenha').addEventListener('click', function () {
     const senhaInput = document.getElementById('confirmarSenha');
     const tipo = senhaInput.getAttribute('type') === 'password' ? 'text' : 'password';
     senhaInput.setAttribute('type', tipo);
     this.classList.toggle('fa-eye');
     this.classList.toggle('fa-eye-slash');
 });

 // Criar conta com email e senha
 document.getElementById('formCriarConta').addEventListener('submit', async function (e) {
     e.preventDefault();

     const nome = document.getElementById('nome').value.trim();
     const email = document.getElementById('email').value.trim();
     const senha = document.getElementById('senha').value;
     const confirmarSenha = document.getElementById('confirmarSenha').value;

     // Validações
     if (!nome) {
         alert('Por favor, digite seu nome completo.');
         return;
     }

     if (!email) {
         alert('Por favor, digite seu endereço de e-mail.');
         return;
     }

     if (senha !== confirmarSenha) {
         alert('As senhas não coincidem.');
         return;
     }

     if (senha.length < 6) {
         alert('A senha deve ter pelo menos 6 caracteres.');
         return;
     }

     try {
         // Criar usuário no Supabase Auth
         const { data, error } = await supabase.auth.signUp({
             email: email,
             password: senha,
             options: {
                 data: {
                     full_name: nome
                 }
             }
         });

         if (error) {
             console.error('Erro ao criar conta:', error);
             alert('Erro ao criar conta: ' + error.message);
             return;
         }

         console.log('Conta criada:', data.user);
         alert('Conta criada com sucesso! Verifique seu e-mail para confirmar sua conta.');
         window.location.href = '../conta/conta.html';
     } catch (error) {
         console.error('Erro ao criar conta:', error);
         alert('Erro ao criar conta: ' + error.message);
     }
 });

 // Login com Google
 document.getElementById('btnGoogle').addEventListener('click', async function () {
     try {
         const { data, error } = await supabase.auth.signInWithOAuth({
             provider: 'google',
             options: {
                 redirectTo: window.location.origin + '/index.html'
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