/* =============================================
   CESAR MODAS — carrito.js
   Cart logic + Modal + Notifications
   ============================================= */

let carrito = JSON.parse(localStorage.getItem("cm_carrito")) || [];

/* ---- Persist ---- */
function guardar() {
  localStorage.setItem("cm_carrito", JSON.stringify(carrito));
}

/* ---- Total ---- */
function calcTotal() {
  return carrito.reduce((s, p) => s + p.precio * p.cantidad, 0);
}

/* ---- Add to cart ---- */
function agregarCarrito(nombre, precio) {
  try {
    const existe = carrito.find((p) => p.nombre === nombre);
    if (existe) {
      existe.cantidad++;
    } else {
      carrito.push({ nombre, precio, cantidad: 1 });
    }
    guardar();
    renderCarrito();

    // Auto-open cart drawer to show the product was added
    const drawer = document.getElementById("cartDrawer");
    const overlay = document.getElementById("cartOverlay");
    if (drawer && overlay) {
      drawer.classList.add("open");
      overlay.classList.add("open");
    }

    notif(`✓ ${nombre} agregado a tu bolsa`);
  } catch (e) {
    console.error("Error en agregarCarrito:", e);
    notif("Error al agregar producto. Recarga la página.");
  }
}

/* ---- Change quantity ---- */
function cambiarCantidad(idx, delta) {
  if (!carrito[idx]) return;
  carrito[idx].cantidad += delta;
  if (carrito[idx].cantidad <= 0) {
    carrito.splice(idx, 1);
  }
  guardar();
  renderCarrito();
}

/* ---- Remove item ---- */
function eliminarItem(idx) {
  carrito.splice(idx, 1);
  guardar();
  renderCarrito();
}

/* ---- Empty cart ---- */
function vaciarCarrito() {
  if (carrito.length === 0) {
    notif("La bolsa ya está vacía");
    return;
  }
  if (!confirm("¿Vaciar la bolsa de compras?")) return;
  carrito = [];
  guardar();
  renderCarrito();
  notif("Bolsa vaciada");
}

/* ---- Render drawer ----
   FIX: El bug original era que #drawerEmpty vivía DENTRO de #drawerItems.
   Al hacer lista.innerHTML = "" o reemplazarlo con productos, el elemento
   desaparecía del DOM. En renders siguientes getElementById("drawerEmpty")
   devolvía null y toda la actualización fallaba silenciosamente.
   Solución: reconstruir siempre el contenido completo de #drawerItems,
   incluyendo el estado vacío como HTML, sin depender de un nodo persistente.
---------------------------------------------------------------- */
function renderCarrito() {
  try {
    const lista = document.getElementById("drawerItems");
    const totalEl = document.getElementById("drawerTotal");
    const counters = document.querySelectorAll(".cart-count");

    const total = calcTotal();
    const qty = carrito.reduce((s, p) => s + p.cantidad, 0);

    /* -- Actualizar todos los contadores de la navbar en tiempo real -- */
    counters.forEach((el) => (el.textContent = qty));

    if (!lista) return;

    if (carrito.length === 0) {
      /* Estado vacío: se inyecta como HTML para que siempre exista */
      lista.innerHTML = `
        <div class="drawer-empty" style="display:flex; flex-direction:column; align-items:center; gap:12px; padding:40px 20px; color:#aaa;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" width="56" height="56">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <path d="M16 10a4 4 0 01-8 0"/>
          </svg>
          <p style="margin:0; font-size:0.95rem;">Tu bolsa está vacía</p>
        </div>`;
    } else {
      /* Productos: reconstruir lista completa — sin referencias a nodos viejos */
      lista.innerHTML = carrito
        .map(
          (p, i) => `
          <div class="cart-item">
            <div class="cart-item-info">
              <div class="cart-item-name">${p.nombre}</div>
              <div class="cart-item-qty">
                <button class="qty-btn" onclick="cambiarCantidad(${i}, -1)" title="Quitar uno">−</button>
                <span>${p.cantidad}</span>
                <button class="qty-btn" onclick="cambiarCantidad(${i}, 1)" title="Agregar uno">+</button>
                · S/ ${p.precio.toFixed(2)} c/u
              </div>
            </div>
            <div class="cart-item-price">S/ ${(p.precio * p.cantidad).toFixed(2)}</div>
            <button class="cart-item-remove" onclick="eliminarItem(${i})" title="Eliminar">
              <i class="fas fa-times"></i>
            </button>
          </div>`,
        )
        .join("");
    }

    if (totalEl) totalEl.textContent = `S/ ${total.toFixed(2)}`;
  } catch (e) {
    console.error("Error en renderCarrito:", e);
  }
}

/* ---- Toggle drawer ---- */
function toggleCarrito() {
  document.getElementById("cartDrawer").classList.toggle("open");
  document.getElementById("cartOverlay").classList.toggle("open");
}
function cerrarCarrito() {
  document.getElementById("cartDrawer").classList.remove("open");
  document.getElementById("cartOverlay").classList.remove("open");
}

/* ---- Open purchase modal ---- */
function abrirModalCompra() {
  if (carrito.length === 0) {
    notif("Agrega productos a tu bolsa primero");
    return;
  }

  const total = calcTotal();
  let html = carrito
    .map(
      (p) => `
    <div class="modal-summary-item">
      <span>${p.nombre} (×${p.cantidad})</span>
      <strong>S/ ${(p.precio * p.cantidad).toFixed(2)}</strong>
    </div>`,
    )
    .join("");

  html += `
    <div class="modal-summary-total">
      <span>Total</span>
      <span>S/ ${total.toFixed(2)}</span>
    </div>`;

  document.getElementById("modalResumen").innerHTML = html;
  document.getElementById("modalCompra").classList.add("open");
  cerrarCarrito();
}

