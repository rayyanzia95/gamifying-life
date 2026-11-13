window.CityBuildings = window.CityBuildings || {};
window.CityBuildings.chores = function (tier, palette) {
    const group = new THREE.Group();
    const { geos, mats } = window.CityUtils.setup(palette);
    const add = window.CityUtils.createAdder(group, geos, mats);

    if (tier === 1) {
        add('b', 'l', 0, 0, 0, 0.45, 0.45, 0.45); // sturdy shed
        add('p4', 'm', 0, 0.45, 0, 0.5, 0.25, 0.5);
        add('b', 'd', 0.25, 0, 0, 0.05, 0.35, 0.05, 0, 0, -0.2); // leaning broom handle
        add('b', 'a', 0.3, 0, 0, 0.15, 0.1, 0.1, 0, 0, -0.2); // broom bristles
    } else if (tier === 2) {
        add('b', 'd', 0, 0, 0, 0.7, 0.05, 0.7); // floor
        add('b', 'l', -0.1, 0.05, -0.1, 0.5, 0.5, 0.5);
        add('p4', 'd', -0.1, 0.55, -0.1, 0.6, 0.3, 0.6); // roof
        add('b', 'm', 0.25, 0.05, 0.1, 0.3, 0.3, 0.3); // workshop extension
        add('c', 'a', 0.3, 0.35, 0.1, 0.1, 0.4, 0.1); // smokestack
    } else if (tier === 3) {
        add('b', 'd', 0, 0, 0, 0.9, 0.05, 0.9);
        add('b', 'l', -0.1, 0.05, -0.1, 0.6, 0.6, 0.6); // house
        add('p4', 'a', -0.1, 0.65, -0.1, 0.7, 0.5, 0.7); // roof
        add('b', 'm', 0.2, 0.05, 0.3, 0.4, 0.1, 0.3); // raised garden bed
        add('s8', 'g', 0.1, 0.15, 0.3, 0.1, 0.1, 0.1); // glowing crops
        add('s8', 'g', 0.3, 0.15, 0.3, 0.1, 0.1, 0.1);
    } else if (tier === 4) {
        add('b', 'd', 0, 0, 0, 1.0, 0.05, 1.0); // massive estate grounds
        add('b', 'l', -0.2, 0.05, -0.2, 0.5, 0.6, 0.5);
        add('p4', 'm', -0.2, 0.65, -0.2, 0.55, 0.4, 0.55);
        
        // Windmill
        add('p4', 'l', 0.3, 0.05, -0.2, 0.3, 1.0, 0.3);
        let blades = new THREE.Group();
        blades.position.set(0.3, 0.8, -0.05);
        let b1 = new THREE.Mesh(geos.b, mats.a); b1.scale.set(0.7, 0.1, 0.02);
        let b2 = new THREE.Mesh(geos.b, mats.a); b2.scale.set(0.1, 0.7, 0.02);
        blades.add(b1, b2);
        blades.userData.anim = "spin";
        group.add(blades);

        // Advanced laundry/processing line
        add('b', 'm', -0.3, 0.05, 0.3, 0.8, 0.2, 0.3);
        add('b', 'g', -0.1, 0.25, 0.3, 0.4, 0.05, 0.2).userData.anim = "flicker";
    } else if (tier === 5) {
        // High-efficiency Automated Farm
        add('b', 'd', 0, 0, 0, 1.0, 0.1, 1.0);
        add('b', 'l', 0, 0.1, -0.2, 0.9, 0.7, 0.5); // large barn factory
        add('c', 'm', 0, 0.8, -0.2, 0.9, 0.9, 0.5, 0, 0, Math.PI/2); // curved roof
        
        // Giant Waterwheel (animated)
        let wheel = add('c', 'a', 0.5, 0.4, 0.2, 0.5, 0.2, 0.5, Math.PI/2);
        wheel.userData.anim = "spin";
        
        // Automated glowing silos
        add('c', 'g', -0.35, 0.1, 0.3, 0.2, 0.8, 0.2);
        add('c', 'g', -0.1, 0.1, 0.3, 0.2, 0.8, 0.2);
    } else {
        // Futuristic Eco-Arcology
        add('c', 'd', 0, 0, 0, 1.0, 0.2, 1.0); // circular foundation
        add('c', 'l', 0, 0.2, 0, 0.8, 1.5, 0.8); // central tower
        add('s8', 'g', 0, 1.7, 0, 0.6, 0.6, 0.6); // energy/sun sphere
        
        // Glowing vertical gardens
        for(let i=0; i<4; i++) {
            let angle = (i / 4) * Math.PI * 2;
            add('b', 'm', Math.cos(angle)*0.4, 0.2, Math.sin(angle)*0.4, 0.2, 1.2, 0.2);
            add('b', 'a', Math.cos(angle)*0.42, 0.5, Math.sin(angle)*0.42, 0.22, 0.6, 0.22);
        }

        // Flying drone processors
        let drone = add('b', 'a', 0.6, 1.0, 0, 0.2, 0.05, 0.2);
        drone.userData.anim = "bob";
        add('s8', 'g', 0.6, 0.95, 0, 0.1, 0.1, 0.1).userData.anim = "flicker";
    }
    return window.CityUtils.finishBuilding(group);
};
