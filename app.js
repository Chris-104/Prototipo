"use strict";

/* =========================
   CONFIGURACIÓN
   ========================= */

const availableRoles = ["Gerencia", "Mecánico", "Chofer"];

const authPages = [
  "Acceso",
  "Recuperar acceso",
  "Confirmación de recuperación"
];

const icons = {
  "Resumen general": "◫",
  "Flota": "▰",
  "Conductores": "♙",
  "Viajes": "⇄",
  "Taller": "⚒",
  "Combustible": "◉",
  "Reportes": "▥",
  "Documentos": "▤",
  "Alertas": "♧",
  "Usuarios": "⚙",
  "Mis viajes": "⇄",
  "Mi perfil": "♙"
};

let role = "Gerencia";
let page = "Acceso";
let authProfile = "Gerencia";
let sessionActive = false;
let toastTimer;

const today = "2026-10-23";
const demoDriver = "Carlos Hernández";

const profile = {
  Gerencia: {
    name: "Gerencia general",
    initials: "GM",
    phone: "7000-1234"
  },
  "Mecánico": {
    name: "Taller central",
    initials: "MC",
    phone: "7000-1234"
  },
  Chofer: {
    name: demoDriver,
    initials: "CH",
    phone: "7000-1234"
  }
};

/* =========================
   DATOS DE DEMOSTRACIÓN
   ========================= */

const trucks = Array.from({ length: 50 }, (_, i) => ({
  id: "TR-" + String(i + 1).padStart(3, "0"),
  plate: "C " + (123450 + i),
  model: [
    "Freightliner Cascadia",
    "International LT",
    "Volvo FH"
  ][i % 3],
  status: i < 32
    ? "En ruta"
    : i < 44
      ? "Disponible"
      : "En taller",
  km: 73500 + i * 1350
}));

const drivers = [
  {
    name: demoDriver,
    license: "LC-10234",
    expires: "2027-05-12",
    status: "Asignado"
  },
  {
    name: "Miguel López",
    license: "LC-10875",
    expires: "2026-10-18",
    status: "Bloqueado"
  },
  {
    name: "José Ramírez",
    license: "LC-11238",
    expires: "2026-11-02",
    status: "En ruta"
  },
  {
    name: "Luis Martínez",
    license: "LC-11340",
    expires: "2027-08-22",
    status: "Disponible"
  },
  {
    name: "Óscar Reyes",
    license: "LC-11829",
    expires: "2027-01-30",
    status: "Disponible"
  }
];

const trips = [
  {
    id: "VJ-2081",
    origin: "San Salvador",
    dest: "San Miguel",
    driver: "José Ramírez",
    truck: "TR-003",
    date: today,
    status: "En ruta",
    km: 138
  },
  {
    id: "VJ-2082",
    origin: "Sonsonate",
    dest: "Acajutla",
    driver: demoDriver,
    truck: "TR-033",
    date: today,
    status: "Programado",
    km: 25
  },
  {
    id: "VJ-2083",
    origin: "Santa Ana",
    dest: "San Salvador",
    driver: "Óscar Reyes",
    truck: "TR-005",
    date: today,
    status: "Completado",
    km: 65
  }
];

trucks.find(truck => truck.id === "TR-033").status = "Asignado";
trucks.find(truck => truck.id === "TR-005").status = "Disponible";

const jobs = [
  {
    id: "OT-041",
    truck: "TR-045",
    type: "Cambio de aceite",
    cost: 85,
    status: "Pendiente"
  },
  {
    id: "OT-042",
    truck: "TR-046",
    type: "Revisión de frenos",
    cost: 160,
    status: "En proceso"
  },
  {
    id: "OT-043",
    truck: "TR-005",
    type: "Mantenimiento preventivo",
    cost: 120,
    status: "Terminado"
  }
];

const fuel = [
  {
    truck: "TR-003",
    route: "San Salvador → San Miguel",
    liters: 42,
    cost: 47.46,
    km: 138,
    date: today
  },
  {
    truck: "TR-005",
    route: "Santa Ana → San Salvador",
    liters: 20,
    cost: 22.60,
    km: 65,
    date: today
  },
  {
    truck: "TR-033",
    route: "Sonsonate → Acajutla",
    liters: 9,
    cost: 10.17,
    km: 25,
    date: today
  }
];

const users = [
  { name: "Gerencia general", email: "gerencia@ejemplo.com", role: "Gerencia" },
  { name: "Operaciones", email: "operaciones@ejemplo.com", role: "Gerencia" },
  { name: "Taller central", email: "taller@ejemplo.com", role: "Mecánico" },
  { name: demoDriver, email: "chofer@ejemplo.com", role: "Chofer" }
];

const incidents = [];

/* =========================
   FUNCIONES DE APOYO
   ========================= */

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[character]));
}

function badge(status) {
  let color = "";

  if (/taller|Pendiente|Programado|vencer|Asignado/i.test(status)) {
    color = "warn";
  } else if (/Bloqueado|Vencid/i.test(status)) {
    color = "red";
  } else if (/ruta|proceso/i.test(status)) {
    color = "blue";
  }

  return `<span class="badge ${color}">${esc(status)}</span>`;
}

function toast(message) {
  const element = document.getElementById("toast");

  clearTimeout(toastTimer);
  element.textContent = message;
  element.style.display = "block";

  toastTimer = setTimeout(() => {
    element.style.display = "none";
  }, 3500);
}

function heading(title, description, action = "") {
  return `
    <div class="heading">
      <div>
        <div class="eyebrow">CENTRO DE OPERACIONES</div>
        <h1>${esc(title)}</h1>
        <p>${esc(description)}</p>
      </div>
      ${action}
    </div>
  `;
}

function table(headers, rows) {
  return `
    <div class="tablewrap">
      <table>
        <thead>
          <tr>${headers.map(item => `<th>${esc(item)}</th>`).join("")}</tr>
        </thead>

        <tbody>
          ${rows.join("") || `
            <tr>
              <td colspan="${headers.length}" class="empty">
                No hay registros que coincidan.
              </td>
            </tr>
          `}
        </tbody>
      </table>
    </div>
  `;
}

function actionButton(text, handler, secondary = false) {
  return `
    <button
      class="btn ${secondary ? "secondary" : ""}"
      onclick="${handler}"
    >
      ${esc(text)}
    </button>
  `;
}

