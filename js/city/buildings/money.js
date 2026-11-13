window.CityBuildings = window.CityBuildings || {};
window.CityBuildings.money = function (tier, palette) {
    const group = new THREE.Group();
    const { geos, mats } = window.CityUtils.setup(palette);
    const add = window.CityUtils.createAdder(group, geos, mats);

    if (tier === 1) {
        // T1: Modern ATM / Kiosk
        add('b', 'l', 0, 0, 0, 0.4, 0.5, 0.4);
        add('b', 'm', 0, 0.5, 0, 0.45, 0.1, 0.45);
        let screen = add('b', 'g', 0, 0.2, 0.21, 0.2, 0.15, 0.05);
        screen.userData.anim = "flicker";
    } else if (tier === 2) {
        // T2: Classic Bank Branch
        add('b', 'l', 0, 0, 0, 0.7, 0.6, 0.7);
        add('b', 'd', 0, 0.6, 0, 0.8, 0.15, 0.8);
        [-0.25, 0.25].forEach(x => add('c', 'm', x, 0, 0.4, 0.1, 0.6, 0.1)); // pillars
        add('c', 'a', 0, 0.3, 0.36, 0.2, 0.05, 0.2, Math.PI/2).userData.anim = "spin"; // sign
    } else if (tier === 3) {
        // T3: Mid-rise Commercial Hub
        add('b', 'd', 0, 0, 0, 0.8, 0.3, 0.8); // base
        add('b', 'l', 0, 0.3, 0, 0.6, 1.2, 0.6); // main block
        [-0.3, 0, 0.3].forEach(z => add('b', 'g', 0.31, 0.5, z, 0.05, 0.8, 0.1)); // lit window strips
        add('b', 'm', 0, 1.5, 0, 0.65, 0.1, 0.65); // roof
    } else if (tier === 4) {
        // T4: High-rise Skyscraper with Ticker
        add('b', 'l', 0, 0, 0, 0.8, 0.4, 0.8);
        add('c8', 'a', 0, 0.4, 0, 0.6, 2.0, 0.6); // octagonal tower
        add('c8', 'l', 0, 0.5, 0, 0.62, 1.8, 0.62); // glass cladding
        let ticker = add('c8', 'g', 0, 1.0, 0, 0.65, 0.2, 0.65);
        ticker.userData.anim = "flicker";
        add('p4', 'm', 0, 2.4, 0, 0.6, 0.6, 0.6); // spire base
        add('c', 'm', 0, 3.0, 0, 0.05, 0.8, 0.05); // spire tip
    } else if (tier === 5) {
        // T5: Mega-Corp Twin Arcology
        add('b', 'd', 0, 0, 0, 0.9, 0.3, 0.9); // grand base
        [-0.25, 0.25].forEach(x => {
            add('b', 'l', x, 0.3, 0, 0.35, 2.5, 0.6); // twin towers
            add('b', 'a', x, 2.8, 0, 0.35, 0.4, 0.6); // tower caps
            add('c', 'g', x, 0.4, 0.31, 0.1, 2.3, 0.1); // neon vertical lines
        });
        add('b', 'm', 0, 1.5, 0, 0.6, 0.2, 0.4); // skybridge
        add('b', 'g', 0, 1.55, 0.21, 0.5, 0.1, 0.05); // skybridge windows
        add('c', 'd', 0, 3.2, 0, 0.4, 0.1, 0.4); // helipad
    } else {
        // T6: Utopian Finance Floating Citadel
        add('c', 'd', 0, 0, 0, 0.95, 0.2, 0.95); // platform
        add('c', 'l', 0, 0.2, 0, 0.8, 0.4, 0.8);
        
        let core = add('c', 'g', 0, 0.6, 0, 0.4, 3.5, 0.4); // glowing power core
        core.userData.anim = "flicker";
        
        // Rotating orbital rings
        let ringGroup = new THREE.Group();
        ringGroup.position.set(0, 2.0, 0);
        let r1 = new THREE.Mesh(geos.t, mats.m); r1.scale.set(1.2, 1.2, 1.2); r1.rotation.x = Math.PI/2; r1.rotation.y = 0.2;
        let r2 = new THREE.Mesh(geos.t, mats.a); r2.scale.set(1.4, 1.4, 1.4); r2.rotation.x = Math.PI/2; r2.rotation.y = -0.2;
        ringGroup.add(r1, r2);
        ringGroup.userData.anim = "spin";
        group.add(ringGroup);

        // Floating holo-coin
        let coin = add('c', 'g', 0, 4.3, 0, 0.3, 0.05, 0.3, Math.PI/2);
        coin.userData.anim = "bob";
        
        // Geometric floating shards
        [-0.5, 0.5].forEach(x => {
            let shard = add('p4', 'm', x, 1.0, 0, 0.2, 1.5, 0.2);
            shard.userData.anim = "bob";
        });
    }
    return window.CityUtils.finishBuilding(group);
};
