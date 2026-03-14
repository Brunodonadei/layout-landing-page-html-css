const CURSOS_POR_PAGINA = 6;
const META_CURSOS = 10;

const CATEGORIA_CONFIG = {
  permacultura: { emoji: "🌿", label: "Permacultura" },
  apicultura: { emoji: "🍯", label: "Apicultura" },
  bioconstrucao: { emoji: "🏡", label: "Bioconstrução" },
  agroecologia: { emoji: "🌱", label: "Agroecologia" },
  fitoterapia: { emoji: "🌸", label: "Fitoterapia" },
};

const NIVEL_CONFIG = {
  iniciante: { label: "Iniciante", badge: "badge-iniciante" },
  intermediario: { label: "Intermediário", badge: "badge-intermediario" },
  avancado: { label: "Avançado", badge: "badge-avancado" },
};

let cursos = [];
let paginaAtual = 1;
let filtroAtual = "todos";
let editandoId = null;

document.addEventListener("DOMContentLoaded", () => {
  initPopovers();
  initFormValidation();
  initRangeLabel();
  initDropdownFiltro();
  initBtnSalvar();
  initBtnDeletar();
  initScrollspy();

  setTimeout(() => {
    document.getElementById("spinnerArea").style.display = "none";
    document.getElementById("cursosGrid").style.removeProperty("display");
    renderCursos();
    renderCategorias();
    updateStats();
  }, 1200);
});

function initScrollspy() {
  document.querySelectorAll('a[href^="#secao"]').forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const target = document.querySelector(link.getAttribute("href"));
      if (target) {
        const offset = 80;
        const top =
          target.getBoundingClientRect().top + window.pageYOffset - offset;
        window.scrollTo({ top, behavior: "smooth" });
      }
      const oc = bootstrap.Offcanvas.getInstance(
        document.getElementById("offcanvasMenu"),
      );
      if (oc) oc.hide();

      document
        .querySelectorAll(".offcanvas-link")
        .forEach((l) => l.classList.remove("active"));
      document
        .querySelectorAll(
          `.offcanvas-link[href="${link.getAttribute("href")}"]`,
        )
        .forEach((l) => l.classList.add("active"));
    });
  });
}

function initPopovers() {
  document.querySelectorAll("[data-bs-toggle-popover]").forEach((el) => {
    new bootstrap.Popover(el, {
      trigger: "hover focus",
      placement: "bottom",
      container: "body",
    });
  });
}

function initRangeLabel() {
  const range = document.getElementById("cursoTeorica");
  const label = document.getElementById("teoricaVal");
  range.addEventListener("input", () => {
    label.textContent = range.value;
  });
}

function initDropdownFiltro() {
  document
    .querySelectorAll("#dropdownFiltro .dropdown-item")
    .forEach((item) => {
      item.addEventListener("click", (e) => {
        e.preventDefault();
        document
          .querySelectorAll("#dropdownFiltro .dropdown-item")
          .forEach((i) => i.classList.remove("active"));
        item.classList.add("active");
        filtroAtual = item.dataset.cat;
        paginaAtual = 1;
        renderCursos();
      });
    });
}

function initFormValidation() {
  document
    .getElementById("modalCurso")
    .addEventListener("hidden.bs.modal", () => {
      resetForm();
    });
}

function resetForm() {
  const form = document.getElementById("formCurso");
  form.reset();
  form.classList.remove("was-validated");
  document.getElementById("cursoEditId").value = "";
  document.getElementById("modalCursoLabel").textContent =
    "Adicionar Novo Curso";
  document.getElementById("teoricaVal").textContent = "50";
  editandoId = null;
}

function initBtnSalvar() {
  document.getElementById("btnSalvarCurso").addEventListener("click", () => {
    const form = document.getElementById("formCurso");
    form.classList.add("was-validated");
    if (!form.checkValidity()) return;

    const id = document.getElementById("cursoEditId").value;
    const curso = coletarDadosForm();

    if (id) {
      const idx = cursos.findIndex((c) => c.id === id);
      if (idx !== -1) {
        cursos[idx] = { ...cursos[idx], ...curso };
      }
      showToast("success", `Curso "${curso.nome}" atualizado com sucesso!`);
      addAtividade("gold", `Curso editado: ${curso.nome}`);
    } else {
      curso.id = "c_" + Date.now();
      cursos.push(curso);
      showToast("success", `Curso "${curso.nome}" adicionado com sucesso!`);
      addAtividade("green", `Novo curso: ${curso.nome}`);
    }

    bootstrap.Modal.getInstance(document.getElementById("modalCurso")).hide();
    paginaAtual = 1;
    renderCursos();
    renderCategorias();
    updateStats();
    showAlert(
      "success",
      `✅ Curso <strong>${escHtml(curso.nome)}</strong> salvo com sucesso.`,
    );
  });
}