function canManage() {
  return sessionActive && role === "Gerencia";
}

function canMaintain() {
  return sessionActive && ["Gerencia", "Mecánico"].includes(role);
}

function requirePermission(condition) {
  if (!condition) {
    toast("Tu perfil no tiene permiso para realizar esta acción.");
    return false;
  }

  return true;
}

function nextId(list, prefix, initial) {
  const numbers = list.map(item => Number(item.id.split("-")[1]));

  return prefix + (Math.max(initial - 1, ...numbers) + 1);
}

function daysUntil(date) {
  return Math.round(
    (Date.parse(date + "T00:00:00Z") -
      Date.parse(today + "T00:00:00Z")) / 86400000
  );
}

function documentStatus(date) {
  const days = daysUntil(date);
  return days < 0 ? "Vencida" : days <= 30 ? "Por vencer" : "Vigente";
}

/* =========================
   NAVEGACIÓN Y SESIÓN
   ========================= */

function navItems(selectedRole = role) {
  if (selectedRole === "Chofer") {
    return ["Mis viajes", "Combustible", "Mi perfil", "Alertas"];
  }

  if (selectedRole === "Mecánico") {
    return ["Taller", "Flota", "Alertas", "Mi perfil"];
  }

  if (selectedRole === "Gerencia") {
    return [
      "Resumen general",
      "Flota",
      "Conductores",
      "Viajes",
      "Taller",
      "Combustible",
      "Reportes",
      "Documentos",
      "Alertas",
      "Usuarios"
    ];
  }

  return [];
}

function go(destination) {
  if (sessionActive && authPages.includes(destination)) {
    logout();
    return;
  }

  if (!sessionActive && !authPages.includes(destination)) {
    destination = "Acceso";
  }

  if (sessionActive && !navItems().includes(destination)) {
    destination = navItems()[0];
  }

  page = destination;

  document.getElementById("accountMenu").open = false;
  document.getElementById("crumb").textContent = page;

  document.getElementById("nav").innerHTML = sessionActive
    ? navItems().map(item => `
        <button
          class="${item === page ? "active" : ""}"
          onclick="go('${item}')"
          title="${item}"
          ${item === page ? 'aria-current="page"' : ""}
        >
          <span class="navicon">${icons[item]}</span>
          <span class="navtext">${item}</span>
        </button>
      `).join("")
    : "";

  render();
}

function chooseProfile(selectedRole) {
  if (
    sessionActive ||
    page !== "Acceso" ||
    !availableRoles.includes(selectedRole)
  ) {
    return;
  }

  authProfile = selectedRole;

  document.querySelectorAll("[data-profile]").forEach(button => {
    const selected = button.dataset.profile === selectedRole;
    button.classList.toggle("chosen", selected);
    button.setAttribute("aria-pressed", String(selected));
  });

  document.getElementById("loginButton").textContent =
    "Iniciar sesión como " + selectedRole.toLowerCase() + " →";
}

function login() {
  if (sessionActive || page !== "Acceso") {
    return;
  }

  if (!document.getElementById("loginForm").reportValidity()) {
    return;
  }

  if (!availableRoles.includes(authProfile)) {
    return;
  }

  role = authProfile;
  sessionActive = true;

  document.getElementById("rolename").textContent = role;
  document.getElementById("avatar").textContent = profile[role].initials;
  document.getElementById("authroot").innerHTML = "";

  document.body.classList.remove("auth");

  go(navItems()[0]);
  toast("Sesión de demostración iniciada");
}

function logout() {
  closeModal();

  sessionActive = false;
  role = "Gerencia";
  authProfile = "Gerencia";

  document.getElementById("accountMenu").open = false;
  document.getElementById("app").innerHTML = "";

  go("Acceso");
  toast("Sesión de demostración cerrada");
}

document.addEventListener("click", event => {
  const menu = document.getElementById("accountMenu");

  if (!menu.contains(event.target)) {
    menu.open = false;
  }
});

/* =========================
   COMPONENTES
   ========================= */

function stats() {
  const items = [
    ["Flota total", trucks.length],
    ["Disponibles", trucks.filter(t => t.status === "Disponible").length],
    ["En ruta", trucks.filter(t => t.status === "En ruta").length],
    ["En taller", trucks.filter(t => t.status === "En taller").length]
  ];

  return `
    <div class="stats">
      ${items.map(([label, value]) => `
        <div class="stat">
          <label>${label}</label>
          <strong>${value}</strong>
          <small>Unidades de la flota</small>
        </div>
      `).join("")}
    </div>
  `;
}

function tripTable(list) {
  return table(
    ["VIAJE / RUTA", "CONDUCTOR", "UNIDAD", "FECHA", "ESTADO", ""],
    list.map(trip => `
      <tr>
        <td>
          ${esc(trip.id)}
          <div class="muted">
            ${esc(trip.origin)} → ${esc(trip.dest)}
          </div>
        </td>
        <td>${esc(trip.driver)}</td>
        <td>${esc(trip.truck)}</td>
        <td>${esc(trip.date)}</td>
        <td>${badge(trip.status)}</td>
        <td>
          <button class="link" onclick="detailTrip('${trip.id}')">
            Ver →
          </button>
        </td>
      </tr>
    `)
  );
}

function visibleFuel() {
  if (role !== "Chofer") {
    return fuel;
  }

  const units = new Set(
    trips.filter(trip => trip.driver === demoDriver).map(trip => trip.truck)
  );

  return fuel.filter(record => units.has(record.truck));
}

function routeTotals() {
  const grouped = new Map();

  for (const record of fuel) {
    if (!grouped.has(record.route)) {
      grouped.set(record.route, {
        route: record.route,
        liters: 0,
        cost: 0,
        km: 0
      });
    }

    const item = grouped.get(record.route);
    item.liters += record.liters;
    item.cost += record.cost;
    item.km += record.km;
  }

  return [...grouped.values()];
}

