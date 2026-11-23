AFRAME.registerComponent('ciclo-puerta-terror', {
    init: function () {
        var componente = this;
        this.temporizadores = [];
        this.ocupada = false;
        this.alClic = function (event) {
            if (event.stopPropagation) event.stopPropagation();
            if (window.CADUCOUI) window.CADUCOUI.mensaje('No puedo salir. Mamá puede estar del otro lado...');
        };
        this.iniciarControl = function () {
            componente.puerta = componente.el.querySelector('#puerta-pivote');
            componente.hoja = componente.el.querySelector('#puerta-hoja');
            if (componente.hoja) componente.hoja.addEventListener('click', componente.alClic);
            componente.programar(function () { componente.ciclo(); }, 12000);
        };
        this.escena = this.el.sceneEl;
        if (this.escena && !this.escena.hasLoaded) {
            this.escena.addEventListener('loaded', this.iniciarControl, { once: true });
        } else {
            this.iniciarControl();
        }
    },
    programar: function (accion, demora) {
        var componente = this;
        var id = window.setTimeout(function () {
            componente.temporizadores = componente.temporizadores.filter(function (v) { return v !== id; });
            accion();
        }, demora);
        this.temporizadores.push(id);
    },
    ciclo: function () {
        if (this.ocupada || !this.puerta) return;
        var componente = this;
        this.ocupada = true;
        this.puerta.emit('puerta-abrir');
        var sonidos = window.CADUCOSonidos;
        if (sonidos) sonidos.reproducir('puertaAbrir');

        this.programar(function () {
            var voz = sonidos ? sonidos.vozAleatoria() : 'mama01';
            var duracionVoz = sonidos ? sonidos.duracion(voz) : 2154;
            if (sonidos) sonidos.reproducir(voz);

            componente.programar(function () {
                componente.puerta.emit('puerta-cerrar');
                if (sonidos) sonidos.reproducir('puertaCerrar');
                componente.programar(function () {
                    componente.ocupada = false;
                    componente.programar(function () { componente.ciclo(); }, 17000 + Math.random() * 10000);
                }, 820);
            }, duracionVoz + 150);
        }, 1900);
    },
    remove: function () {
        this.temporizadores.forEach(function (id) { window.clearTimeout(id); });
        this.temporizadores = [];
        if (this.escena) this.escena.removeEventListener('loaded', this.iniciarControl);
        if (this.hoja) this.hoja.removeEventListener('click', this.alClic);
    }
});
