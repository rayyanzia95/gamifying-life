window.CityProps = window.CityProps || {};

// Props use the low-poly keys (c8 / p4 / s8) to keep triangle counts low
window.CityProps._create = function(propType, palette) {
    const group = new THREE.Group();
    const { geos, mats } = window.CityUtils.setup(palette);
    const add = window.CityUtils.createAdder(group, geos, mats);

    if (propType === 'car') {
        // Cute chunky car
        add('b', 'm', 0, 0.05, 0, 0.4, 0.15, 0.2); // body
        add('b', 'l', -0.05, 0.2, 0, 0.2, 0.1, 0.18); // cabin/glass
        // Wheels
        [[-0.12, 0.1], [0.12, 0.1], [-0.12, -0.1], [0.12, -0.1]].forEach(([x,z]) => {
            add('c8', 'd', x, 0, z, 0.08, 0.02, 0.08, Math.PI/2);
        });
        add('b', 'g', 0.2, 0.1, 0.05, 0.02, 0.05, 0.05); // headlight
        add('b', 'g', 0.2, 0.1, -0.05, 0.02, 0.05, 0.05);
    } else if (propType === 'tree') {
        // Classic low-poly pine
        add('c8', 'd', 0, 0, 0, 0.05, 0.2, 0.05);
        add('p4', 'm', 0, 0.2, 0, 0.25, 0.3, 0.25);
        add('p4', 'm', 0, 0.35, 0, 0.2, 0.25, 0.2);
    } else if (propType === 'lamp') {
        add('c8', 'd', 0, 0, 0, 0.02, 0.5, 0.02);
        add('s8', 'g', 0, 0.5, 0, 0.08, 0.08, 0.08).userData.anim = "flicker";
    } else if (propType === 'bench') {
        add('b', 'd', 0, 0.1, 0, 0.3, 0.02, 0.1); // seat
        add('b', 'd', 0, 0.12, -0.05, 0.3, 0.1, 0.02); // back
        add('b', 'd', -0.1, 0, 0, 0.02, 0.1, 0.08); // legs
        add('b', 'd', 0.1, 0, 0, 0.02, 0.1, 0.08);
    }

    return group;
};

// Expose individual prop functions
window.CityProps.car = (pal) => window.CityProps._create('car', pal);
window.CityProps.tree = (pal) => window.CityProps._create('tree', pal);
window.CityProps.lamp = (pal) => window.CityProps._create('lamp', pal);
window.CityProps.bench = (pal) => window.CityProps._create('bench', pal);