function chart() {
  const records = routeTotals();

  if (!records.length) {
    return '<p class="empty">No hay abastecimientos registrados.</p>';
  }

  const max = Math.max(...records.map(item => item.liters), 1);

  return `
    <p class="muted">Litros registrados por ruta</p>
    <div class="chart">
      ${records.map(item => `
        <div
          class="bar"
          style="height:${Math.max(3, item.liters / max * 100)}%"
          title="${esc(item.route)}: ${item.liters.toFixed(1)} L"
        >
          <b>${item.liters.toFixed(1)} L</b>
          <span>${esc(item.route)}</span>
        </div>
      `).join("")}
    </div>
  `;
}

function alertItems() {
  const relevantDrivers = role === "Chofer"
    ? drivers.filter(driver => driver.name === demoDriver)
    : drivers;

  const items = relevantDrivers
    .filter(driver => daysUntil(driver.expires) <= 30)
    .map(driver => ({
      title: `${driver.name}: licencia ${documentStatus(driver.expires).toLowerCase()}`,
      detail: `Vencimiento: ${driver.expires}`,
      red: daysUntil(driver.expires) < 0
    }));

  if (role !== "Chofer") {
    jobs
      .filter(job => job.status !== "Terminado")
      .forEach(job => {
        items.push({
          title: `${job.truck}: ${job.type}`,
          detail: `${job.id} · ${job.status}`,
          red: false
        });
      });
  }

  const visibleIncidents = role === "Chofer"
    ? incidents.filter(item => item.driver === demoDriver)
    : incidents;

  visibleIncidents.forEach(item => {
    items.push({
      title: `${item.trip}: ${item.type}`,
      detail: item.description,
      red: true
    });
  });

  return items;
}

function alerts() {
  const items = alertItems();

  return items.map(item => `
    <div class="alert">
      <span class="dot ${item.red ? "red" : ""}"></span>
      <div>
        <strong>${esc(item.title)}</strong>
        <p>${esc(item.detail)}</p>
      </div>
    </div>
  `).join("") || '<p class="empty">No hay alertas pendientes.</p>';
}

/* =========================
   PANTALLAS
   ========================= */

