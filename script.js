// Configuração do Supabase (substitua com suas credenciais)
const SUPABASE_URL = 'https://ryvfiwsnmdqsmzmusnxg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5dmZpd3NubWRxc216bXVzbnhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1OTIyODcsImV4cCI6MjA3MzE2ODI4N30.vbrq6R632vPRmcMsbPiFD6DwhIw-WP5jRPArbv4Qzgo';

// Inicializar o cliente Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
    const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

    const role = data?.role || "user";

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
supabase.auth.onAuthStateChange(async (event, session) => {
    const user = session?.user;

    if (user) {
        // Verificar se o usuário já existe na tabela users
        const { data: userData, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();

        if (error || !userData) {
            // Criar usuário se não existir
            const { error: insertError } = await supabase
                .from('users')
                .insert([{
                    id: user.id,
                    name: user.user_metadata.full_name || "Usuário",
                    email: user.email,
                    role: "user",
                    photoURL: user.user_metadata.avatar_url || "",
                }]);

            if (insertError) {
                console.error("Erro ao criar usuário:", insertError);
            }
        }

        // Buscar dados do usuário
        const { data: userProfile, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();

        if (profileError) {
            console.error("Erro ao buscar perfil:", profileError);
        }

        const foto = userProfile?.photoURL || user.user_metadata.avatar_url || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png';
        const nome = userProfile?.name || user.user_metadata.full_name || user.email;

        userInfo.innerHTML = `<img src="${foto}" class="user-avatar" alt="Foto de perfil"> ${nome}`;

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

async function adicionarMensagem(event) {
    event.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return alert('Você precisa estar logado para enviar mensagens!');

    const texto = document.getElementById("mensagem").value.trim();
    const arquivo = document.getElementById("imagem").files[0];

    if (!texto && !arquivo) {
        return alert('Digite uma mensagem ou selecione uma imagem!');
    }

    let imagemBase64 = '';

    if (arquivo) {
        if (arquivo.size > 1048576) {
            return alert('A imagem não pode ser maior que 1MB!');
        }
        imagemBase64 = await toBase64(arquivo);
    }

    // Buscar dados do usuário
    const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

    if (userError) {
        console.error("Erro ao buscar dados do usuário:", userError);
    }

    const fotoPerfil = userData?.photoURL || user.user_metadata.avatar_url || '';
    const nome = userData?.name || user.user_metadata.full_name || 'Usuário';

    // Inserir mensagem no Supabase
    const { data, error } = await supabase
        .from('mensagens')
        .insert([{
            uid: user.id,
            nome: nome,
            email: user.email,
            photoURL: fotoPerfil,
            texto: texto,
            imagemBase64: imagemBase64,
            timestamp: new Date().toISOString()
        }])
        .select();

    if (error) {
        console.error("Erro ao enviar mensagem: ", error);
        alert("Erro ao enviar mensagem. Tente novamente.");
    } else {
        formMensagem.reset();
        document.getElementById('image-preview').style.display = 'none';
    }
}

// Função para converter arquivo para base64
function toBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

// Renderizar mensagem
async function renderizarMensagem(mensagem) {
    const data = mensagem;

    // Verificar se a mensagem tem timestamp válido
    if (!data.timestamp) {
        console.warn("Mensagem sem timestamp:", data.id);
        return;
    }

    const fotoPerfil = data.photoURL ||
        'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png';

    // Buscar dados extras do usuário (role)
    let autorData = { role: "user" };
    try {
        const { data: autor, error } = await supabase
            .from('users')
            .select('role')
            .eq('id', data.uid)
            .single();

        if (autor) autorData = autor;
    } catch (e) {
        console.error("Erro ao buscar dados do autor:", e);
    }

    const autorIsAdmin = autorData.role === "admin";

    const { data: { user } } = await supabase.auth.getUser();
    let podeExcluir = false;

    if (user) {
        const { data: currentUserData, error } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();

        const currentRole = currentUserData?.role || "user";
        podeExcluir = (user.id === data.uid || currentRole === "admin");
    }

    const botaoExcluir = podeExcluir
        ? `<button class="excluir-btn" onclick="excluirMensagem('${data.id}')"><i class="fas fa-trash"></i></button>`
        : '';

    const dataFormatada = data.timestamp ? new Date(data.timestamp).toLocaleString('pt-BR') : 'Agora mesmo';
    const tagAdmin = autorIsAdmin ? '<span class="tag-admin">ADMIN</span>' : '';

    const imagemHTML = data.imagemBase64
        ? `<div class="mensagem-imagem"><img src="${data.imagemBase64}" alt="Imagem da mensagem"></div>`
        : '';

    const mensagemDiv = document.createElement("div");
    mensagemDiv.classList.add("mensagem");
    mensagemDiv.id = data.id;
    mensagemDiv.setAttribute("data-timestamp", new Date(data.timestamp).getTime());

    mensagemDiv.innerHTML = `
           <div class="mensagem-cabecalho">
               <img src="${fotoPerfil}" alt="Foto de perfil" class="foto-perfil">
               <div class="mensagem-info">
                   <h3>${data.nome} ${tagAdmin} </h3>
                   <div class="email">${data.email}</div>
               </div>
               ${botaoExcluir}
           </div>
           <div class="texto">${data.texto}</div>
           ${imagemHTML}
           <div class="data">${dataFormatada}</div>
       `;

    const mensagens = Array.from(mensagensContainer.children);
    const novaMsgTimestamp = new Date(data.timestamp).getTime();

    let inserido = false;
    for (let i = 0; i < mensagens.length; i++) {
        const msgTimestamp = parseInt(mensagens[i].getAttribute("data-timestamp"));
        if (novaMsgTimestamp > msgTimestamp) {
            mensagensContainer.insertBefore(mensagemDiv, mensagens[i]);
            inserido = true;
            break;
        }
    }

    // Se não foi inserido antes, adiciona no final
    if (!inserido) {
        mensagensContainer.appendChild(mensagemDiv);
    }
}

// Excluir mensagem
async function excluirMensagem(id) {
    const { error } = await supabase
        .from('mensagens')
        .delete()
        .eq('id', id);

    if (error) {
        console.error("Erro ao excluir mensagem: ", error);
        alert("Erro ao excluir mensagem. Tente novamente.");
    } else {
        console.log("Mensagem excluída com sucesso!");
    }
}

function carregarMensagens() {
    // Configurar subscription para receber atualizações em tempo real
    const subscription = supabase
        .channel('mensagens-changes')
        .on('postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'mensagens'
            },
            async (payload) => {
                if (payload.eventType === 'INSERT') {
                    renderizarMensagem(payload.new);
                } else if (payload.eventType === 'DELETE') {
                    const msgDiv = document.getElementById(payload.old.id);
                    if (msgDiv) msgDiv.remove();
                }
            }
        )
        .subscribe();

    // Carregar mensagens existentes
    supabase
        .from('mensagens')
        .select('*')
        .order('timestamp', { ascending: false })
        .then(({ data, error }) => {
            if (error) {
                console.error("Erro ao carregar mensagens: ", error);
                return;
            }

            mensagensContainer.innerHTML = "";
            data.forEach(mensagem => {
                renderizarMensagem(mensagem);
            });
        });
}

// Event Listeners
formMensagem.addEventListener("submit", adicionarMensagem);
btnLogin.addEventListener("click", () => window.location.href = "conta/conta.html");
btnLoginPage.addEventListener("click", () => window.location.href = "conta/conta.html");
btnLogout.addEventListener("click", async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
        console.error("Erro ao fazer logout:", error);
        alert("Erro ao fazer logout. Tente novamente.");
    } else {
        console.log("Usuário deslogado com sucesso");
    }
});

// Preview da imagem
function previewImage(event) {
    const input = event.target;
    const preview = document.getElementById('preview');
    const imagePreview = document.getElementById('image-preview');

    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function (e) {
            preview.src = e.target.result;
            imagePreview.style.display = 'block';
        }
        reader.readAsDataURL(input.files[0]);
    }
}

// Remover imagem selecionada
function removeImage() {
    document.getElementById('imagem').value = '';
    document.getElementById('image-preview').style.display = 'none';
}