function coletarDadosForm() {
  const recursos = [];
  if (document.getElementById("chkCertificado").checked)
    recursos.push("Certificado");
  if (document.getElementById("chkMaterial").checked)
    recursos.push("Material PDF");
  if (document.getElementById("chkAoVivo").checked)
    recursos.push("Aulas ao vivo");
  if (document.getElementById("chkForum").checked) recursos.push("Fórum");

  return {
    nome: document.getElementById("cursoNome").value.trim(),
    categoria: document.getElementById("cursoCategoria").value,
    nivel: document.getElementById("cursoNivel").value,
    duracao: document.getElementById("cursoDuracao").value,
    preco: document.getElementById("cursoPreco").value,
    descricao: document.getElementById("cursoDescricao").value.trim(),
    teorica: document.getElementById("cursoTeorica").value,
    destaque: document.getElementById("cursoDestaque").checked,
    recursos,
  };
}

let idParaDeletar = null;

function initBtnDeletar() {
  document
    .getElementById("btnConfirmarDeletar")
    .addEventListener("click", () => {
      if (!idParaDeletar) return;
      const curso = cursos.find((c) => c.id === idParaDeletar);
      cursos = cursos.filter((c) => c.id !== idParaDeletar);
      idParaDeletar = null;
      bootstrap.Modal.getInstance(
        document.getElementById("modalDeletar"),
      ).hide();
      if (paginaAtual > totalPaginas())
        paginaAtual = Math.max(1, totalPaginas());
      renderCursos();
      renderCategorias();
      updateStats();
      showToast("error", `Curso "${curso?.nome}" removido.`);
      addAtividade("red", `Curso removido: ${curso?.nome}`);
      showAlert(
        "warning",
        `🗑️ Curso <strong>${escHtml(curso?.nome)}</strong> removido.`,
      );
    });
}

function abrirModalDeletar(id) {
  idParaDeletar = id;
  const curso = cursos.find((c) => c.id === id);
  document.getElementById("deletarNome").textContent = curso?.nome || "";
  new bootstrap.Modal(document.getElementById("modalDeletar")).show();
}

function abrirModalEditar(id) {
  const curso = cursos.find((c) => c.id === id);
  if (!curso) return;

  resetForm();
  document.getElementById("cursoEditId").value = curso.id;
  document.getElementById("cursoNome").value = curso.nome;
  document.getElementById("cursoCategoria").value = curso.categoria;
  document.getElementById("cursoNivel").value = curso.nivel;
  document.getElementById("cursoDuracao").value = curso.duracao || "";
  document.getElementById("cursoPreco").value = curso.preco || "";
  document.getElementById("cursoDescricao").value = curso.descricao;
  document.getElementById("cursoTeorica").value = curso.teorica || 50;
  document.getElementById("teoricaVal").textContent = curso.teorica || 50;
  document.getElementById("cursoDestaque").checked = curso.destaque || false;

  document.getElementById("chkCertificado").checked =
    curso.recursos?.includes("Certificado") || false;
  document.getElementById("chkMaterial").checked =
    curso.recursos?.includes("Material PDF") || false;
  document.getElementById("chkAoVivo").checked =
    curso.recursos?.includes("Aulas ao vivo") || false;
  document.getElementById("chkForum").checked =
    curso.recursos?.includes("Fórum") || false;

  document.getElementById("modalCursoLabel").textContent = "Editar Curso";
  editandoId = id;
  new bootstrap.Modal(document.getElementById("modalCurso")).show();
}

function cursosFiltrados() {
  if (filtroAtual === "todos") return cursos;
  return cursos.filter((c) => c.categoria === filtroAtual);
}

function totalPaginas() {
  return Math.ceil(cursosFiltrados().length / CURSOS_POR_PAGINA);
}