function render() {
  if (!sessionActive || authPages.includes(page)) {
    renderAuth();
    return;
  }

  document.body.classList.remove("auth");
  document.getElementById("alertCount").textContent = alertItems().length;

  let html = "";

  if (page === "Resumen general") {
    html = heading(
      "Tu operación, en un solo lugar.",
      "Supervisa tu flota y mantén cada viaje bajo control.",
      actionButton("＋ Asignar viaje", "tripForm()")
    );

    html += `
      <div class="split">
        <span class="muted">VIERNES, 23 DE OCTUBRE DE 2026</span>
        ${badge("Vista de demostración")}
      </div>

      ${stats()}

      <div class="grid">
        <div>
          <section class="card">
            <div class="cardhead">
              <h2>Actividad de viajes</h2>
              <button class="link" onclick="go('Viajes')">
                Todos los viajes ↗
              </button>
            </div>
            ${tripTable(trips.slice(0, 4))}
          </section>

          <section class="card">
            <div class="cardhead">
              <h2>Consumo por ruta</h2>
              <button class="link" onclick="go('Reportes')">
                Ver análisis ↗
              </button>
            </div>
            ${chart()}
          </section>
        </div>

        <div>
          <section class="card">
            <div class="cardhead">
              <h2>Requieren atención</h2>
              ${badge(alertItems().length + " alertas")}
            </div>
            ${alerts()}
          </section>

          <section class="card preventive">
            <div class="eyebrow">CONTROL PREVENTIVO</div>
            <h2>Un viaje seguro empieza antes de salir.</h2>
            <p>
              Revisa los documentos y el estado de cada unidad
              antes de una nueva asignación.
            </p>
            <div class="actions">
              ${actionButton("Revisar vigencias →", "go('Documentos')")}
            </div>
          </section>
        </div>
      </div>
    `;
  }

  if (page === "Flota") {
    html = heading(
      "Flota de vehículos",
      "Consulta el estado y la disponibilidad de cada unidad.",
      canManage() ? actionButton("＋ Registrar unidad", "truckForm()") : ""
    );

    html += `
      ${stats()}

      <div class="toolbar">
        <input
          id="q"
          aria-label="Buscar unidades"
          placeholder="Buscar unidad, matrícula o modelo"
          oninput="filterFleet()"
        >

        <select
          id="filter"
          aria-label="Filtrar estado"
          onchange="filterFleet()"
        >
          <option>Todos los estados</option>
          <option>Disponible</option>
          <option>En ruta</option>
          <option>En taller</option>
          <option>Asignado</option>
        </select>
      </div>

      <div class="fleet" id="fleet"></div>
    `;
  }

  if (page === "Viajes") {
    html = heading(
      "Gestión de viajes",
      "Planifica recorridos y asigna recursos disponibles.",
      actionButton("＋ Asignar viaje", "tripForm()")
    );

    html += `
      <div class="toolbar">
        <input
          id="q"
          aria-label="Buscar viajes"
          placeholder="Buscar viaje, ruta o conductor"
          oninput="filterTrips()"
        >

        <select
          id="filter"
          aria-label="Filtrar estado"
          onchange="filterTrips()"
        >
          <option>Todos los estados</option>
          <option>Programado</option>
          <option>En ruta</option>
          <option>Completado</option>
        </select>
      </div>

      <section class="card" id="triplist">
        ${tripTable(trips)}
      </section>
    `;
  }

  if (page === "Conductores") {
    html = heading(
      "Conductores",
      "Consulta disponibilidad y vigencia de licencias.",
      actionButton("＋ Nuevo conductor", "driverForm()")
    );

    html += `
      <section class="card">
        ${table(
          ["CONDUCTOR", "LICENCIA", "VENCIMIENTO", "DISPONIBILIDAD", ""],
          drivers.map((driver, index) => `
            <tr>
              <td>${esc(driver.name)}</td>
              <td>${esc(driver.license)}</td>
              <td>${driver.expires}</td>
              <td>${badge(driver.status)}</td>
              <td>
                <button class="link" onclick="driverDetail(${index})">
                  Ver expediente →
                </button>
              </td>
            </tr>
          `)
        )}
      </section>

      <div class="notice">
        Los conductores con licencia vencida no pueden recibir viajes.
      </div>
    `;
  }

  if (page === "Documentos") {
    html = heading(
      "Control documental",
      "Mantén actualizadas las licencias de los conductores."
    );

    html += `
      <div class="notice">
        Las alertas consideran los próximos 30 días desde ${today}.
      </div>

      <section class="card">
        ${table(
          ["TITULAR", "DOCUMENTO", "VENCIMIENTO", "VIGENCIA", ""],
          drivers.map((driver, index) => `
            <tr>
              <td>${esc(driver.name)}</td>
              <td>Licencia · ${esc(driver.license)}</td>
              <td>${driver.expires}</td>
              <td>${badge(documentStatus(driver.expires))}</td>
              <td>
                <button class="link" onclick="renew(${index})">
                  Actualizar →
                </button>
              </td>
            </tr>
          `)
        )}
      </section>
    `;
  }

  if (page === "Taller") {
    html = heading(
      "Taller y mantenimiento",
      "Organiza servicios preventivos y reparaciones.",
      actionButton("＋ Orden de trabajo", "jobForm()")
    );

    html += `
      <div class="kanban">
        ${["Pendiente", "En proceso", "Terminado"].map(status => `
          <section class="column">
            <div class="split">
              <h2>${status}</h2>
              <span class="muted">
                ${jobs.filter(job => job.status === status).length}
              </span>
            </div>

            ${jobs.filter(job => job.status === status).map(job => `
              <div class="job">
                <div class="split">
                  <span class="muted">${job.id}</span>
                  ${badge(job.truck)}
                </div>

                <h3>${esc(job.type)}</h3>
                <p>Responsable: Taller central</p>
                <p>Costo: $${job.cost.toFixed(2)}</p>

                <button
                  class="btn secondary small"
                  onclick="advanceJob('${job.id}')"
                >
                  ${status === "Pendiente"
                    ? "Iniciar trabajo"
                    : status === "En proceso"
                      ? "Finalizar servicio"
                      : "Ver historial"} →
                </button>
              </div>
            `).join("") || '<p class="muted">Sin órdenes.</p>'}
          </section>
        `).join("")}
      </div>
    `;
  }

  if (page === "Combustible") {
    const records = visibleFuel();
    const liters = records.reduce((sum, item) => sum + item.liters, 0);
    const cost = records.reduce((sum, item) => sum + item.cost, 0);
    const km = records.reduce((sum, item) => sum + item.km, 0);

    html = heading(
      "Control de combustible",
      "Registra abastecimientos y consulta el rendimiento.",
      actionButton("＋ Registrar carga", "fuelForm()")
    );

    html += `
      <div class="stats">
        ${[
          ["Litros registrados", liters.toFixed(1) + " L"],
          ["Costo total", "$" + cost.toFixed(2)],
          ["Distancia registrada", km + " km"],
          ["Rendimiento", (liters ? km / liters : 0).toFixed(2) + " km/L"]
        ].map(([label, value]) => `
          <div class="stat">
            <label>${label}</label>
            <strong>${value}</strong>
            <small>Registros de demostración</small>
          </div>
        `).join("")}
      </div>

      <section class="card">
        ${table(
          ["UNIDAD / FECHA", "RUTA", "LITROS", "COSTO", "KM/L"],
          records.map(item => `
            <tr>
              <td>
                ${esc(item.truck)}
                <div class="muted">${item.date}</div>
              </td>
              <td>${esc(item.route)}</td>
              <td>${item.liters.toFixed(1)} L</td>
              <td>$${item.cost.toFixed(2)}</td>
              <td>${(item.km / item.liters).toFixed(2)}</td>
            </tr>
          `)
        )}
      </section>
    `;
  }

  if (page === "Reportes") {
    html = heading(
      "Reportes de operación",
      "Consulta costos y consumo acumulado por ruta.",
      actionButton("↓ Exportar CSV", "exportCSV()")
    );

    html += `
      <section class="card">
        <h2>Consumo por ruta</h2>
        ${chart()}
      </section>

      <section class="card">
        ${table(
          ["RUTA", "DISTANCIA", "COMBUSTIBLE", "COSTO", "COSTO / KM"],
          routeTotals().map(item => `
            <tr>
              <td>${esc(item.route)}</td>
              <td>${item.km} km</td>
              <td>${item.liters.toFixed(1)} L</td>
              <td>$${item.cost.toFixed(2)}</td>
              <td>$${(item.cost / item.km).toFixed(2)}</td>
            </tr>
          `)
        )}
      </section>

      <div class="notice">
        Rendimiento = distancia ÷ litros.
        El costo por kilómetro considera únicamente combustible.
      </div>
    `;
  }

  if (page === "Alertas") {
    html = heading(
      "Centro de alertas",
      "Documentación, mantenimiento e incidentes."
    );

    html += `<section class="card">${alerts()}</section>`;
  }

  if (page === "Usuarios") {
    html = heading(
      "Usuarios y permisos",
      "Administra los perfiles del sistema.",
      actionButton("＋ Crear usuario", "userForm()")
    );

    html += `
      <section class="card">
        ${table(
          ["USUARIO", "CORREO", "ROL", "ESTADO", ""],
          users.map(user => `
            <tr>
              <td>${esc(user.name)}</td>
              <td>${esc(user.email)}</td>
              <td>${esc(user.role)}</td>
              <td>${badge("Activo")}</td>
              <td>
                <button class="link" onclick="roleInfo('${user.role}')">
                  Ver permisos →
                </button>
              </td>
            </tr>
          `)
        )}
      </section>

      <div class="notice">
        Gerencia administra flota, conductores, viajes y documentos.
        Para ingresar con otro perfil debes cerrar sesión.
      </div>
    `;
  }

  if (page === "Mis viajes") {
    const mine = trips.filter(trip => trip.driver === demoDriver);

    html = heading(
      "Buen día, Carlos.",
      "Estos son tus viajes asignados."
    );

    html += mine.map(trip => `
      <section class="card tripcard">
        <div class="split">
          <span class="muted">${trip.id} · ${trip.date}</span>
          ${badge(trip.status)}
        </div>

        <div class="route">
          ${esc(trip.origin)}
          <span>→</span>
          ${esc(trip.dest)}
        </div>

        <div class="tripmeta">
          <div>
            <small>Unidad asignada</small>
            ${trip.truck}
          </div>
          <div>
            <small>Distancia estimada</small>
            ${trip.km} km
          </div>
          <div>
            <small>Carga</small>
            Mercadería general
          </div>
        </div>

        <div class="actions">
          ${actionButton(
            trip.status === "Programado"
              ? "Iniciar viaje"
              : trip.status === "En ruta"
                ? "Finalizar viaje"
                : "Ver detalle",
            `progressTrip('${trip.id}')`
          )}

          ${actionButton(
            "Reportar incidente",
            `incident('${trip.id}')`,
            true
          )}
        </div>
      </section>
    `).join("") || '<section class="card empty">No tienes viajes asignados.</section>';
  }

  if (page === "Mi perfil") {
    const driver = drivers.find(item => item.name === demoDriver);

    html = heading(
      "Mi perfil",
      "Información de tu cuenta."
    );

    html += `
      <section class="card">
        <div class="avatar">${profile[role].initials}</div>
        <h2 style="margin-top:18px">${esc(profile[role].name)}</h2>
        <p>${esc(role)}</p>

        ${role === "Chofer" ? `
          <p>Licencia: ${esc(driver.license)}</p>
          <p>Vencimiento: ${driver.expires}</p>
          ${badge(documentStatus(driver.expires))}
        ` : ""}

        <p style="margin-top:20px">
          Teléfono: ${esc(profile[role].phone)}
        </p>

        <div class="actions">
          ${actionButton("Editar contacto", "profileForm()", true)}
        </div>
      </section>
    `;
  }

  document.getElementById("app").innerHTML = html;

  if (page === "Flota") {
    filterFleet();
  }
}

