window.CityBuildings = window.CityBuildings || {};
window.CityProps = window.CityProps || {};

window.CityUtils = {
    setup: function(palette) {
        const mats = {
            m: new THREE.MeshStandardMaterial({ color: palette.main, flatShading: true }),
            a: new THREE.MeshStandardMaterial({ color: palette.accent, flatShading: true }),
            d: new THREE.MeshStandardMaterial({ color: palette.dark, flatShading: true }),
            l: new THREE.MeshStandardMaterial({ color: palette.light, flatShading: true }),
            g: new THREE.MeshStandardMaterial({ color: palette.glow, emissive: palette.glow, emissiveIntensity: 0.6, flatShading: true })
        };
        const geos = {
            b: new THREE.BoxGeometry(1, 1, 1),
            c: new THREE.CylinderGeometry(0.5, 0.5, 1, 16),
            c8: new THREE.CylinderGeometry(0.5, 0.5, 1, 8),
            c16: new THREE.CylinderGeometry(0.5, 0.5, 1, 16),
            p: new THREE.ConeGeometry(0.5, 1, 8),
            p4: new THREE.ConeGeometry(0.5, 1, 4),
            p8: new THREE.ConeGeometry(0.5, 1, 8),
            s: new THREE.SphereGeometry(0.5, 16, 16),
            s8: new THREE.SphereGeometry(0.5, 8, 8),
            t: new THREE.TorusGeometry(0.5, 0.1, 8, 16),
            t05: new THREE.TorusGeometry(0.5, 0.05, 8, 16),
            t05w: new THREE.TorusGeometry(0.5, 0.05, 8, 32),
            t15: new THREE.TorusGeometry(0.5, 0.15, 8, 16),
            tArc: new THREE.TorusGeometry(0.5, 0.1, 8, 16, Math.PI * 1.3)
        };
        return { mats, geos };
    },
    // Buildings are modelled ~1 unit wide; this fills most of a 6x6 grid cell.
    BUILDING_SCALE: 3,
    finishBuilding: function(group) {
        group.scale.setScalar(window.CityUtils.BUILDING_SCALE);
        return group;
    },
    createAdder: function(group, geos, mats) {
        return (type, mat, x, y, z, sx, sy, sz, rx = 0, ry = 0, rz = 0) => {
            const mesh = new THREE.Mesh(geos[type], mats[mat]);
            mesh.position.set(x, y + sy / 2, z);
            mesh.scale.set(sx, sy, sz || sx);
            mesh.rotation.set(rx, ry, rz);
            mesh.castShadow = true; 
            mesh.receiveShadow = true;
            group.add(mesh);
            return mesh;
        };
    }
};
