AFRAME.registerComponent('camara-orbital', {
        init: function () {
            if (document.body.classList.contains('solo-pov')) {
                this.actualizarCamara = function () {};
                return;
            }
            const camara = this.el.object3D;
            const objetivo = new THREE.Vector3(0, 1, -4);
            let distancia = 8;
            let horizontal = 0.7;
            let vertical = 0.35;
            let arrastrando = false;
            let anteriorX = 0;
            let anteriorY = 0;
            function actualizarCamara() {
                const x = distancia * Math.cos(vertical) * Math.sin(horizontal);
                const y = distancia * Math.sin(vertical);
                const z = distancia * Math.cos(vertical) * Math.cos(horizontal);

                camara.position.set(
                    objetivo.x + x,
                    objetivo.y + y,
                    objetivo.z + z
                );
                const puntoOpuesto = camara.position.clone().multiplyScalar(2).sub(objetivo);
                camara.lookAt(puntoOpuesto);
            }
            this.actualizarCamara = actualizarCamara;
            const enPOV = () => document.body.classList.contains('modo-pov');
            const escena = this.el.sceneEl;
            const configurarControles = () => {
                const canvas = escena.canvas;
                canvas.addEventListener('pointerdown', (evento) => {
                    if (enPOV() || evento.button !== 0) return;
                    arrastrando = true;
                    anteriorX = evento.clientX;
                    anteriorY = evento.clientY;
                    canvas.setPointerCapture(evento.pointerId);
                });
                canvas.addEventListener('pointermove', (evento) => {
                    if (enPOV()) { arrastrando = false; return; }
                    if (!arrastrando) return;
                    horizontal -= (evento.clientX - anteriorX) * 0.005;
                    vertical += (evento.clientY - anteriorY) * 0.005;
                    vertical = THREE.MathUtils.clamp(vertical, -0.2, 1.4);
                    anteriorX = evento.clientX;
                    anteriorY = evento.clientY;
                    actualizarCamara();
                });
                canvas.addEventListener('pointerup', () => { arrastrando = false; });
                canvas.addEventListener('pointercancel', () => { arrastrando = false; });
                canvas.addEventListener('wheel', (evento) => {
                    evento.preventDefault();
                    if (enPOV()) return;
                    distancia += evento.deltaY * 0.01;
                    distancia = THREE.MathUtils.clamp(distancia, 2, 15);
                    actualizarCamara();
                }, { passive: false });
                actualizarCamara();
            };
            if (escena.canvas) configurarControles();
            else escena.addEventListener('render-target-loaded', configurarControles, { once: true });
        }
    });