/* =========================
   FILTROS
   ========================= */

function filterFleet() {
  const query = document.getElementById("q").value.toLowerCase();
  const status = document.getElementById("filter").value;

  const list = trucks.filter(truck => {
    const matchesText = [
      truck.id,
      truck.plate,
      truck.model
    ].join(" ").toLowerCase().includes(query);

    return matchesText &&
      (status === "Todos los estados" || truck.status === status);
  });

  document.getElementById("fleet").innerHTML = list.map(truck => `
    <article class="truck">
      <div class="trucktop">
        <h2>${truck.id}</h2>
        ${badge(truck.status)}
      </div>

      <div class="truckpic" aria-hidden="true">🚛</div>

      <h2>${esc(truck.model)}</h2>
      <p>Matrícula: ${esc(truck.plate)}</p>

      <div class="truckfooter">
        <span class="muted">${truck.km.toLocaleString()} km</span>
        <button class="link" onclick="truckDetail('${truck.id}')">
          Ver expediente →
        </button>
      </div>
    </article>
  `).join("") || '<p class="empty">No se encontraron unidades.</p>';
}

function filterTrips() {
  const query = document.getElementById("q").value.toLowerCase();
  const status = document.getElementById("filter").value;

  const list = trips.filter(trip => {
    const matchesText = [
      trip.id,
      trip.origin,
      trip.dest,
      trip.driver,
      trip.truck
    ].join(" ").toLowerCase().includes(query);

    return matchesText &&
      (status === "Todos los estados" || trip.status === status);
  });

  document.getElementById("triplist").innerHTML = tripTable(list);
}

/* =========================
   MODALES Y CAMPOS
   ========================= */

function field(label, name, type = "text", value = "", attributes = "") {
  return `
    <label for="field-${name}">${esc(label)}</label>
    <input
      id="field-${name}"
      name="${name}"
      type="${type}"
      value="${esc(value)}"
      required
      ${attributes}
    >
  `;
}

function select(label, name, options) {
  return `
    <label for="field-${name}">${esc(label)}</label>
    <select id="field-${name}" name="${name}" required>
      ${options.map(option => {
        const value = typeof option === "string" ? option : option.value;
        const text = typeof option === "string" ? option : option.label;

        return `<option value="${esc(value)}">${esc(text)}</option>`;
      }).join("")}
    </select>
  `;
}

function show(title, content, onSave = null) {
  const modal = document.getElementById("modal");

  closeModal();

  modal.innerHTML = `
    <h2 id="modalTitle">${esc(title)}</h2>

    ${onSave ? `
      <form id="modalForm">
        ${content}

        <div class="modalfoot">
          <button type="button" class="btn secondary" onclick="closeModal()">
            Cancelar
          </button>
          <button type="submit" class="btn">Guardar</button>
        </div>
      </form>
    ` : `
      ${content}
      <div class="modalfoot">
        <button class="btn secondary" onclick="closeModal()">Cerrar</button>
      </div>
    `}
  `;

  if (onSave) {
    document.getElementById("modalForm").onsubmit = event => {
      event.preventDefault();

      if (event.currentTarget.reportValidity()) {
        onSave(new FormData(event.currentTarget));
      }
    };
  }

  modal.showModal();
}

function closeModal() {
  const modal = document.getElementById("modal");

  if (modal.open) {
    modal.close();
  }
}

/* =========================
   VIAJES
   ========================= */

function tripForm() {
  if (!requirePermission(canManage())) return;

  const availableDrivers = drivers.filter(driver =>
    driver.status === "Disponible" &&
    driver.expires >= today &&
    !trips.some(trip =>
      trip.driver === driver.name && trip.status !== "Completado"
    )
  );

  const availableTrucks = trucks.filter(truck =>
    truck.status === "Disponible" &&
    !trips.some(trip =>
      trip.truck === truck.id && trip.status !== "Completado"
    )
  );

  if (!availableDrivers.length || !availableTrucks.length) {
    toast("No hay conductores con licencia vigente o unidades disponibles.");
    return;
  }

  show(
    "Asignar nuevo viaje",
    field("Origen", "origin") +
    field("Destino", "dest") +
    field("Fecha", "date", "date", today, `min="${today}"`) +
    field("Distancia estimada (km)", "km", "number", "", 'min="1" step="1"') +
    select("Conductor disponible", "driver", availableDrivers.map(d => d.name)) +
    select("Unidad disponible", "truck", availableTrucks.map(t => t.id)),
    data => {
      const driver = drivers.find(item => item.name === data.get("driver"));
      const truck = trucks.find(item => item.id === data.get("truck"));

      const driverBusy = trips.some(trip =>
        trip.driver === driver?.name && trip.status !== "Completado"
      );

      const truckBusy = trips.some(trip =>
        trip.truck === truck?.id && trip.status !== "Completado"
      );

      const km = Number(data.get("km"));

      if (
        !driver ||
        !truck ||
        driver.status !== "Disponible" ||
        driver.expires < data.get("date") ||
        truck.status !== "Disponible" ||
        driverBusy ||
        truckBusy ||
        !(km > 0)
      ) {
        toast("Revisa licencia, distancia y disponibilidad.");
        return;
      }

      trips.unshift({
        id: nextId(trips, "VJ-", 2081),
        origin: data.get("origin").trim(),
        dest: data.get("dest").trim(),
        date: data.get("date"),
        driver: driver.name,
        truck: truck.id,
        km,
        status: "Programado"
      });

      driver.status = "Asignado";
      truck.status = "Asignado";

      closeModal();
      go("Viajes");
      toast("Viaje asignado correctamente");
    }
  );
}