function renderCursos() {
  const grid = document.getElementById("cursosGrid");
  const empty = document.getElementById("emptyState");
  const pag = document.getElementById("paginacaoArea");
  const lista = cursosFiltrados();

  if (lista.length === 0) {
    grid.innerHTML = "";
    empty.style.display = "";
    pag.style.display = "none";
    return;
  }

  empty.style.display = "none";
  const inicio = (paginaAtual - 1) * CURSOS_POR_PAGINA;
  const pagina = lista.slice(inicio, inicio + CURSOS_POR_PAGINA);

  grid.innerHTML = pagina.map((c) => renderCard(c)).join("");

  grid.querySelectorAll('[data-bs-toggle="popover"]').forEach((el) => {
    new bootstrap.Popover(el, {
      trigger: "hover focus",
      placement: "top",
      container: "body",
    });
  });

  renderPaginacao(lista.length);
}

function renderCard(c) {
  const cat = CATEGORIA_CONFIG[c.categoria] || {
    emoji: "📦",
    label: c.categoria,
  };
  const niv = NIVEL_CONFIG[c.nivel] || {
    label: c.nivel,
    badge: "badge-default",
  };
  const catBadge =
    `badge-${c.categoria}` in
    {
      "badge-permacultura": 1,
      "badge-apicultura": 1,
      "badge-bioconstrucao": 1,
      "badge-agroecologia": 1,
      "badge-fitoterapia": 1,
    }
      ? `badge-${c.categoria}`
      : "badge-default";
  const preco = c.preco
    ? `R$ ${parseFloat(c.preco).toFixed(2).replace(".", ",")}`
    : "Gratuito";
  const duracao = c.duracao ? `${c.duracao}h` : "—";
  const tags = (c.recursos || [])
    .map((r) => `<span class="collapse-tag">${escHtml(r)}</span>`)
    .join("");
  const destaqueIcon = c.destaque
    ? '<span title="Destaque" style="font-size:14px">⭐</span>'
    : "";

  return `
    <div class="col-sm-6 col-lg-4">
      <div class="curso-card">
        <div class="curso-card-header">
          <div style="display:flex;align-items:center;gap:10px">
            <span class="curso-emoji">${cat.emoji}</span>
            <div>
              <span class="curso-badge ${catBadge}">${cat.label}</span><br>
              <span class="curso-badge ${niv.badge} mt-1 d-inline-block" style="margin-top:4px">${niv.label}</span>
            </div>
          </div>
          ${destaqueIcon}
        </div>
        <div class="curso-card-body">
          <h5 class="curso-card-title">${escHtml(c.nome)}</h5>
          <div class="curso-card-meta">
            <span class="curso-meta-item">⏱ ${duracao}</span>
            <span class="curso-meta-item">💰 ${preco}</span>
            <span class="curso-meta-item">📊 ${c.teorica || 50}% teórico</span>
          </div>
        </div>
        <div class="curso-card-footer">
          <button
            class="btn btn-detalhe"
            data-bs-toggle="collapse"
            data-bs-target="#detalhe-${c.id}"
            aria-expanded="false"
            data-bs-toggle="popover"
            title="Ver Detalhes"
            data-bs-content="Expandir descrição completa do curso."
          >Ver Detalhes</button>
          <button class="btn btn-editar" onclick="abrirModalEditar('${c.id}')" title="Editar">✏️</button>
          <button class="btn btn-deletar" onclick="abrirModalDeletar('${c.id}')" title="Remover">🗑️</button>
        </div>
        <div class="collapse" id="detalhe-${c.id}">
          <div class="collapse-descricao">
            ${escHtml(c.descricao)}
            ${tags ? `<div class="collapse-tags">${tags}</div>` : ""}
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderPaginacao(total) {
  const pag = document.getElementById("paginacaoArea");
  const lista = document.getElementById("paginacaoLista");
  const tp = Math.ceil(total / CURSOS_POR_PAGINA);

  if (tp <= 1) {
    pag.style.display = "none";
    return;
  }
  pag.style.display = "";

  let html = `
    <li class="page-item ${paginaAtual === 1 ? "disabled" : ""}">
      <a class="page-link" href="#" onclick="irPagina(${paginaAtual - 1});return false">‹</a>
    </li>
  `;
  for (let i = 1; i <= tp; i++) {
    html += `<li class="page-item ${i === paginaAtual ? "active" : ""}">
      <a class="page-link" href="#" onclick="irPagina(${i});return false">${i}</a>
    </li>`;
  }
  html += `
    <li class="page-item ${paginaAtual === tp ? "disabled" : ""}">
      <a class="page-link" href="#" onclick="irPagina(${paginaAtual + 1});return false">›</a>
    </li>
  `;
  lista.innerHTML = html;
}

function irPagina(n) {
  const tp = totalPaginas();
  if (n < 1 || n > tp) return;
  paginaAtual = n;
  renderCursos();
  document
    .getElementById("secao-cursos")
    .scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderCategorias() {
  const grid = document.getElementById("categoriasGrid");
  const cats = Object.entries(CATEGORIA_CONFIG);

  grid.innerHTML = cats
    .map(([key, cfg]) => {
      const count = cursos.filter((c) => c.categoria === key).length;
      return `
      <div class="col-6 col-md-4">
        <div class="categoria-card">
          <span class="categoria-emoji">${cfg.emoji}</span>
          <div class="categoria-info">
            <h6>${cfg.label}</h6>
            <p>${count} curso${count !== 1 ? "s" : ""}</p>
          </div>
        </div>
      </div>
    `;
    })
    .join("");
}

function updateStats() {
  const total = cursos.length;
  document.getElementById("statTotal").textContent = total;
  document.getElementById("offcanvasTotal").textContent = total;

  const cats = new Set(cursos.map((c) => c.categoria)).size;
  document.getElementById("statCats").textContent = cats;

  const pct = Math.min(100, Math.round((total / META_CURSOS) * 100));
  const bar = document.getElementById("progressBar");
  bar.style.width = pct + "%";
  bar.setAttribute("aria-valuenow", pct);
  document.getElementById("progressPct").textContent = pct + "%";
  document.getElementById("progressMeta").textContent =
    `${total} de ${META_CURSOS} cursos cadastrados`;

  const niv = { iniciante: 0, intermediario: 0, avancado: 0 };
  cursos.forEach((c) => {
    if (niv[c.nivel] !== undefined) niv[c.nivel]++;
  });
  document.getElementById("relInitiante").textContent = niv.iniciante;
  document.getElementById("relInter").textContent = niv.intermediario;
  document.getElementById("relAvanc").textContent = niv.avancado;
  const maxNiv = Math.max(1, ...Object.values(niv));
  document.getElementById("barIniciante").style.width =
    (niv.iniciante / maxNiv) * 100 + "%";
  document.getElementById("barInter").style.width =
    (niv.intermediario / maxNiv) * 100 + "%";
  document.getElementById("barAvanc").style.width =
    (niv.avancado / maxNiv) * 100 + "%";
}

function showToast(type, msg) {
  const el = document.getElementById(
    type === "success" ? "toastSuccess" : "toastError",
  );
  const msgEl = document.getElementById(
    type === "success" ? "toastSuccessMsg" : "toastErrorMsg",
  );
  msgEl.textContent = msg;
  new bootstrap.Toast(el, { delay: 3500 }).show();
}

function showAlert(type, msg) {
  const area = document.getElementById("alertArea");
  const id = "alert_" + Date.now();
  const map = {
    success: "alert-success",
    warning: "alert-warning",
    danger: "alert-danger",
    info: "alert-info",
  };
  area.innerHTML = `
    <div class="alert ${map[type] || "alert-info"} alert-dismissible fade show" id="${id}" role="alert">
      ${msg}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Fechar"></button>
    </div>
  `;
  setTimeout(() => {
    const el = document.getElementById(id);
    if (el) {
      const a = bootstrap.Alert.getOrCreateInstance(el);
      a.close();
    }
  }, 5000);
}

function addAtividade(dot, msg) {
  const lista = document.getElementById("atividadeLista");
  const agora = new Date().toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const li = document.createElement("li");
  li.className = "atividade-item";
  li.innerHTML = `
    <span class="atividade-dot dot-${dot}"></span>
    <span>${escHtml(msg)}</span>
    <span class="atividade-time">${agora}</span>
  `;
  lista.insertBefore(li, lista.firstChild);
  while (lista.children.length > 8) lista.removeChild(lista.lastChild);
}

function escHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