function cerrarModalCompra() {
  document.getElementById("modalCompra").classList.remove("open");
}

/* ---- Process purchase ---- */
function procesarCompra(e) {
  e.preventDefault();

  if (carrito.length === 0) {
    notif("Tu carrito está vacío");
    return;
  }

  const nombre = document.getElementById("nombre").value.trim();
  const apellido = document.getElementById("apellido").value.trim();
  const email = document.getElementById("email").value.trim();
  const telefono = document.getElementById("telefono").value.trim();
  const region = document.getElementById("region").value.trim();
  const distrito = document.getElementById("distrito").value.trim();
  const direccion = document.getElementById("direccion").value.trim();
  const numero = document.getElementById("numero").value.trim();
  const codigo = document.getElementById("codigo").value.trim();
  const referencia = document.getElementById("referencia").value.trim();
  const metodo = document.getElementById("metodo").value.trim();
  const notas = document.getElementById("notas").value.trim();

  if (
    !nombre ||
    !apellido ||
    !email ||
    !telefono ||
    !region ||
    !distrito ||
    !direccion ||
    !numero ||
    !metodo
  ) {
    notif("Por favor completa todos los campos requeridos");
    return;
  }

  const btn = e.target.querySelector(".modal-submit");
  btn.disabled = true;
  btn.textContent = "Procesando…";

  const total = calcTotal();
  const fecha = new Date().toLocaleDateString("es-PE");
  const nombreCompleto = `${nombre} ${apellido}`;
  const direccionCompleta = `${direccion}, ${numero}, ${distrito}, ${region}${codigo ? `, ${codigo}` : ""}`;

  let msg = `*NUEVA COMPRA — CESAR MODAS*%0A%0A`;
  msg += `*CLIENTE*%0A`;
  msg += `Nombre: ${nombreCompleto}%0A`;
  msg += `Email: ${email}%0A`;
  msg += `Teléfono: ${telefono}%0A%0A`;
  msg += `*DIRECCIÓN DE ENTREGA*%0A`;
  msg += `${direccionCompleta}%0A`;
  if (referencia) msg += `Referencia: ${referencia}%0A`;
  msg += `%0A*MÉTODO DE PAGO*%0A${metodo}%0A%0A`;
  msg += `*PRODUCTOS:%0A`;
  carrito.forEach((p) => {
    msg += `  • ${p.nombre} (×${p.cantidad}) — S/ ${(p.precio * p.cantidad).toFixed(2)}%0A`;
  });
  msg += `%0A*TOTAL: S/ ${total.toFixed(2)}*%0A%0A`;
  if (notas) msg += `*Notas Especiales:*%0A${notas}%0A%0A`;
  msg += `Fecha: ${fecha}`;

  window.open(`https://wa.me/51969216414?text=${msg}`, "_blank");

  setTimeout(() => {
    mostrarExito({
      nombre: nombreCompleto,
      email,
      telefono,
      direccion: direccionCompleta,
      metodo,
      total: total.toFixed(2),
      fecha,
    });
    cerrarModalCompra();
    e.target.reset();
    btn.disabled = false;
    btn.textContent = "Completar Compra";
    carrito = [];
    guardar();
    renderCarrito();
  }, 500);
}

/* ---- Success screen ---- */
function mostrarExito(datos) {
  let sc = document.getElementById("successScreen");
  if (!sc) {
    sc = document.createElement("div");
    sc.id = "successScreen";
    sc.className = "success-screen";
    sc.innerHTML = `
      <div class="success-card">
        <div class="success-icon">✓</div>
        <h2>¡Pedido Enviado!</h2>
        <p>Tu orden fue enviada por WhatsApp exitosamente.<br>Nos pondremos en contacto muy pronto.</p>
        <div class="success-info" id="successInfo"></div>
        <button class="btn-primary" style="max-width:280px;margin:0 auto;" onclick="cerrarExito()">
          Continuar Comprando
        </button>
      </div>`;
    document.body.appendChild(sc);
  }

  document.getElementById("successInfo").innerHTML = `
    <strong>Resumen del Pedido</strong>
    Cliente: ${datos.nombre}<br>
    Email: ${datos.email}<br>
    Teléfono: ${datos.telefono}
    <span class="success-total">Total: S/ ${datos.total}</span>
    Fecha: ${datos.fecha}`;

  sc.classList.add("open");
  setTimeout(cerrarExito, 15000);
}

function cerrarExito() {
  const sc = document.getElementById("successScreen");
  if (sc) sc.classList.remove("open");
}

/* ---- Notification toast ---- */
function notif(msg) {
  const n = document.createElement("div");
  n.className = "notif";
  n.textContent = msg;
  document.body.appendChild(n);
  setTimeout(() => {
    n.style.transition = "opacity 0.3s, transform 0.3s";
    n.style.opacity = "0";
    n.style.transform = "translateX(30px)";
    setTimeout(() => n.remove(), 300);
  }, 2600);
}

/* ---- Keyboard events ---- */
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    cerrarCarrito();
    cerrarModalCompra();
    cerrarExito();
  }
});

/* ---- Init ---- */
document.addEventListener("DOMContentLoaded", () => {
  renderCarrito();
});