function accessibleTrip(id) {
  const trip = trips.find(item => item.id === id);

  if (
    !sessionActive ||
    !trip ||
    (role === "Chofer" && trip.driver !== demoDriver) ||
    role === "Mecánico"
  ) {
    toast("No tienes acceso a ese viaje.");
    return null;
  }

  return trip;
}

function detailTrip(id) {
  const trip = accessibleTrip(id);
  if (!trip) return;

  show(
    "Detalle del viaje " + trip.id,
    `
      <div class="route">
        ${esc(trip.origin)} → ${esc(trip.dest)}
      </div>
      <p>Conductor: ${esc(trip.driver)}</p>
      <p>Unidad: ${trip.truck}</p>
      <p>Fecha: ${trip.date} · ${trip.km} km</p>
      <p>Estado: ${badge(trip.status)}</p>

      ${canManage() && trip.status !== "Completado" ? `
        <div class="actions">
          ${actionButton(
            trip.status === "Programado" ? "Iniciar viaje" : "Finalizar viaje",
            `progressTrip('${trip.id}')`
          )}
        </div>
      ` : ""}
    `
  );
}

function progressTrip(id) {
  const trip = accessibleTrip(id);
  if (!trip) return;

  if (trip.status === "Completado") {
    detailTrip(id);
    return;
  }

  const truck = trucks.find(item => item.id === trip.truck);
  const driver = drivers.find(item => item.name === trip.driver);

  if (trip.status === "Programado") {
    if (
      driver.expires < today ||
      driver.expires < trip.date ||
      truck.status === "En taller"
    ) {
      toast("No se puede iniciar: revisa la licencia y el estado de la unidad.");
      return;
    }

    trip.status = "En ruta";
    truck.status = "En ruta";
    driver.status = "En ruta";
  } else {
    trip.status = "Completado";
    truck.status = "Disponible";
    truck.km += trip.km;
    driver.status = driver.expires < today ? "Bloqueado" : "Disponible";
  }

  closeModal();
  render();
  toast("Estado del viaje: " + trip.status);
}

function incident(id) {
  const trip = accessibleTrip(id);
  if (!trip) return;

  show(
    "Reportar incidente · " + id,
    select("Tipo de incidente", "type", [
      "Falla mecánica",
      "Retraso",
      "Problema con la carga",
      "Otro"
    ]) + `
      <label for="incident-description">Descripción</label>
      <textarea
        id="incident-description"
        name="description"
        rows="4"
        required
      ></textarea>
    `,
    data => {
      incidents.unshift({
        trip: id,
        driver: trip.driver,
        type: data.get("type"),
        description: data.get("description").trim()
      });

      closeModal();
      render();
      toast("Incidente registrado");
    }
  );
}

/* =========================
   FLOTA
   ========================= */

function truckDetail(id) {
  if (!requirePermission(canMaintain())) return;

  const truck = trucks.find(item => item.id === id);
  if (!truck) return;

  const history = jobs.filter(job => job.truck === id);
  const historyTrips = trips.filter(trip => trip.truck === id);

  show(
    "Expediente " + id,
    `
      <p>${esc(truck.model)} · Matrícula ${esc(truck.plate)}</p>
      <p>Odómetro: ${truck.km.toLocaleString()} km</p>
      <p>Estado: ${badge(truck.status)}</p>

      <h3>Historial de mantenimiento</h3>
      ${history.map(job => `
        <p>
          ${esc(job.type)} · ${esc(job.status)}
          · $${job.cost.toFixed(2)}
        </p>
      `).join("") || "<p>Sin servicios registrados.</p>"}

      <h3>Viajes registrados</h3>
      ${historyTrips.map(trip => `
        <p>${trip.id} · ${esc(trip.origin)} → ${esc(trip.dest)}</p>
      `).join("") || "<p>Sin viajes registrados.</p>"}
    `
  );
}

function truckForm() {
  if (!requirePermission(canManage())) return;

  show(
    "Registrar unidad",
    field("Matrícula", "plate") +
    field("Marca y modelo", "model") +
    field("Odómetro (km)", "km", "number", "", 'min="0" step="1"'),
    data => {
      const plate = data.get("plate").trim();

      if (trucks.some(truck => truck.plate.toLowerCase() === plate.toLowerCase())) {
        toast("Ya existe una unidad con esa matrícula.");
        return;
      }

      trucks.push({
        id: "TR-" + String(
          Math.max(...trucks.map(truck => Number(truck.id.split("-")[1]))) + 1
        ).padStart(3, "0"),
        plate,
        model: data.get("model").trim(),
        km: Number(data.get("km")),
        status: "Disponible"
      });

      closeModal();
      render();
      toast("Unidad registrada");
    }
  );
}

/* =========================
   CONDUCTORES Y DOCUMENTOS
   ========================= */

function driverForm() {
  if (!requirePermission(canManage())) return;

  show(
    "Nuevo conductor",
    field("Nombre completo", "name") +
    field("Número de licencia", "license") +
    field("Vencimiento", "expires", "date"),
    data => {
      const name = data.get("name").trim();
      const license = data.get("license").trim();

      if (drivers.some(driver =>
        driver.name.toLowerCase() === name.toLowerCase() ||
        driver.license.toLowerCase() === license.toLowerCase()
      )) {
        toast("Ya existe un conductor con ese nombre o licencia.");
        return;
      }

      drivers.push({
        name,
        license,
        expires: data.get("expires"),
        status: data.get("expires") < today ? "Bloqueado" : "Disponible"
      });

      closeModal();
      render();
      toast("Conductor registrado");
    }
  );
}

