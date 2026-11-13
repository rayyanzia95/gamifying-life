window.CityBuildings = window.CityBuildings || {};
window.CityBuildings.academics = function (tier, palette) {
    const group = new THREE.Group();
    const { geos, mats } = window.CityUtils.setup(palette);
    const add = window.CityUtils.createAdder(group, geos, mats);

    if (tier === 1) {
        add('b', 'd', 0, 0, 0, 0.5, 0.15, 0.4); // solid desk
        add('b', 'a', -0.1, 0.15, 0, 0.2, 0.05, 0.2); // open book base
        add('b', 'l', -0.1, 0.2, 0, 0.18, 0.02, 0.18); // pages
        add('c', 'm', 0.15, 0.15, -0.1, 0.03, 0.4, 0.03); // lamp neck
        add('s', 'g', 0.15, 0.55, -0.1, 0.12, 0.12, 0.12).userData.anim = "flicker"; // bright bulb
    } else if (tier === 2) {
        add('b', 'l', 0, 0, 0, 0.7, 0.5, 0.6);
        add('p4', 'm', 0, 0.5, 0, 0.75, 0.4, 0.65); // high pitched roof
        add('b', 'd', 0, 0, 0.31, 0.2, 0.3, 0.05); // grand double doors
    } else if (tier === 3) {
        add('b', 'd', 0, 0, 0, 0.9, 0.1, 0.7); // steps/base
        add('b', 'l', 0, 0.1, -0.1, 0.8, 0.6, 0.5); // main hall
        add('b', 'm', 0, 0.7, 0, 0.9, 0.15, 0.7); // grand flat roof
        [-0.35, -0.15, 0.15, 0.35].forEach(x => {
            add('c', 'l', x, 0.1, 0.2, 0.06, 0.6, 0.06); // classical pillars
        });
    } else if (tier === 4) {
        add('b', 'd', 0, 0, 0, 1.0, 0.1, 1.0); // campus ground
        add('b', 'l', -0.1, 0.1, -0.1, 0.7, 0.6, 0.6); // main wing
        add('b', 'm', -0.1, 0.7, -0.05, 0.75, 0.15, 0.75);
        // Tall Clock Tower
        add('b', 'a', 0.35, 0.1, 0.2, 0.3, 1.8, 0.3);
        add('p4', 'd', 0.35, 1.9, 0.2, 0.35, 0.6, 0.35);
        let clock = add('c', 'g', 0.35, 1.6, 0.36, 0.15, 0.02, 0.15, Math.PI/2);
        // Observatory dome
        add('c', 'd', -0.2, 0.85, -0.2, 0.3, 0.2, 0.3);
        add('s', 'l', -0.2, 1.05, -0.2, 0.3, 0.3, 0.3);
    } else if (tier === 5) {
        // Grand University
        add('b', 'l', 0, 0, 0, 1.0, 0.8, 1.0); // massive block
        add('b', 'd', 0, 0.8, 0, 1.05, 0.1, 1.05); // roof lip
        // Multi-domes
        add('c', 'm', 0, 0.9, 0, 0.5, 0.2, 0.5); 
        add('s', 'a', 0, 1.1, 0, 0.5, 0.5, 0.5); // giant central dome
        [[-0.3, -0.3], [0.3, -0.3], [-0.3, 0.3], [0.3, 0.3]].forEach(([x,z]) => {
            add('s', 'm', x, 0.9, z, 0.2, 0.2, 0.2); // corner domes
        });
        // Grand library lit windows
        add('b', 'g', 0, 0.3, 0.51, 0.4, 0.4, 0.05); 
    } else {
        // Floating Arcane/Tech Academy
        let base = add('p4', 'd', 0, 0.5, 0, 1.0, 1.0, 1.0, Math.PI); // inverted pyramid base
        base.userData.anim = "bob";
        
        add('b', 'l', 0, 1.0, 0, 0.8, 0.8, 0.8); // main structure
        
        let powerCore = add('s', 'g', 0, 2.2, 0, 0.6, 0.6, 0.6); // massive glowing orb of knowledge
        powerCore.userData.anim = "flicker";
        
        // Orbiting glowing "books" or data slates
        let orbit = new THREE.Group();
        orbit.position.set(0, 2.2, 0);
        for(let i=0; i<3; i++) {
            let angle = (i / 3) * Math.PI * 2;
            let slate = new THREE.Mesh(geos.b, mats.a);
            slate.scale.set(0.2, 0.3, 0.05);
            slate.position.set(Math.cos(angle)*0.8, 0, Math.sin(angle)*0.8);
            slate.rotation.y = -angle;
            orbit.add(slate);
        }
        orbit.userData.anim = "spin";
        group.add(orbit);
    }
    return window.CityUtils.finishBuilding(group);
};
