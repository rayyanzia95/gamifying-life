window.CityBuildings = window.CityBuildings || {};
window.CityBuildings.people = function (tier, palette) {
    const group = new THREE.Group();
    const { geos, mats } = window.CityUtils.setup(palette);
    const add = window.CityUtils.createAdder(group, geos, mats);

    if (tier === 1) {
        add('c', 'd', 0, 0, 0, 0.05, 0.25, 0.05); // table leg
        add('c', 'l', 0, 0.25, 0, 0.25, 0.02, 0.25); // table top
        add('c', 'd', 0, 0.25, 0, 0.02, 0.5, 0.02); // pole
        add('p8', 'm', 0, 0.75, 0, 0.5, 0.15, 0.5); // nice umbrella
    } else if (tier === 2) {
        add('b', 'l', 0, 0, 0, 0.6, 0.5, 0.6); // local cafe
        add('b', 'm', 0, 0.5, 0, 0.65, 0.1, 0.65);
        add('b', 'a', 0, 0.3, 0.31, 0.5, 0.05, 0.2, 0.2); // angled awning
    } else if (tier === 3) {
        add('b', 'd', 0, 0, 0, 0.9, 0.05, 0.9); // plaza base
        add('b', 'l', -0.15, 0.05, -0.15, 0.5, 0.6, 0.5); // large cafe
        add('b', 'm', -0.15, 0.65, -0.15, 0.55, 0.1, 0.55);
        // Beautiful fountain
        add('c', 'a', 0.25, 0.05, 0.25, 0.3, 0.15, 0.3);
        add('c', 'g', 0.25, 0.2, 0.25, 0.25, 0.1, 0.25).userData.anim = "bob"; 
    } else if (tier === 4) {
        add('b', 'l', 0, 0, 0, 1.0, 0.05, 1.0); // grand plaza
        add('b', 'm', -0.2, 0.05, -0.2, 0.5, 0.6, 0.5); // cafe hub
        // Stage / Pavilion
        add('c', 'd', 0.25, 0.05, 0.25, 0.4, 0.1, 0.4);
        add('p8', 'a', 0.25, 0.5, 0.25, 0.4, 0.3, 0.4); 
        // Lampposts framing
        [[-0.4, 0.4], [0.4, -0.4], [0.4, 0.4]].forEach(([x,z]) => {
            add('c', 'd', x, 0.05, z, 0.03, 0.6, 0.03);
            add('s', 'g', x, 0.65, z, 0.1, 0.1, 0.1).userData.anim = "flicker";
        });
    } else if (tier === 5) {
        // Massive Amphitheater / Festival Ground
        add('b', 'd', 0, 0, 0, 1.0, 0.2, 1.0);
        add('c', 'l', 0, 0.2, 0, 0.9, 0.4, 0.9); // stadium base
        add('c', 'm', 0, 0.6, 0, 0.95, 0.1, 0.95); // ring roof
        
        // Holographic center stage
        add('c', 'a', 0, 0.2, 0, 0.4, 0.1, 0.4);
        let holo = add('c', 'g', 0, 0.8, 0, 0.3, 0.6, 0.3);
        holo.userData.anim = "flicker";
        
        // Surrounding light beacons
        for(let i=0; i<6; i++) {
            let angle = (i/6) * Math.PI * 2;
            add('c', 'a', Math.cos(angle)*0.45, 0.7, Math.sin(angle)*0.45, 0.05, 0.4, 0.05);
        }
    } else {
        // Global Nexus (Floating Network Hub)
        add('s', 'd', 0, 1.0, 0, 0.9, 0.9, 0.9); // massive core sphere
        add('s', 'g', 0, 1.0, 0, 0.95, 0.95, 0.95); // glowing lattice (emulated via intersecting geometry)
        
        // Orbiting network pathways
        let orbit = new THREE.Group();
        orbit.position.set(0, 1.0, 0);
        let path1 = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.05, 8, 32), mats.m);
        path1.rotation.x = Math.PI/2;
        let path2 = new THREE.Mesh(new THREE.TorusGeometry(0.8, 0.05, 8, 32), mats.a);
        path2.rotation.y = Math.PI/2;
        orbit.add(path1, path2);
        orbit.userData.anim = "spin";
        group.add(orbit);

        // Floating social platforms
        [[-0.8, 0.8], [0.8, -0.8]].forEach(([x, z]) => {
            let plat = add('c', 'l', x, 0.5, z, 0.3, 0.05, 0.3);
            plat.userData.anim = "bob";
        });
    }
    return window.CityUtils.finishBuilding(group);
};