function driverDetail(index) {
  if (!requirePermission(canManage())) return;

  const driver = drivers[index];
  if (!driver) return;

  show(
    "Expediente del conductor",
    `
      <h3>${esc(driver.name)}</h3>
      <p>Licencia: ${esc(driver.license)}</p>
      <p>Vencimiento: ${driver.expires}</p>
      <p>${badge(driver.status)}</p>

      <div class="actions">
        ${actionButton("Actualizar licencia", `renew(${index})`, true)}
      </div>
    `
  );
}

function renew(index) {
  if (!requirePermission(canManage())) return;

  const driver = drivers[index];
  if (!driver) return;

  show(
    "Actualizar licencia",
    field("Número de licencia", "license", "text", driver.license) +
    field("Fecha de vencimiento", "expires", "date", driver.expires),
    data => {
      const license = data.get("license").trim();

      if (drivers.some((item, otherIndex) =>
        otherIndex !== index &&
        item.license.toLowerCase() === license.toLowerCase()
      )) {
        toast("Esa licencia pertenece a otro conductor.");
        return;
      }

      driver.license = license;
      driver.expires = data.get("expires");

      const active = trips.find(trip =>
        trip.driver === driver.name && trip.status !== "Completado"
      );

      driver.status = active
        ? active.status === "En ruta" ? "En ruta" : "Asignado"
        : driver.expires < today ? "Bloqueado" : "Disponible";

      closeModal();
      render();
      toast("Documento actualizado");
    }
  );
}

/* =========================
   MANTENIMIENTO
   ========================= */

function jobForm() {
  if (!requirePermission(canMaintain())) return;

  const units = trucks.filter(truck =>
    !["En ruta", "Asignado"].includes(truck.status) &&
    !trips.some(trip =>
      trip.truck === truck.id && trip.status !== "Completado"
    )
  );

  if (!units.length) {
    toast("No hay unidades disponibles para ingresar al taller.");
    return;
  }

  show(
    "Nueva orden de trabajo",
    select("Unidad", "truck", units.map(truck => truck.id)) +
    field("Servicio o reparación", "type") +
    field("Costo estimado ($)", "cost", "number", "", 'min="0" step="0.01"'),
    data => {
      const truck = trucks.find(item => item.id === data.get("truck"));

      if (
        !truck ||
        ["En ruta", "Asignado"].includes(truck.status) ||
        trips.some(trip =>
          trip.truck === truck.id && trip.status !== "Completado"
        )
      ) {
        toast("La unidad ya no está disponible.");
        return;
      }

      jobs.push({
        id: nextId(jobs, "OT-", 41),
        truck: truck.id,
        type: data.get("type").trim(),
        cost: Number(data.get("cost")),
        status: "Pendiente"
      });

      truck.status = "En taller";

      closeModal();
      render();
      toast("Orden creada. Unidad enviada al taller");
    }
  );
}

function advanceJob(id) {
  if (!requirePermission(canMaintain())) return;

  const job = jobs.find(item => item.id === id);
  if (!job) return;

  if (job.status === "Terminado") {
    show(
      "Historial " + id,
      `
        <p>${job.truck} · ${esc(job.type)}</p>
        <p>Servicio terminado · Costo $${job.cost.toFixed(2)}</p>
      `
    );
    return;
  }

  job.status = job.status === "Pendiente" ? "En proceso" : "Terminado";

  const pending = jobs.some(item =>
    item.truck === job.truck && item.status !== "Terminado"
  );

  const truck = trucks.find(item => item.id === job.truck);

  if (!pending && truck) {
    truck.status = "Disponible";
  }

  render();
  toast("Orden actualizada: " + job.status);
}

/* =========================
   COMBUSTIBLE Y REPORTES
   ========================= */

function fuelForm() {
  if (!requirePermission(
    sessionActive && ["Gerencia", "Chofer"].includes(role)
  )) return;

  const permittedTrips = role === "Chofer"
    ? trips.filter(trip => trip.driver === demoDriver)
    : trips;

  if (!permittedTrips.length) {
    toast("No hay viajes para registrar combustible.");
    return;
  }

  show(
    "Registrar abastecimiento",
    select(
      "Viaje y unidad",
      "trip",
      permittedTrips.map(trip => ({
        value: trip.id,
        label: `${trip.id} · ${trip.truck} · ${trip.origin} → ${trip.dest}`
      }))
    ) +
    field("Fecha", "date", "date", today) +
    field("Litros abastecidos", "liters", "number", "", 'min="0.01" step="0.01"') +
    field("Costo total ($)", "cost", "number", "", 'min="0.01" step="0.01"') +
    field("Distancia recorrida (km)", "km", "number", "", 'min="0.01" step="0.01"'),
    data => {
      const trip = permittedTrips.find(item => item.id === data.get("trip"));
      const liters = Number(data.get("liters"));
      const cost = Number(data.get("cost"));
      const km = Number(data.get("km"));

      if (!trip || !(liters > 0 && cost > 0 && km > 0)) {
        toast("Revisa los datos del abastecimiento.");
        return;
      }

      fuel.unshift({
        truck: trip.truck,
        route: trip.origin + " → " + trip.dest,
        date: data.get("date"),
        liters,
        cost,
        km
      });

      closeModal();
      render();
      toast("Abastecimiento registrado");
    }
  );
}

