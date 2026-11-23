(function () {
    'use strict';

    var fichas = {
        foto: {
            titulo: 'Fotografía familiar',
            descripcion: 'Mamá, mi hermana y yo. Antes de que me encerrara aquí. Antes de que el desapareciera. Cuesta recordar cuándo cambió todo...',
            imagen: 'assets/imagenes/foto_portarretrato.png',
            alt: 'Fotografía familiar'
        },
        jurassic: {
            titulo: 'Póster encontrado: Jurassic Park',
            descripcion: 'Un póster de Jurassic Park (1993). Es mi película favorita desde que mamá me regala una cada cumpleaños.',
            imagen: 'assets/imagenes/posters/jurassic_park_texturizado.png',
            alt: 'Póster de Jurassic Park'
        },
        leon: {
            titulo: 'Póster encontrado: Léon',
            descripcion: 'Un póster de Léon: El profesional (1994). Otro recuerdo de la habitación.',
            imagen: 'assets/imagenes/posters/leon_texturizado.png',
            alt: 'Póster de Léon'
        },
        nota: {
            titulo: 'Nota encontrada',
            descripcion: 'Reconozco mi letra. Debí esconder esta nota para que mamá no la encontrara.',
            texto: 'OTRA NOCHE ENCERRADO.\n\nMamá volvió a cerrar la puerta. Dice que es para protegerme, pero cada vez que se acerca me aterra.\n\nMi hermana sigue en el jardín. Puedo verla desde la ventana.\n\nMe pregunto que hay de malo en mi.'
        }
    };

    var temporizadorMensaje = null;
    var visorActivo = false;

    function mostrarMensaje(mensaje) {
        var elem = document.getElementById('mensaje-caduco');
        if (!elem) return;
        if (temporizadorMensaje !== null) window.clearTimeout(temporizadorMensaje);
        elem.textContent = mensaje;
        elem.classList.add('activo');
        temporizadorMensaje = window.setTimeout(function () {
            elem.classList.remove('activo');
            temporizadorMensaje = null;
        }, 2700);
    }

    function abrirFicha(tipo) {
        var ficha = fichas[tipo];
        var overlay = document.getElementById('visor-foto-overlay');
        if (!ficha || !overlay) return;
        var titulo = document.getElementById('visor-foto-titulo');
        var pie = document.getElementById('visor-foto-pie');
        var foto = document.getElementById('visor-foto-imagen');
        var documento = document.getElementById('visor-foto-documento');
        if (titulo) titulo.textContent = ficha.titulo;
        if (pie) pie.textContent = ficha.descripcion;
        if (foto && documento) {
            if (ficha.imagen) {
                foto.src = ficha.imagen;
                foto.alt = ficha.alt || ficha.titulo;
                foto.style.display = 'block';
                documento.style.display = 'none';
                documento.textContent = '';
            } else {
                foto.style.display = 'none';
                documento.textContent = ficha.texto || '';
                documento.style.display = 'block';
            }
        }
        overlay.classList.add('activo');
        overlay.setAttribute('aria-hidden', 'false');
        if (!visorActivo && window.CADUCOSonidos) window.CADUCOSonidos.reproducir('interaccionAbrir');
        visorActivo = true;
        var boton = document.getElementById('visor-foto-cerrar');
        if (boton) boton.focus();
    }

    function cerrarFicha() {
        var overlay = document.getElementById('visor-foto-overlay');
        if (!overlay || !visorActivo) return;
        if (window.CADUCOSonidos) window.CADUCOSonidos.reproducir('interaccionCerrar');
        overlay.classList.remove('activo');
        overlay.setAttribute('aria-hidden', 'true');
        visorActivo = false;
    }

    window.CADUCOUI = {
        mensaje: mostrarMensaje,
        abrirFicha: abrirFicha,
        cerrarFicha: cerrarFicha,
        visorAbierto: function () { return visorActivo; }
    };

    document.addEventListener('DOMContentLoaded', function () {
        var cerrar = document.getElementById('visor-foto-cerrar');
        var overlay = document.getElementById('visor-foto-overlay');
        if (cerrar) cerrar.addEventListener('click', cerrarFicha);
        if (overlay) overlay.addEventListener('click', function (event) {
            if (event.target === overlay) cerrarFicha();
        });
        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape' && visorActivo) cerrarFicha();
        });
    });
})();

AFRAME.registerComponent('examinar-caduco', {
    schema: { tipo: { type: 'string', default: 'foto' } },
    init: function () {
        var componente = this;
        this.alClic = function (event) {
            if (event.stopPropagation) event.stopPropagation();
            if (window.CADUCOUI) window.CADUCOUI.abrirFicha(componente.data.tipo);
        };
        this.el.addEventListener('click', this.alClic);
    },
    remove: function () { this.el.removeEventListener('click', this.alClic); }
});

