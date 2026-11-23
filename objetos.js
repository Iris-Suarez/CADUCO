(function () {
    'use strict';

    function pensar(texto) {
        if (window.CADUCOUI && window.CADUCOUI.mensaje) {
            window.CADUCOUI.mensaje(texto);
        }
    }

    function admitirClic(componente, margen) {
        var ahora = Date.now();
        if (ahora - (componente.ultimoClic || 0) < (margen || 350)) return false;
        componente.ultimoClic = ahora;
        return true;
    }

    AFRAME.registerComponent('relato-cama', {
        init: function () {
            var componente = this;
            this.alClic = function (evento) {
                if (evento && evento.stopPropagation) evento.stopPropagation();
                if (!admitirClic(componente, 350)) return;
                pensar('Tengo que tender la cama antes de que mamá vuelva a revisar el cuarto.');
            };
            this.el.addEventListener('click', this.alClic);
        },
        remove: function () { this.el.removeEventListener('click', this.alClic); }
    });

    AFRAME.registerComponent('mover-silla-caduco', {
        init: function () {
            var componente = this;
            this.silla = document.getElementById('silla');
            this.abierta = false;
            this.ocupada = false;
            this.temporizador = null;
            this.alClic = function (evento) {
                if (evento && evento.stopPropagation) evento.stopPropagation();
                if (!admitirClic(componente, 400) || componente.ocupada) return;
                componente.mover();
            };
            this.el.addEventListener('click', this.alClic);
        },
        mover: function () {
            if (!this.silla) return;
            if (window.CADUCOSonidos) window.CADUCOSonidos.reproducir('silla');
            var desde = this.silla.getAttribute('position');
            var destinoZ = this.abierta ? -4.50 : -4.23;
            this.ocupada = true;
            this.silla.removeAttribute('animation__mover_caduco');
            this.silla.setAttribute('animation__mover_caduco', {
                property: 'position',
                from: desde.x + ' ' + desde.y + ' ' + desde.z,
                to: '1.1 0.5 ' + destinoZ,
                dur: 900,
                easing: 'easeInOutSine'
            });
            this.abierta = !this.abierta;
            pensar(this.abierta ?
                'La silla se arrastra por el piso. Espero que mamá no haya escuchado...' :
                'Mejor dejar la silla en su lugar. No debo hacer ruido.');
            var componente = this;
            this.temporizador = window.setTimeout(function () {
                componente.ocupada = false;
                componente.temporizador = null;
            }, 930);
        },
        remove: function () {
            if (this.temporizador) window.clearTimeout(this.temporizador);
            this.el.removeEventListener('click', this.alClic);
        }
    });

    AFRAME.registerComponent('recuerdo-planta-caduco', {
        init: function () {
            var componente = this;
            this.numero = 0;
            this.recuerdos = [
                'Mamá regaba esta planta todas las mañanas. Antes era diferente...',
                'Ahora la cuido yo. No quiero que se marchite como todo lo demás.',
                'Todavía crece junto a la ventana. Me recuerda que afuera sigue habiendo vida.'
            ];
            this.alClic = function (evento) {
                if (evento && evento.stopPropagation) evento.stopPropagation();
                if (!admitirClic(componente, 350)) return;
                pensar(componente.recuerdos[componente.numero]);
                componente.numero = (componente.numero + 1) % componente.recuerdos.length;
            };
            this.el.addEventListener('click', this.alClic);
        },
        remove: function () { this.el.removeEventListener('click', this.alClic); }
    });

    AFRAME.registerComponent('lampara-mesa-caduco', {
        init: function () {
            var componente = this;
            this.prendida = false;
            this.luz = document.getElementById('luz-lampara-mesa');
            this.brillo = document.getElementById('resplandor-lampara-mesa');
            this.alClic = function (evento) {
                if (evento && evento.stopPropagation) evento.stopPropagation();
                if (!admitirClic(componente, 380)) return;
                componente.alternar();
            };
            this.el.addEventListener('click', this.alClic);
            this.pintar();
        },
        alternar: function () {
            if (window.CADUCOSonidos) window.CADUCOSonidos.reproducir('interruptorMesa');
            this.prendida = !this.prendida;
            this.pintar();
            pensar(this.prendida ?
                'Enciendo la lámpara del escritorio.' :
                'Apago la lámpara del escritorio. Mejor no llamar la atención desde el pasillo.');
        },
        pintar: function () {
            if (this.luz) this.luz.setAttribute('light', 'intensity', this.prendida ? 0.82 : 0);
            if (this.brillo) {
                this.brillo.setAttribute('material', 'emissive', this.prendida ? '#FFE6B3' : '#000000');
                this.brillo.setAttribute('material', 'emissiveIntensity', this.prendida ? 1.05 : 0);
                this.brillo.setAttribute('material', 'color', this.prendida ? '#FFF2D2' : '#B8B1A0');
            }
        },
        remove: function () {
            this.el.removeEventListener('click', this.alClic);
        }
    });
})();
