window.CityBuildings = window.CityBuildings || {};
window.CityBuildings.pool = function (tier, palette) {
    const group = new THREE.Group();
    const { geos, mats } = window.CityUtils.setup(palette);
    const add = window.CityUtils.createAdder(group, geos, mats);

    if (tier === 1) {
        add('b', 'l', 0, 0, 0, 0.6, 0.05, 0.6); // patio
        add('c', 'a', 0, 0.05, 0, 0.4, 0.1, 0.4); // kiddie pool rim
        add('c', 'g', 0, 0.1, 0, 0.35, 0.02, 0.35).userData.anim = "bob"; // water
    } else if (tier === 2) {
        add('b', 'l', 0, 0, 0, 0.8, 0.05, 0.8);
        add('c', 'd', 0, 0.05, 0, 0.6, 0.3, 0.6); // above ground pool
        add('c', 'g', 0, 0.3, 0, 0.55, 0.02, 0.55).userData.anim = "bob"; 
        add('b', 'm', 0.3, 0.05, 0, 0.1, 0.35, 0.1); // ladder
    } else if (tier === 3) {
        add('b', 'l', 0, 0, 0, 0.9, 0.2, 0.9); // raised deck
        add('b', 'm', 0, 0.2, 0, 0.7, 0.05, 0.5); // pool border
        add('b', 'g', 0, 0.22, 0, 0.6, 0.02, 0.4).userData.anim = "bob"; // in-ground water
        add('b', 'd', -0.3, 0.2, 0, 0.2, 0.05, 0.1); // diving board
    } else if (tier === 4) {
        add('b', 'l', 0, 0, 0, 1.0, 0.1, 1.0); // luxury deck
        add('c', 'm', 0, 0.1, 0, 0.8, 0.05, 0.6); // curved resort pool
        add('c', 'g', 0, 0.12, 0, 0.75, 0.02, 0.55).userData.anim = "bob";
        // Cabana
        add('b', 'd', 0, 0.1, -0.35, 0.4, 0.3, 0.2);
        add('b', 'a', 0, 0.4, -0.35, 0.45, 0.05, 0.25);
        // Floating ring
        add('t15', 'a', 0.1, 0.13, 0, 0.15, 0.15, 0.15, Math.PI/2).userData.anim = "spin";
    } else if (tier === 5) {
        // Aqua Park
        add('b', 'l', 0, 0, 0, 1.0, 0.1, 1.0);
        add('c', 'g', 0, 0.1, 0, 0.9, 0.05, 0.9).userData.anim = "bob"; // massive wave pool
        add('c', 'd', -0.2, 0.1, -0.2, 0.2, 1.0, 0.2); // slide tower
        // Spiral Slide
        let slide = new THREE.Group();
        slide.position.set(-0.2, 0.1, -0.2);
        for(let i=0; i<8; i++) {
            let angle = (i/8)*Math.PI*2;
            let s = new THREE.Mesh(geos.b, mats.a);
            s.scale.set(0.15, 0.1, 0.15);
            s.position.set(Math.cos(angle)*0.2, 1.0 - (i*0.1), Math.sin(angle)*0.2);
            slide.add(s);
        }
        group.add(slide);
    } else {
        // Anti-Gravity Infinity Pool
        let base = add('c', 'd', 0, 0.5, 0, 0.8, 0.2, 0.8);
        base.userData.anim = "bob";
        
        let waterSphere = add('c', 'g', 0, 1.2, 0, 0.6, 0.6, 0.6); // spherical floating water
        waterSphere.geometry = new THREE.SphereGeometry(0.5, 16, 16); // override to sphere
        waterSphere.userData.anim = "spin";

        // Containment rings
        let rings = new THREE.Group();
        rings.position.set(0, 1.2, 0);
        let r1 = new THREE.Mesh(geos.t15, mats.a); r1.scale.set(1.4, 1.4, 1.4); r1.rotation.x = Math.PI/2;
        let r2 = new THREE.Mesh(geos.t15, mats.l); r2.scale.set(1.5, 1.5, 1.5); r2.rotation.y = Math.PI/2;
        rings.add(r1, r2);
        rings.userData.anim = "spin";
        group.add(rings);
    }
    return window.CityUtils.finishBuilding(group);
};