function exportCSV() {
  if (!requirePermission(canManage())) return;

  const rows = [
    ["Unidad", "Ruta", "Fecha", "Litros", "Costo USD", "Distancia km"],
    ...fuel.map(item => [
      item.truck,
      item.route,
      item.date,
      item.liters,
      item.cost,
      item.km
    ])
  ];

  const csv = "\uFEFF" + rows.map(row =>
    row.map(value => {
      let text = String(value);

      if (/^[=+@-]/.test(text)) {
        text = "'" + text;
      }

      return '"' + text.replace(/"/g, '""') + '"';
    }).join(",")
  ).join("\r\n");

  const blob = new Blob([csv], {
    type: "text/csv;charset=utf-8"
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "El-Rapido-reporte-combustible.csv";

  document.body.append(link);
  link.click();
  link.remove();

  setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast("Reporte exportado");
}

/* =========================
   USUARIOS Y PERFIL
   ========================= */

function roleInfo(selectedRole) {
  if (!requirePermission(canManage())) return;

  show(
    "Permisos · " + selectedRole,
    navItems(selectedRole).map(item => `<p>✓ ${esc(item)}</p>`).join("")
  );
}

function userForm() {
  if (!requirePermission(canManage())) return;

  show(
    "Crear usuario",
    field("Nombre", "name") +
    field("Correo", "email", "email") +
    select("Rol", "role", availableRoles),
    data => {
      const email = data.get("email").trim().toLowerCase();

      if (users.some(user => user.email.toLowerCase() === email)) {
        toast("Ya existe un usuario con ese correo.");
        return;
      }

      if (!availableRoles.includes(data.get("role"))) {
        return;
      }

      users.push({
        name: data.get("name").trim(),
        email,
        role: data.get("role")
      });

      closeModal();
      render();
      toast("Usuario de demostración creado");
    }
  );
}

function profileForm() {
  if (!sessionActive) return;

  const selectedRole = role;

  show(
    "Editar contacto",
    field("Teléfono", "phone", "tel", profile[selectedRole].phone),
    data => {
      profile[selectedRole].phone = data.get("phone").trim();

      closeModal();
      render();
      toast("Contacto actualizado");
    }
  );
}

/* =========================
   ACCESO SIMULADO
   ========================= */

function togglePassword() {
  const input = document.getElementById("authpass");
  const button = document.getElementById("showpass");
  const visible = input.type === "password";

  input.type = visible ? "text" : "password";
  button.textContent = visible ? "Ocultar" : "Mostrar";
  button.setAttribute("aria-pressed", String(visible));
}

function renderAuth() {
  document.body.classList.add("auth");

  let inner = "";

  if (page === "Acceso") {
    inner = `
      <div class="eyebrow">ACCESO AL SISTEMA</div>
      <h1>Bienvenido de nuevo.</h1>
      <p>
        Ingresa a tu espacio de trabajo y mantén
        tu operación en movimiento.
      </p>

      <div
        class="profilechips"
        role="group"
        aria-label="Seleccionar perfil de demostración"
      >
        ${availableRoles.map(item => `
          <button
            type="button"
            data-profile="${item}"
            class="${authProfile === item ? "chosen" : ""}"
            aria-pressed="${authProfile === item}"
            onclick="chooseProfile('${item}')"
          >
            ${item}
          </button>
        `).join("")}
      </div>

      <form id="loginForm" onsubmit="event.preventDefault(); login()">
        <label for="authemail">Correo electrónico</label>
        <input
          id="authemail"
          type="email"
          autocomplete="username"
          placeholder="usuario@ejemplo.com"
          required
        >

        <label for="authpass">Contraseña</label>

        <div class="passwordwrap">
          <input
            id="authpass"
            type="password"
            autocomplete="current-password"
            minlength="4"
            placeholder="Contraseña de prueba"
            required
          >

          <button
            type="button"
            id="showpass"
            aria-pressed="false"
            onclick="togglePassword()"
          >
            Mostrar
          </button>
        </div>

        <div class="recovery-link">
          <button
            type="button"
            class="link"
            onclick="go('Recuperar acceso')"
          >
            ¿Olvidaste tu contraseña?
          </button>
        </div>

        <button type="submit" class="btn" id="loginButton">
          Iniciar sesión como ${authProfile.toLowerCase()} →
        </button>
      </form>

      <div class="notice">
        Prototipo: utiliza un correo ficticio y una contraseña
        de prueba de al menos 4 caracteres.
        No se validan cuentas reales.
      </div>

      <p class="authnote">
        ¿Necesitas una cuenta? Solicítala a la administración.
      </p>
    `;
  }

  if (page === "Recuperar acceso") {
    inner = `
      <div class="eyebrow">RECUPERACIÓN DE ACCESO</div>
      <h1>Recupera tu cuenta.</h1>
      <p>Ingresa el correo asociado a tu cuenta.</p>

      <form
        onsubmit="
          event.preventDefault();
          go('Confirmación de recuperación');
        "
      >
        <label for="recoveryemail">Correo electrónico</label>
        <input
          id="recoveryemail"
          type="email"
          autocomplete="email"
          placeholder="usuario@ejemplo.com"
          required
        >

        <button type="submit" class="btn">
          Solicitar recuperación →
        </button>
      </form>

      <button class="authback" onclick="go('Acceso')">
        ← Volver al inicio de sesión
      </button>

      <div class="notice">
        Vista de demostración. No envía correos ni cambia contraseñas.
      </div>
    `;
  }

  if (page === "Confirmación de recuperación") {
    inner = `
      <div class="successmark">✓</div>
      <div class="eyebrow">SOLICITUD DE RECUPERACIÓN</div>
      <h1>Solicitud registrada.</h1>

      <p>
        En el sistema final, recibirás instrucciones
        si el correo corresponde a una cuenta.
      </p>

      <div class="notice">
        Recorrido simulado completado. No se ha enviado ningún correo.
      </div>

      <button class="btn" onclick="go('Acceso')">
        Volver al inicio de sesión →
      </button>

      <button class="authback" onclick="go('Recuperar acceso')">
        Usar otro correo
      </button>
    `;
  }

  document.getElementById("authroot").innerHTML = `
    <div class="authscreen">
      <section class="authstory">
        <div>
          <div class="brand">EL RÁPIDO<b>↗</b></div>
          <div class="subtitle">GESTIÓN DE FLOTAS</div>
        </div>

        <div>
          <div class="eyebrow">CADA VIAJE CUENTA</div>

          <h2>
            Una flota conectada.<br>
            Una operación<br>
            que avanza.
          </h2>

          <p>
            Viajes, conductores y mantenimiento.
            Todo lo que necesitas para coordinar el camino.
          </p>
        </div>

        <footer>
          Transportes El Rápido · Nivex Developers Inc.
          <br><br>
          Prototipo de interfaz · 2026
        </footer>
      </section>

      <section class="authformarea">
        <div class="authbox">${inner}</div>
      </section>
    </div>
  `;
}

/* Los cambios del prototipo permanecen en memoria.
   Al recargar la página se restauran los datos de muestra. */

go("Acceso");