// --- Función para formatear valor con puntos y signo $ ---
function formatearValor(input) {
    let valor = input.value.replace(/[^\d]/g, '');
    if (valor) {
        input.value = '$ ' + valor.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    } else {
        input.value = '';
    }
    actualizarLetras();
}

// --- Actualizar conversión a letras ---
function actualizarLetras() {
    const valorInput = document.getElementById('valor');
    if (!valorInput) return;
    const valorNumerico = valorInput.value.replace(/[^\d]/g, '');
    const letras = numeroALetras(valorNumerico);
    const letrasOut = document.getElementById('letras');
    if (letrasOut) letrasOut.value = letras;
}

// --- Agregar evento al campo valor ---
const valorField = document.getElementById('valor');
if (valorField) {
    valorField.addEventListener('input', function () {
        formatearValor(this);
    });
}

// --- Agregar fila a la tabla ---
function agregarFila() {
    const tbody = document.getElementById('tablaBody');
    if (!tbody) return;

    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td><input class="input-codigo" style="width:100%;border:none" /></td>
        <td><input class="input-cuenta" style="width:100%;border:none" /></td>
        <td><input class="input-debito" style="width:100%;border:none;text-align:right" type="text"
            oninput="this.value=this.value.replace(/[^\\d]/g,'');this.value=this.value?('$ '+this.value.replace(/\\B(?=(\\d{3})+(?!\\d))/g,'.')):'';" />
        </td>
        <td><input class="input-credito" style="width:100%;border:none;text-align:right" type="text"
            oninput="this.value=this.value.replace(/[^\\d]/g,'');this.value=this.value?('$ '+this.value.replace(/\\B(?=(\\d{3})+(?!\\d))/g,'.')):'';" />
        </td>
    `;
    tbody.appendChild(tr);

    const inputs = tr.querySelectorAll('input');
    inputs.forEach((input, index) => {
        input.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();

                if (index === inputs.length - 1) {
                    agregarFila();
                    setTimeout(() => {
                        const nuevaFila = tbody.lastElementChild;
                        nuevaFila.querySelector('.input-codigo').focus();
                    }, 0);
                } else {
                    inputs[index + 1].focus();
                }
            }
        });
    });
}

// --- Inicializar tabla con 4 filas ---
function inicializarTabla() {
    for (let i = 0; i < 4; i++) {
        agregarFila();
    }
}

// --- Cargar lista de pagos guardados ---
function cargarListaPagos() {
    try {
        const pagosGuardados = localStorage.getItem('pagosGuardados_iglesia');
        const listContainer = document.getElementById('savedList');

        if (!listContainer) return;

        if (!pagosGuardados) {
            listContainer.innerHTML = '<div class="empty-state">No hay pagos guardados aún</div>';
            return;
        }

        const pagos = JSON.parse(pagosGuardados) || [];

        if (pagos.length === 0) {
            listContainer.innerHTML = '<div class="empty-state">No hay pagos guardados aún</div>';
            return;
        }

        listContainer.innerHTML = '';

        pagos.forEach((pago, index) => {
            const item = document.createElement('div');
            item.className = 'saved-item';
            item.innerHTML = `
                <div class="saved-item-name">${pago.pagadoA || 'Sin nombre'}</div>
                <div class="saved-item-concept">${pago.concepto || 'Sin concepto'}</div>
                <div class="saved-item-actions">
                    <button class="btn-load" onclick="cargarPago(${index})">Cargar</button>
                    <button class="btn-delete" onclick="eliminarPago(${index})">✕</button>
                </div>
            `;
            listContainer.appendChild(item);
        });
    } catch (e) {
        console.error('Error al cargar lista:', e);
    }
}

// --- Guardar pago (Solución 1 aplicada) ---
function guardarPago() {
    const pagadoAInput = document.getElementById('pagado');
    const pagadoA = pagadoAInput ? pagadoAInput.value.trim() : '';

    if (!pagadoA) {
        alert('Debes completar al menos el campo "Pagado a" para guardar');
        return;
    }

    try {
        const getValue = (id) => {
            const el = document.getElementById(id);
            return el ? (el.value ? el.value.trim() : '') : '';
        };

        const getCheck = (id) => {
            const el = document.getElementById(id);
            return el ? el.checked : false;
        };

        const pago = {
            pagadoA,
            concepto: getValue('concepto'),
            ciudad: getValue('ciudad'),
            efectivo: getCheck('efectivo'),
            cc: getCheck('cc'),
            nit: getCheck('nit'),
            docNumero: getValue('docNumero'),
            elaboradoPor: getValue('elaboradoPor'),
            cuentas: []
        };

        // Cargar tabla
        const filas = document.querySelectorAll('#tablaBody tr');
        filas.forEach(fila => {
            const codigoInput = fila.querySelector('.input-codigo');
            const cuentaInput = fila.querySelector('.input-cuenta');

            const codigo = codigoInput ? codigoInput.value.trim() : '';
            const cuenta = cuentaInput ? cuentaInput.value.trim() : '';

            if (codigo || cuenta) {
                pago.cuentas.push({ codigo, cuenta });
            }
        });

        // Guardar
        let pagos = [];
        const pagosGuardados = localStorage.getItem('pagosGuardados_iglesia');
        if (pagosGuardados) pagos = JSON.parse(pagosGuardados);

        const idx = pagos.findIndex(p => p.pagadoA.toLowerCase() === pagadoA.toLowerCase());

        if (idx >= 0) {
            if (confirm(`Ya existe un pago guardado para "${pagadoA}". ¿Deseas actualizarlo?`)) {
                pagos[idx] = pago;
            } else {
                return;
            }
        } else {
            pagos.push(pago);
        }

        localStorage.setItem('pagosGuardados_iglesia', JSON.stringify(pagos));

        cargarListaPagos();
        alert('Pago guardado correctamente');

    } catch (e) {
        console.error('Error al guardar:', e);
        alert('Error al guardar el pago');
    }
}

// --- Cargar pago ---
function cargarPago(index) {
    try {
        const pagosGuardados = localStorage.getItem('pagosGuardados_iglesia');
        if (!pagosGuardados) return;

        const pagos = JSON.parse(pagosGuardados);
        const pago = pagos[index];

        resetAll();

        const setVal = (id, v) => {
            const el = document.getElementById(id);
            if (el) el.value = v || '';
        };

        const setCheck = (id, v) => {
            const el = document.getElementById(id);
            if (el) el.checked = v || false;
        };

        setVal('pagado', pago.pagadoA);
        setVal('concepto', pago.concepto);
        setVal('ciudad', pago.ciudad);
        setCheck('efectivo', pago.efectivo);
        setCheck('cc', pago.cc);
        setCheck('nit', pago.nit);
        setVal('docNumero', pago.docNumero);
        setVal('elaboradoPor', pago.elaboradoPor);

        const tbody = document.getElementById('tablaBody');
        if (tbody) tbody.innerHTML = '';

        const filasNecesarias = Math.max(4, pago.cuentas ? pago.cuentas.length : 0);
        for (let i = 0; i < filasNecesarias; i++) agregarFila();

        if (pago.cuentas) {
            const filas = document.querySelectorAll('#tablaBody tr');
            pago.cuentas.forEach((cuenta, i) => {
                if (i < filas.length) {
                    const fila = filas[i];
                    const inputCodigo = fila.querySelector('.input-codigo');
                    const inputCuenta = fila.querySelector('.input-cuenta');
                    if (inputCodigo) inputCodigo.value = cuenta.codigo || '';
                    if (inputCuenta) inputCuenta.value = cuenta.cuenta || '';
                }
            });
        }

        const fechaField = document.getElementById('fecha');
        if (fechaField) fechaField.value = new Date().toISOString().split('T')[0];

    } catch (e) {
        console.error('Error al cargar pago:', e);
        alert('Error al cargar el pago');
    }
}

// --- Eliminar pago ---
function eliminarPago(index) {
    if (!confirm('¿Estás seguro de eliminar este pago guardado?')) return;

    try {
        const pagosGuardados = localStorage.getItem('pagosGuardados_iglesia');
        if (!pagosGuardados) return;

        let pagos = JSON.parse(pagosGuardados);
        pagos.splice(index, 1);

        localStorage.setItem('pagosGuardados_iglesia', JSON.stringify(pagos));
        cargarListaPagos();
    } catch (e) {
        console.error('Error al eliminar:', e);
        alert('Error al eliminar el pago');
    }
}

// --- Reiniciar formulario ---
function resetAll() {
    document.querySelectorAll('input').forEach(i => {
        if (i.type !== 'checkbox') i.value = '';
        else i.checked = false;
    });
    document.querySelectorAll('textarea').forEach(t => t.value = '');

    const tbody = document.getElementById('tablaBody');
    if (tbody) {
        tbody.innerHTML = '';
        inicializarTabla();
    }
}

// --- Convertir número a letras ---
function numeroALetras(num) {
    num = parseInt(num);
    if (isNaN(num) || num === 0) return 'CERO PESOS M/CTE';
    if (num > 999999999) return 'VALOR DEMASIADO ALTO';

    function grupoTres(n) {
        const unidades = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
        const decenas = ['', 'diez', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
        const centenas = ['', 'cien', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];

        const c = Math.floor(n / 100);
        const d = Math.floor((n % 100) / 10);
        const u = n % 10;
        let t = '';

        if (c > 0) {
            if (c === 1 && (d > 0 || u > 0)) t += 'ciento ';
            else t += centenas[c] + ' ';
        }

        if (d > 0) {
            if (d === 1) {
                const esp = ['diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve'];
                return t + esp[u];
            } else if (d === 2 && u > 0) {
                return t + 'veinti' + unidades[u];
            } else {
                t += decenas[d];
                if (u > 0) t += ' y ' + unidades[u];
                return t;
            }
        }

        if (u > 0) t += unidades[u];
        return t.trim();
    }

    let millones = Math.floor(num / 1000000);
    let miles = Math.floor((num % 1000000) / 1000);
    let resto = num % 1000;
    let partes = [];

    if (millones > 0) partes.push(millones === 1 ? 'un millón' : grupoTres(millones) + ' millones');
    if (miles > 0) partes.push(miles === 1 ? 'mil' : grupoTres(miles) + ' mil');
    if (resto > 0) partes.push(grupoTres(resto));

    return partes.join(' ').toUpperCase() + ' PESOS M/CTE';
}

// --- Inicializar ---
inicializarTabla();
cargarListaPagos();
