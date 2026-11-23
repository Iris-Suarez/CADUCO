AFRAME.registerComponent('pov-caduco', {
    init: function () {
        var componente = this;
        this.activo = false;
        this.enIntro = false;
        this.camara = document.getElementById('camara-principal');
        this.techo = document.getElementById('techo-pov');
        this.techoAnexo = document.getElementById('techo-anexo-pov');
        this.paredFrontal = document.getElementById('pared-frontal-pov');
        this.paredFrontalAnexo = document.getElementById('pared-frontal-anexo');
        this.teclas = Object.create(null);
        this.botones = Object.create(null);
        this.yaw = 0.45;
        this.pitch = 0.22;
        this.arrastrando = false;
        this.idPuntero = null;
        this.ultimoX = 0;
        this.ultimoY = 0;
        this.controlesTactiles = [];
        this.velocidad = 1.15;
        this.ultimoPaso = -Infinity;
        this.cadenciaPasos = 440;
        this.introInicio = null;
        this.introDuracion = 3200;

        this.alTeclaBajar = function (e) {
            var tag = e.target && e.target.tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
            if (!componente.activo || componente.visorAbierto() || componente.enIntro) return;
            if (componente.esTeclaMovimiento(e.code)) {
                e.preventDefault();
                componente.teclas[e.code] = true;
            }
        };
        this.alTeclaSubir = function (e) { delete componente.teclas[e.code]; };
        this.alPerderFoco = function () {
            componente.teclas = Object.create(null);
            componente.botones = Object.create(null);
            componente.arrastrando = false;
            componente.idPuntero = null;
        };
        this.alVisibilidad = function () { if (document.hidden) componente.alPerderFoco(); };

        window.addEventListener('keydown', this.alTeclaBajar);
        window.addEventListener('keyup', this.alTeclaSubir);
        window.addEventListener('blur', this.alPerderFoco);
        document.addEventListener('visibilitychange', this.alVisibilidad);

        var botones = document.querySelectorAll('[data-pov-direccion]');
        Array.prototype.forEach.call(botones, function (boton) {
            var direccion = boton.getAttribute('data-pov-direccion');
            var bajar = function (e) {
                if (!componente.activo || componente.enIntro) return;
                e.preventDefault();
                componente.botones[direccion] = true;
                if (boton.setPointerCapture) {
                    try { boton.setPointerCapture(e.pointerId); } catch (error) {}
                }
            };
            var subir = function (e) { e.preventDefault(); componente.botones[direccion] = false; };
            boton.addEventListener('pointerdown', bajar);
            boton.addEventListener('pointerup', subir);
            boton.addEventListener('pointercancel', subir);
            boton.addEventListener('lostpointercapture', subir);
            componente.controlesTactiles.push({ boton: boton, bajar: bajar, subir: subir });
        });

        this.alPunteroBajar = function (e) {
            if (!componente.activo || componente.enIntro || componente.visorAbierto()) return;
            if (e.button !== 0) return;
            componente.arrastrando = true;
            componente.idPuntero = e.pointerId;
            componente.ultimoX = e.clientX;
            componente.ultimoY = e.clientY;
        };
        this.alPunteroMover = function (e) {
            if (!componente.activo || componente.enIntro || !componente.arrastrando || componente.idPuntero !== e.pointerId) return;
            if (componente.visorAbierto()) return;
            var dx = e.clientX - componente.ultimoX;
            var dy = e.clientY - componente.ultimoY;
            componente.ultimoX = e.clientX;
            componente.ultimoY = e.clientY;
            componente.yaw -= dx * 0.0034;
            componente.pitch -= dy * 0.0034;
            componente.pitch = Math.max(-1.14, Math.min(1.14, componente.pitch));
            componente.aplicarOrientacion();
        };
        this.alPunteroSoltar = function (e) {
            if (componente.idPuntero === e.pointerId) {
                componente.arrastrando = false;
                componente.idPuntero = null;
            }
        };
        this.alContexto = function (e) { if (componente.activo) e.preventDefault(); };

        var conectarCanvas = function () {
            if (componente.canvasConectado || !componente.el.canvas) return;
            var canvas = componente.el.canvas;
            componente.canvas = canvas;
            componente.canvasConectado = true;
            canvas.addEventListener('pointerdown', componente.alPunteroBajar);
            canvas.addEventListener('pointermove', componente.alPunteroMover);
            canvas.addEventListener('pointerup', componente.alPunteroSoltar);
            canvas.addEventListener('pointercancel', componente.alPunteroSoltar);
            canvas.addEventListener('contextmenu', componente.alContexto);
        };
        if (this.el.canvas) conectarCanvas();
        else this.el.addEventListener('render-target-loaded', conectarCanvas);

        var autoEntrar = function () { componente.entrar(); };
        if (this.el.hasLoaded) window.setTimeout(autoEntrar, 120);
        else this.el.addEventListener('loaded', function () { window.setTimeout(autoEntrar, 120); }, { once: true });
    },

    esTeclaMovimiento: function (codigo) {
        return ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].indexOf(codigo) !== -1;
    },

    visorAbierto: function () {
        var visor = document.getElementById('visor-foto-overlay');
        return !!(visor && visor.classList.contains('activo'));
    },

    mensaje: function (texto) {
        if (window.CADUCOUI && window.CADUCOUI.mensaje) window.CADUCOUI.mensaje(texto);
    },

    entrar: function () {
        if (this.activo || !this.camara) return;
        this.activo = true;
        this.alPerderFoco();
        document.body.classList.add('modo-pov');
        if (this.techo) this.techo.setAttribute('visible', true);
        if (this.techoAnexo) this.techoAnexo.setAttribute('visible', true);
        if (this.paredFrontal) this.paredFrontal.setAttribute('visible', true);
        if (this.paredFrontalAnexo) this.paredFrontalAnexo.setAttribute('visible', true);
        this.camara.setAttribute('camera', 'fov', 74);
        this.desdePos = new THREE.Vector3(-0.98, 0.79, -4.24);
        this.hastaPos = new THREE.Vector3(-0.98, 1.46, -4.24);
        this.yawInicio = Math.PI; // pies hacia pared nueva (+Z), cabeza junto a cabecera.
        this.pitchInicio = 1.48;   // casi totalmente hacia arriba.
        this.yawMuro = Math.PI;   // se incorpora y sigue mirando pared nueva.
        this.pitchMuro = 0.08;     // ya incorporado, casi al horizonte.
        this.yawFinal = 4.56;    // giro corto desde la pared nueva hacia la puerta.
        this.pitchFinal = -0.10;
        this.camara.object3D.position.copy(this.desdePos);
        this.yaw = this.yawInicio;
        this.pitch = this.pitchInicio;
        this.aplicarOrientacion();
        this.enIntro = true;
        this.introInicio = null;
        this.mensaje('Abro los ojos. El techo... otra vez esta habitación.');
    },

    aplicarOrientacion: function () {
        if (!this.camara) return;
        this.camara.object3D.rotation.set(this.pitch, this.yaw, 0, 'YXZ');
    },

    actualizarIntro: function (tiempo) {
        if (this.introInicio === null) this.introInicio = tiempo;
        var t = Math.max(0, Math.min(1, (tiempo - this.introInicio) / this.introDuracion));
        if (t >= 1) {
            this.enIntro = false;
            this.camara.object3D.position.copy(this.hastaPos);
            this.yaw = this.yawFinal;
            this.pitch = this.pitchFinal;
            this.aplicarOrientacion();
            this.mensaje('Me incorporo y miro hacia la puerta. Puedo moverme.');
            return;
        }

        // Secuencia en tres etapas:
        // 1) quieto, acostado, mirando el techo.
        // 2) se incorpora y baja la vista mirando hacia el frente.
        // 3) ya sentado, gira la cabeza hasta mirar la puerta.
        var hold = 0.14;
        var faseMuroFin = 0.60;
        if (t <= hold) {
            this.camara.object3D.position.copy(this.desdePos);
            this.yaw = this.yawInicio;
            this.pitch = this.pitchInicio;
            this.aplicarOrientacion();
            return;
        }

        var kPos, kGiro;
        if (t <= faseMuroFin) {
            kPos = (t - hold) / (faseMuroFin - hold);
            kPos = kPos * kPos * (3 - 2 * kPos);
            this.camara.object3D.position.lerpVectors(this.desdePos, this.hastaPos, kPos);
            this.yaw = this.yawInicio + (this.yawMuro - this.yawInicio) * kPos;
            this.pitch = this.pitchInicio + (this.pitchMuro - this.pitchInicio) * kPos;
        } else {
            this.camara.object3D.position.copy(this.hastaPos);
            kGiro = (t - faseMuroFin) / (1 - faseMuroFin);
            kGiro = kGiro * kGiro * (3 - 2 * kGiro);
            this.yaw = this.yawMuro + (this.yawFinal - this.yawMuro) * kGiro;
            this.pitch = this.pitchMuro + (this.pitchFinal - this.pitchMuro) * kGiro;
        }
        this.aplicarOrientacion();
    },

    posicionPermitida: function (x, z) {
        var radio = 0.14;
        // El pasillo detrás de la puerta es decorado: nunca se puede atravesar.
        if (x < -1.75 || x > 1.72 || z < -5.48 || z > -1.40) return false;

        // El protagonista despierta dentro de la cama. Se le permite salir,
        // pero se impide regresar a atravesarla una vez que llega al suelo.
        var camaMinX = -1.95 - radio;
        var camaMaxX = -0.55 + radio;
        var camaMinZ = -5.50 - radio;
        var camaMaxZ = -3.50 + radio;
        var origen = this.camara.object3D.position;
        var origenEnCama = origen.x > camaMinX && origen.x < camaMaxX &&
                           origen.z > camaMinZ && origen.z < camaMaxZ;
        var destinoEnCama = x > camaMinX && x < camaMaxX &&
                            z > camaMinZ && z < camaMaxZ;
        if (destinoEnCama && !origenEnCama) return false;
        if (x > 0.39 - radio && x < 1.80 + radio && z > -5.64 - radio && z < -4.97 + radio) return false;
        var silla = document.getElementById('silla');
        if (silla) {
            var p = silla.object3D.position;
            if (Math.abs(x - p.x) < 0.28 + radio && Math.abs(z - p.z) < 0.29 + radio) return false;
        }
        return true;
    },

    tick: function (tiempo, delta) {
        if (!this.activo || !this.camara || this.visorAbierto()) return;
        if (this.enIntro) {
            this.actualizarIntro(tiempo);
            return;
        }
        var adelante = (this.teclas.KeyW || this.teclas.ArrowUp || this.botones.adelante ? 1 : 0) -
                       (this.teclas.KeyS || this.teclas.ArrowDown || this.botones.atras ? 1 : 0);
        var lateral = (this.teclas.KeyD || this.teclas.ArrowRight || this.botones.derecha ? 1 : 0) -
                      (this.teclas.KeyA || this.teclas.ArrowLeft || this.botones.izquierda ? 1 : 0);
        if (!adelante && !lateral) return;
        var longitud = Math.sqrt(adelante * adelante + lateral * lateral);
        adelante /= longitud;
        lateral /= longitud;
        var dt = Math.min(Math.max(delta || 0, 0) / 1000, 0.05);
        var paso = this.velocidad * dt;
        var x = this.camara.object3D.position.x;
        var z = this.camara.object3D.position.z;
        var origenX = x;
        var origenZ = z;
        var dx = (-Math.sin(this.yaw) * adelante + Math.cos(this.yaw) * lateral) * paso;
        var dz = (-Math.cos(this.yaw) * adelante - Math.sin(this.yaw) * lateral) * paso;
        if (this.posicionPermitida(x + dx, z)) x += dx;
        if (this.posicionPermitida(x, z + dz)) z += dz;
        this.camara.object3D.position.set(x, this.camara.object3D.position.y, z);

        // Solo suenan pasos cuando la cámara se desplazó de verdad.
        // Al empujar una pared u otro obstáculo, no se reproducen.
        if ((Math.abs(x - origenX) + Math.abs(z - origenZ)) > 0.00001 &&
            tiempo - this.ultimoPaso >= this.cadenciaPasos) {
            if (window.CADUCOSonidos) window.CADUCOSonidos.reproducir('pasos');
            this.ultimoPaso = tiempo;
        }
    },

    remove: function () {
        window.removeEventListener('keydown', this.alTeclaBajar);
        window.removeEventListener('keyup', this.alTeclaSubir);
        window.removeEventListener('blur', this.alPerderFoco);
        document.removeEventListener('visibilitychange', this.alVisibilidad);
        this.controlesTactiles.forEach(function (item) {
            item.boton.removeEventListener('pointerdown', item.bajar);
            item.boton.removeEventListener('pointerup', item.subir);
            item.boton.removeEventListener('pointercancel', item.subir);
            item.boton.removeEventListener('lostpointercapture', item.subir);
        });
        if (this.canvas) {
            this.canvas.removeEventListener('pointerdown', this.alPunteroBajar);
            this.canvas.removeEventListener('pointermove', this.alPunteroMover);
            this.canvas.removeEventListener('pointerup', this.alPunteroSoltar);
            this.canvas.removeEventListener('pointercancel', this.alPunteroSoltar);
            this.canvas.removeEventListener('contextmenu', this.alContexto);
        }
    }
});