AFRAME.registerComponent('hamaca-animada', {
    init: function () {
        var componente = this;
        this.ultimoTiempo = 0;
        this.anguloActual = 0;
        this.inicioImpulso = -Infinity;
        this.anguloInicialImpulso = 0;
        this.inicioSuave = -1;
        this.proximoSuave = 3600;
        this.ultimoClic = -Infinity;
        this.duracionSuave = 6200;
        this.escena = this.el.sceneEl;

        this.alClic = function (evento) {
            if (evento && evento.stopPropagation) evento.stopPropagation();
            componente.impulsar();
        };

        this.conectar = function () {
            componente.piernaIzquierda = componente.el.querySelector('#pierna_izquierda-pivote');
            componente.piernaDerecha = componente.el.querySelector('#pierna_derecha-pivote');
            componente.objetivo = componente.el.querySelector('#hermana-hamaca');
            componente.zonaTactil = componente.el.querySelector('#zona-toque-hamaca');
            if (componente.objetivo) componente.objetivo.addEventListener('click', componente.alClic);
            if (componente.zonaTactil) componente.zonaTactil.addEventListener('click', componente.alClic);
        };

        if (this.escena && !this.escena.hasLoaded) {
            this.escena.addEventListener('loaded', this.conectar, { once: true });
        } else {
            this.conectar();
        }
    },

    impulsar: function () {
        if (this.ultimoTiempo - this.ultimoClic < 320) return;
        this.ultimoClic = this.ultimoTiempo;
        this.anguloInicialImpulso = this.anguloActual;
        this.inicioImpulso = this.ultimoTiempo;
        this.inicioSuave = -1;
        this.proximoSuave = this.ultimoTiempo + 11000;
    },

    tick: function (tiempo) {
        this.ultimoTiempo = tiempo;
        var radianes = Math.PI / 180;
        var angulo = 0;
        var piernaIzq = 0;
        var piernaDer = 0;
        var desdeImpulso = (tiempo - this.inicioImpulso) / 1000;

        if (desdeImpulso >= 0 && desdeImpulso < 8.3) {
            var fase = 2.65 * desdeImpulso;
            var amortiguacion = Math.exp(-0.36 * desdeImpulso);
            angulo = this.anguloInicialImpulso * Math.exp(-2.2 * desdeImpulso) +
                     22 * amortiguacion * Math.sin(fase);

            piernaIzq = 30 * amortiguacion * (
                Math.sin(fase - 0.58) - Math.sin(-0.58) * Math.exp(-4 * desdeImpulso)
            );
            piernaDer = 25 * amortiguacion * (
                Math.sin(fase - 0.82) - Math.sin(-0.82) * Math.exp(-4 * desdeImpulso)
            );
        } else {
            if (tiempo >= this.proximoSuave && this.inicioSuave < 0) {
                this.inicioSuave = tiempo;
                this.proximoSuave = tiempo + this.duracionSuave + 10500;
            }
            if (this.inicioSuave >= 0) {
                var avance = (tiempo - this.inicioSuave) / this.duracionSuave;
                if (avance >= 1) {
                    this.inicioSuave = -1;
                } else {
                    var envolvente = Math.pow(Math.sin(Math.PI * avance), 2);
                    var faseSuave = 2.50 * (tiempo - this.inicioSuave) / 1000;
                    angulo = 11 * envolvente * Math.sin(faseSuave);
                    piernaIzq = 18 * envolvente * Math.sin(faseSuave - 0.58);
                    piernaDer = 15 * envolvente * Math.sin(faseSuave - 0.82);
                }
            }
        }

        angulo = Math.max(-24, Math.min(24, angulo));
        piernaIzq = Math.max(-36, Math.min(36, piernaIzq));
        piernaDer = Math.max(-32, Math.min(32, piernaDer));
        this.anguloActual = angulo;
        this.el.object3D.rotation.z = angulo * radianes;
        if (this.piernaIzquierda) this.piernaIzquierda.object3D.rotation.z = piernaIzq * radianes;
        if (this.piernaDerecha) this.piernaDerecha.object3D.rotation.z = piernaDer * radianes;
    },

    remove: function () {
        if (this.escena) this.escena.removeEventListener('loaded', this.conectar);
        if (this.objetivo) this.objetivo.removeEventListener('click', this.alClic);
        if (this.zonaTactil) this.zonaTactil.removeEventListener('click', this.alClic);
    }
});

AFRAME.registerComponent('cajon-caduco', {
    schema: { documento: { type: 'boolean', default: false } },
    init: function () {
        var componente = this;
        var pos = this.el.getAttribute('position');
        this.x = pos.x;
        this.y = pos.y;
        this.z = pos.z;
        this.abierto = false;
        this.temporizador = null;
        this.alClic = function (event) {
            if (event.stopPropagation) event.stopPropagation();
            componente.alternar();
        };
        this.iniciarControl = function () {
            componente.frente = componente.el.querySelector('.interactivo');
            componente.nota = componente.el.querySelector('#nota-cajon');
            if (componente.frente) componente.frente.addEventListener('click', componente.alClic);
        };
        this.escena = this.el.sceneEl;
        if (this.escena && !this.escena.hasLoaded) {
            this.escena.addEventListener('loaded', this.iniciarControl, { once: true });
        } else {
            this.iniciarControl();
        }
    },
    alternar: function () {
        this.abierto = !this.abierto;
        if (this.temporizador !== null) window.clearTimeout(this.temporizador);
        var actual = this.el.getAttribute('position');
        var destinoZ = this.z + (this.abierto ? 0.19 : 0);
        this.el.removeAttribute('animation__abrir_cajon');
        this.el.setAttribute('animation__abrir_cajon', {
            property: 'position',
            from: actual.x + ' ' + actual.y + ' ' + actual.z,
            to: this.x + ' ' + this.y + ' ' + destinoZ,
            dur: 530,
            easing: 'easeInOutSine'
        });
        if (this.nota) {
            if (!this.abierto) this.nota.setAttribute('visible', false);
            else {
                var nota = this.nota;
                this.temporizador = window.setTimeout(function () {
                    nota.setAttribute('visible', true);
                }, 350);
            }
        }
        if (this.abierto && !this.data.documento && window.CADUCOUI) {
            window.CADUCOUI.mensaje('El cajón está vacío.');
        }
    },
    remove: function () {
        if (this.temporizador !== null) window.clearTimeout(this.temporizador);
        if (this.escena) this.escena.removeEventListener('loaded', this.iniciarControl);
        if (this.frente) this.frente.removeEventListener('click', this.alClic);
    }
});
